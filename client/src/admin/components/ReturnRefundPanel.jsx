import { Alert, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRecordContext, useNotify, useRefresh } from "react-admin";
import { useState } from "react";
import api from "../../api";
import ProcessRefundButton from "./ProcessRefundButton";
import RefundStatusChip from "./RefundStatusChip";

const currency = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0
});

const isSslReturnRefundEligible = (record) => {
  const order = record?.order;
  if (!order) return false;
  if (record.status !== "REFUND_APPROVED") return false;
  if (order.paymentMethod !== "SSLCommerz" || !order.isPaid) return false;
  if (order.refundStatus === "success") return false;
  const bankTxn = order.bankTranId || order.paymentReference;
  if (!bankTxn || String(bankTxn).startsWith("TOYKART_")) return false;
  const method = record.refundMethod || record.refundDetails?.refundMethod || "OriginalPaymentMethod";
  return method === "OriginalPaymentMethod";
};

const ReturnRefundPanel = () => {
  const record = useRecordContext();
  const refresh = useRefresh();
  const notify = useNotify();
  const [completing, setCompleting] = useState(false);

  if (!record) return null;

  const order = record.order;
  const isCod = order?.paymentMethod === "CashOnDelivery";
  const canCompleteCod =
    record.status === "REFUND_APPROVED" &&
    isCod &&
    record.refundDetails?.finalRefundAmount != null;
  const bankTxn = order?.bankTranId || order?.paymentReference;
  const finalAmount = Number(record.refundDetails?.finalRefundAmount ?? order?.totalPrice ?? 0);
  const isRefunded =
    record.status === "REFUND_PROCESSED" || order?.refundStatus === "success";
  const sslEligible = isSslReturnRefundEligible(record);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Gateway refund (SSLCommerz)
      </Typography>

      {record.refundDetails?.finalRefundAmount ? (
        <Stack spacing={0.5} sx={{ mb: 1.5 }}>
          <Typography variant="body2">
            <strong>Approved:</strong> {currency.format(record.refundDetails.approvedAmount || 0)}
          </Typography>
          <Typography variant="body2">
            <strong>Final amount:</strong> {currency.format(record.refundDetails.finalRefundAmount)}
          </Typography>
          <Typography variant="body2">
            <strong>Method:</strong> {record.refundDetails.refundMethod || record.refundMethod || "—"}
          </Typography>
        </Stack>
      ) : null}

      {isRefunded ? (
        <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
          Refund processed
          {record.refundDetails?.transactionId
            ? ` — Txn: ${record.refundDetails.transactionId}`
            : bankTxn
              ? ` — Txn: ${bankTxn}`
              : ""}
          {record.refundDetails?.processedAt
            ? ` on ${new Date(record.refundDetails.processedAt).toLocaleDateString()}`
            : ""}
        </Alert>
      ) : record.status === "REFUND_APPROVED" ? (
        <Stack spacing={1.25}>
          {sslEligible && bankTxn ? (
            <>
              <Typography variant="subtitle2" fontWeight={600} color="success.main">
                Process Refund
              </Typography>
              <TextField
                size="small"
                label="Transaction ID"
                fullWidth
                value={bankTxn}
                InputProps={{ readOnly: true }}
                helperText="Auto-filled from the order’s SSLCommerz payment"
              />
            </>
          ) : null}

          <RefundStatusChip
            refund={{ status: order?.refundStatus, refundRefId: order?.refundRefId }}
            order={order}
            returnRequest={record}
            onRefresh={refresh}
          />

          {sslEligible ? (
            <>
              <ProcessRefundButton
                orderId={order?.id || order?._id}
                order={order}
                returnRequest={record}
                refundAmount={finalAmount}
                sourceType="return"
                defaultRemarks="Return approved — refund via SSLCommerz"
                onSuccess={() => refresh()}
                fullWidth
                variant="contained"
              />
              <Typography variant="caption" color="text.secondary">
                Processes the approved final amount through SSLCommerz and marks this return as processed.
              </Typography>
            </>
          ) : (
            <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
              {record.refundMethod !== "OriginalPaymentMethod" &&
              record.refundDetails?.refundMethod !== "OriginalPaymentMethod"
                ? "Gateway auto-refund applies only when refund method is Original Payment Method and the order was paid via SSLCommerz."
                : order?.paymentMethod !== "SSLCommerz"
                  ? "This order was not paid with SSLCommerz. Process the refund manually (bank / MFS) and update the return status."
                  : !order?.isPaid
                    ? "Order is not marked as paid."
                    : "No SSLCommerz transaction ID on this order. Record the refund manually after sending payment to the customer."}
            </Alert>
          )}
        </Stack>
      ) : record.status === "INSPECTION_COMPLETED" ? (
        <Typography variant="body2" color="text.secondary">
          Approve the refund amount above first. Then the SSLCommerz process button will appear here.
        </Typography>
      ) : null}

      {record.status === "REFUND_APPROVED" && !sslEligible && (
        <Chip label="Manual refund required" size="small" color="warning" variant="outlined" sx={{ mt: 1 }} />
      )}

      {canCompleteCod ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            After you send the refund (bank / bKash / Nagad), mark this return completed. No SSLCommerz step is
            required for COD orders.
          </Alert>
          <Button
            variant="contained"
            color="success"
            disabled={completing}
            onClick={async () => {
              const txn = window.prompt("Payment reference / txn ID (optional):", "");
              if (txn === null) return;
              setCompleting(true);
              try {
                await api.put(`admin/returns/${record.id}`, {
                  status: "COMPLETED",
                  note: "COD refund sent — return completed",
                  ...(txn.trim() ? { transactionId: txn.trim() } : {})
                });
                notify("Return completed", { type: "success" });
                refresh();
              } catch (err) {
                notify(err.response?.data?.message || "Could not complete return", { type: "error" });
              } finally {
                setCompleting(false);
              }
            }}
          >
            {completing ? "Completing…" : "Mark Completed (COD refund sent)"}
          </Button>
        </Stack>
      ) : null}
    </Paper>
  );
};

export default ReturnRefundPanel;
