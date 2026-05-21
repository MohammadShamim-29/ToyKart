import { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Stack,
  Typography
} from "@mui/material";
import { useNotify } from "react-admin";
import refundAPI from "../../api/refundAPI";

const ProcessRefundButton = ({
  orderId,
  order,
  returnRequest,
  refundAmount,
  sourceType = "cancellation",
  defaultRemarks,
  onSuccess,
  disabled = false,
  variant = "contained",
  size = "small",
  fullWidth = false
}) => {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState(
    defaultRemarks ||
      (sourceType === "return"
        ? "Return approved — refund via SSLCommerz"
        : "Order cancelled — refund via SSLCommerz")
  );
  const [error, setError] = useState(null);

  const bankTxn = order?.bankTranId || order?.paymentReference;
  const amount =
    sourceType === "return"
      ? Number(refundAmount ?? returnRequest?.refundDetails?.finalRefundAmount ?? order?.totalPrice ?? 0)
      : Number(order?.totalPrice ?? 0);

  const isCancellationEligible =
    order?.status === "cancelled" &&
    Boolean(order?.cancellationApprovedAt) &&
    order?.paymentMethod === "SSLCommerz" &&
    order?.isPaid &&
    order?.refundStatus !== "success" &&
    Boolean(bankTxn);

  const isReturnEligible =
    returnRequest?.status === "REFUND_APPROVED" &&
    order?.paymentMethod === "SSLCommerz" &&
    order?.isPaid &&
    order?.refundStatus !== "success" &&
    Boolean(bankTxn) &&
    amount > 0;

  const isEligible = sourceType === "return" ? isReturnEligible : isCancellationEligible;

  const handleProcessRefund = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        remarks: remarks.trim() || defaultRemarks || "Refund via SSLCommerz",
        sourceType
      };
      if (sourceType === "return" && returnRequest?.id) {
        payload.returnRequestId = returnRequest.id;
        payload.refundAmount = amount;
      }

      const result = await refundAPI.processRefund(orderId, payload);

      notify("Refund processed successfully", { type: "success" });
      setOpen(false);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.errors) ? err.response.data.errors.join(". ") : null) ||
        err.message ||
        "Failed to process refund";
      setError(errorMessage);
      notify(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isEligible) {
    return null;
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        disabled={disabled || loading}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        color="warning"
      >
        {loading ? <CircularProgress size={20} /> : "Process Refund"}
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Process SSLCommerz Refund</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}

            <Alert severity="info">Refund amount: ৳{amount}</Alert>

            <Alert severity="success">
              <Typography variant="body2">
                Transaction ID (auto-fetched): <strong>{bankTxn}</strong>
              </Typography>
            </Alert>

            <TextField
              label="Refund remarks"
              multiline
              rows={3}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={loading}
            />

            <Alert severity="warning">
              {sourceType === "return"
                ? "This sends the approved return amount to SSLCommerz using the stored transaction ID, then marks the return as processed."
                : "This sends a full refund to SSLCommerz using the stored transaction ID. The order will move to Cancelled · Refunded."}
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleProcessRefund} variant="contained" color="warning" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm Refund"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProcessRefundButton;
