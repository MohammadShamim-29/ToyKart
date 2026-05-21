import React, { useMemo, useState } from "react";
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

const normalizeStatus = (value) => {
  const s = String(value || "").toLowerCase();
  if (s === "success" || s === "valid" || s === "refunded") return "success";
  if (s === "failed") return "failed";
  if (s === "processing") return "processing";
  if (!s || s === "none") return "";
  return s;
};

const resolveEffectiveStatus = (refund, order, returnRequest) => {
  if (returnRequest?.status === "REFUND_PROCESSED") return "success";
  if (order?.refundStatus === "success" || order?.status === "refunded") return "success";
  return normalizeStatus(refund?.status);
};

/**
 * Refund Status Component
 * Displays and manages refund status
 */
export const RefundStatusChip = ({ refund, order, returnRequest, onRefresh }) => {
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [details, setDetails] = useState(null);

  const effectiveStatus = useMemo(
    () => resolveEffectiveStatus(refund, order, returnRequest),
    [refund?.status, order?.refundStatus, order?.status, returnRequest?.status]
  );

  const getStatusColor = () => {
    switch (effectiveStatus) {
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
    if (!effectiveStatus) return "No Refund";
    return effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1);
  };

  const handleCheckStatus = async () => {
    if (!refund?.refundRefId) {
      notify("No refund reference ID available", { type: "warning" });
      return;
    }

    setLoading(true);
    try {
      const result = await refundAPI.getRefundStatus(refund.refundRefId);
      const status =
        normalizeStatus(result.status) ||
        normalizeStatus(result.refund?.status) ||
        effectiveStatus ||
        "unknown";

      setDetails({
        ...result,
        status,
        refund: result.refund || null
      });
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

  const dialogStatus = details?.status ? normalizeStatus(details.status) : effectiveStatus;
  const dialogStatusLabel = dialogStatus
    ? dialogStatus.charAt(0).toUpperCase() + dialogStatus.slice(1)
    : "Unknown";
  const dialogSeverity =
    dialogStatus === "success" ? "success" : dialogStatus === "failed" ? "error" : "info";

  const refundRecord = details?.refund;

  return (
    <>
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title={`Status: ${getStatusLabel()}`}>
          <Chip label={getStatusLabel()} color={getStatusColor()} size="small" variant="outlined" />
        </Tooltip>

        {refund?.refundRefId && effectiveStatus !== "success" ? (
          <Button size="small" variant="outlined" disabled={loading} onClick={handleCheckStatus}>
            {loading ? <CircularProgress size={16} /> : "Check Status"}
          </Button>
        ) : null}
      </Stack>

      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="sm" fullWidth>
        <DialogTitle>Refund Details</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            {details && (
              <>
                <Alert severity={dialogSeverity}>
                  Status: <strong>{dialogStatusLabel}</strong>
                  {dialogStatus === "success" ? " — refund completed successfully" : ""}
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

                {(refundRecord?.refundAmount ?? order?.refund?.amount) != null && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Refund Amount
                    </Typography>
                    <Typography variant="body2">
                      ৳{refundRecord?.refundAmount ?? order?.refund?.amount ?? order?.totalPrice}
                    </Typography>
                  </div>
                )}

                {(refundRecord?.processedAt || order?.refundedAt) && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Processed At
                    </Typography>
                    <Typography variant="body2">
                      {new Date(refundRecord?.processedAt || order?.refundedAt).toLocaleString()}
                    </Typography>
                  </div>
                )}

                {refundRecord?.completedAt && (
                  <div>
                    <Typography variant="body2" color="textSecondary">
                      Completed At
                    </Typography>
                    <Typography variant="body2">
                      {new Date(refundRecord.completedAt).toLocaleString()}
                    </Typography>
                  </div>
                )}

                {refundRecord?.failureReason && (
                  <Alert severity="error">{refundRecord.failureReason}</Alert>
                )}

                {details.message && (
                  <Alert severity={dialogStatus === "success" ? "success" : "info"}>{details.message}</Alert>
                )}

                {details.gateway_error && dialogStatus !== "success" && (
                  <Alert severity="warning">Gateway: {details.gateway_error}</Alert>
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
