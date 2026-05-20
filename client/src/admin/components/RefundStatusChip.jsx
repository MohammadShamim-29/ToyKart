import React, { useState } from "react";
import {
  Button,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  Typography
} from "@mui/material";
import { useNotify } from "react-admin";
import refundAPI from "../../api/refundAPI";

/**
 * Refund Status Component
 * Displays and manages refund status
 */
export const RefundStatusChip = ({ refund, order, onRefresh }) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [details, setDetails] = useState(null);

  const getStatusColor = () => {
    switch (refund?.status) {
      case "success":
        return "success";
      case "failed":
        return "error";
      case "processing":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = () => {
    if (!refund || refund.status === "none" || !refund.status) {
      return "No Refund";
    }
    return refund.status.charAt(0).toUpperCase() + refund.status.slice(1);
  };

  const handleCheckStatus = async () => {
    if (!refund?.refundRefId) {
      notify("No refund reference ID available", { type: "warning" });
      return;
    }

    setLoading(true);
    try {
      const result = await refundAPI.getRefundStatus(refund.refundRefId);
      setDetails(result);
      setOpenDetails(true);
      notify("Refund status updated", { type: "success" });
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      notify(err.response?.data?.message || "Failed to check status", { type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
    setDetails(null);
  };

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={`Status: ${getStatusLabel()}`}>
          <Chip
            label={getStatusLabel()}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Tooltip>

        {refund?.refundRefId && (
          <Button
            size="small"
            variant="outlined"
            disabled={loading}
            onClick={handleCheckStatus}
          >
            {loading ? <CircularProgress size={16} /> : "Check Status"}
          </Button>
        )}
      </Stack>

      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Refund Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {details && (
              <>
                <Alert severity="info">
                  Status: <strong>{details.status || "Unknown"}</strong>
                </Alert>

                {refund?.refundRefId && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Refund Reference ID
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {refund.refundRefId}
                    </Typography>
                  </div>
                )}

                {refund?.refundAmount && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Refund Amount
                    </Typography>
                    <Typography variant="body2">
                      ৳{refund.refundAmount}
                    </Typography>
                  </div>
                )}

                {refund?.processedAt && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Processed At
                    </Typography>
                    <Typography variant="body2">
                      {new Date(refund.processedAt).toLocaleString()}
                    </Typography>
                  </div>
                )}

                {refund?.completedAt && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Completed At
                    </Typography>
                    <Typography variant="body2">
                      {new Date(refund.completedAt).toLocaleString()}
                    </Typography>
                  </div>
                )}

                {refund?.failureReason && (
                  <Alert severity="error">
                    {refund.failureReason}
                  </Alert>
                )}

                {details.message && (
                  <Alert severity="success">
                    {details.message}
                  </Alert>
                )}
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RefundStatusChip;
