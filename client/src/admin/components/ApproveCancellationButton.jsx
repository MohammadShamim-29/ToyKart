import React, { useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Stack
} from "@mui/material";
import { useNotify } from "react-admin";
import refundAPI from "../../api/refundAPI";

/**
 * Approve Cancellation Button Component
 * Allows admin to approve order cancellations
 */
export const ApproveCancellationButton = ({
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

  // Only show if cancellation is pending approval
  const isVisible =
    order?.status === "cancelled" &&
    !order?.cancellationApprovedAt;

  const handleClickOpen = () => {
    if (isVisible) {
      setOpen(true);
      setError(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await refundAPI.approveCancellation(orderId);

      notify("Cancellation approved successfully", { type: "success" });
      handleClose();

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
        onClick={handleClickOpen}
        color="success"
      >
        {loading ? <CircularProgress size={20} /> : "Approve Cancellation"}
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Order Cancellation</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Alert severity="info">
              Reason: {order?.cancelReason || "No reason provided"}
            </Alert>

            <Alert severity="warning">
              By approving this cancellation, you acknowledge that:
              <ul>
                <li>Customer can request a refund</li>
                <li>Inventory has been or will be restored</li>
                <li>Cancellation is final and irreversible</li>
              </ul>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Approve"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ApproveCancellationButton;
