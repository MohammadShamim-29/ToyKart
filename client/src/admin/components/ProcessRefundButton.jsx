import React, { useState } from "react";
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
  Typography,
  Chip
} from "@mui/material";
import { useNotify } from "react-admin";
import refundAPI from "../../api/refundAPI";

/**
 * Process Refund Button Component
 * Allows admin to process refunds for orders
 */
export const ProcessRefundButton = ({
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
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState(null);

  // Check if order is eligible for refund
  const isEligible =
    order?.paymentMethod === "SSLCommerz" &&
    order?.isPaid &&
    !order?.refundStatus?.includes("success");

  const handleClickOpen = () => {
    if (isEligible) {
      setOpen(true);
      setError(null);
      setRemarks("");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setRemarks("");
  };

  const handleProcessRefund = async () => {
    if (!remarks.trim()) {
      setError("Please provide refund remarks");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await refundAPI.processRefund(orderId, {
        remarks: remarks.trim(),
        sourceType: "cancellation"
      });

      notify("Refund processed successfully", { type: "success" });
      handleClose();

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to process refund";
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
        onClick={handleClickOpen}
        color="warning"
      >
        {loading ? <CircularProgress size={20} /> : "Process Refund"}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Alert severity="info">
              Refund Amount: ৳{order?.totalPrice || 0}
            </Alert>

            {order?.bankTranId && (
              <Alert severity="success">
                <Typography variant="body2">
                  Transaction ID: <strong>{order.bankTranId}</strong>
                </Typography>
              </Alert>
            )}

            <TextField
              label="Refund Remarks"
              multiline
              rows={3}
              fullWidth
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter reason for refund (optional)"
              disabled={loading}
            />

            <Alert severity="warning">
              This action will process a refund through SSL Commerz gateway.
              Please verify the order details before proceeding.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessRefund}
            variant="contained"
            color="warning"
            disabled={loading || !remarks.trim()}
          >
            {loading ? <CircularProgress size={20} /> : "Confirm Refund"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProcessRefundButton;
