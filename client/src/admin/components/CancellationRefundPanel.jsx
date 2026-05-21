import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import { useRecordContext, useRefresh } from "react-admin";
import ApproveCancellationButton from "./ApproveCancellationButton";
import ProcessRefundButton from "./ProcessRefundButton";
import RefundStatusChip from "./RefundStatusChip";

const CancellationRefundPanel = () => {
  const record = useRecordContext();
  const refresh = useRefresh();

  if (!record) return null;

  const isCancelled = record.status === "cancelled" || record.cancelledAt;
  const isRefunded =
    record.status === "refunded" ||
    record.refundStatus === "success" ||
    record.paymentStatus === "refunded";
  const approved = Boolean(record.cancellationApprovedAt);
  const bankTxn = record.bankTranId || record.paymentReference;
  const isSsl = record.paymentMethod === "SSLCommerz";

  if (!isCancelled && !isRefunded) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Cancellation & refund
      </Typography>

      <Stack spacing={1.25}>
        {record.cancelReason ? (
          <Alert severity="info" variant="outlined" sx={{ borderRadius: 2 }}>
            <strong>Cancel reason:</strong> {record.cancelReason}
          </Alert>
        ) : null}

        {approved ? (
          <Chip label="Cancellation approved" color="success" size="small" variant="outlined" />
        ) : (
          <Chip label="Awaiting cancellation approval" color="warning" size="small" variant="outlined" />
        )}

        {isSsl && bankTxn ? (
          <Typography variant="caption" color="text.secondary">
            SSLCommerz transaction ID (auto-used for refund): <strong>{bankTxn}</strong>
          </Typography>
        ) : null}

        {isRefunded ? (
          <Alert severity="success" variant="outlined" sx={{ borderRadius: 2 }}>
            Refund completed
            {record.refund?.amount ? ` — ৳${record.refund.amount}` : ""}
            {record.refundRefId ? ` (Ref: ${record.refundRefId})` : ""}
          </Alert>
        ) : null}

        <RefundStatusChip
          refund={{ status: record.refundStatus, refundRefId: record.refundRefId }}
          order={record}
          onRefresh={refresh}
        />

        {!isRefunded ? (
          <Stack spacing={1}>
            <ApproveCancellationButton
              orderId={record.id}
              order={record}
              onSuccess={() => refresh()}
              fullWidth
            />
            <ProcessRefundButton
              orderId={record.id}
              order={record}
              onSuccess={() => refresh()}
              fullWidth
            />
            {!isSsl ? (
              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
                Cash on Delivery orders are refunded manually outside the SSLCommerz gateway.
              </Alert>
            ) : null}
            {isSsl && !bankTxn ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
                No SSLCommerz transaction ID on this order. Refund cannot be sent to the gateway until payment
                data is recorded.
              </Alert>
            ) : null}
            {isSsl && approved && bankTxn ? (
              <Typography variant="caption" color="text.secondary">
                After approval, use Process Refund to send the full order amount back through SSLCommerz.
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
};

export default CancellationRefundPanel;
