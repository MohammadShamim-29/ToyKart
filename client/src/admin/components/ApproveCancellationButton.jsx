import { useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack,
  Chip
} from "@mui/material";
import { useNotify } from "react-admin";
import refundAPI from "../../api/refundAPI";

const ApproveCancellationButton = ({
  orderId,
  order,
  onSuccess,
  disabled = false,
  variant = "contained",
  size = "small",
  fullWidth = false
}) => {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isVisible = order?.status === "cancelled" && !order?.cancellationApprovedAt;
  const isApproved = Boolean(order?.cancellationApprovedAt);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await refundAPI.approveCancellation(orderId);
      notify("Cancellation approved — refund can now be processed", { type: "success" });
      setOpen(false);
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to approve cancellation";
      setError(errorMessage);
      notify(errorMessage, { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (isApproved && order?.status === "cancelled") {
    return (
      <Chip
        label="Cancellation approved"
        color="success"
        size="small"
        variant="outlined"
        sx={{ width: fullWidth ? "100%" : undefined }}
      />
    );
  }

  if (!isVisible) {
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
        color="success"
      >
        {loading ? <CircularProgress size={20} /> : "Approve Cancellation"}
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve order cancellation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <Alert severity="info">Reason: {order?.cancelReason || "No reason provided"}</Alert>
            <Alert severity="warning">
              After approval, the Process Refund button will activate for paid SSLCommerz orders. The SSLCommerz
              transaction ID is picked up automatically from the order.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleApprove} variant="contained" color="success" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApproveCancellationButton;
