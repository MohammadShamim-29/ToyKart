import { randomUUID } from "crypto";
import Refund from "../models/Refund.js";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import {
  processSSLCommerZRefund,
  checkRefundStatus,
  validateRefundEligibility,
  resolveSslBankTranId,
  buildRefundTransId
} from "../utils/sslcommerzRefund.js";
import { appendAdminNote, actorFromUser, setOrderStatus } from "../utils/orderLifecycle.js";
import {
  notifyCancellationApproved,
  notifyOrderRefunded,
  notifyRefundFailed
} from "../utils/notifyUserEmail.js";

const finalizeReturnRequestAfterRefund = async ({
  returnRequestId,
  order,
  bankTranId,
  refundRefId,
  refundAmount,
  remarks,
  actor
}) => {
  if (!returnRequestId) return null;

  const row = await ReturnRequest.findById(returnRequestId).populate("user", "name email");
  if (!row) return null;

  const now = new Date();
  const amount = Number(refundAmount) || 0;

  row.refundDetails = {
    ...(row.refundDetails?.toObject?.() || row.refundDetails || {}),
    transactionId: bankTranId,
    sslRefundRefId: refundRefId,
    processedAt: now
  };
  row.status = "REFUND_PROCESSED";
  row.timeline.push({
    status: "REFUND_PROCESSED",
    note: `SSLCommerz refund processed. Amount: ৳${amount}. Ref: ${refundRefId}. Bank Txn: ${bankTranId}`,
    actorRole: "admin",
    actorName: actor?.name || "Admin",
    createdAt: now
  });

  await row.save();
  return row;
};

/**
 * Process refund for an order
 * POST /api/refunds/process/:orderId
 */
export const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { remarks, sourceType: sourceTypeRaw, returnRequestId, refundAmount: refundAmountRaw } = req.body;
    const sourceType = sourceTypeRaw === "return" ? "return" : "cancellation";

    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (sourceType === "return") {
      const returnId = String(returnRequestId || "").trim();
      if (!returnId) {
        return res.status(400).json({ message: "Return request id is required for return refunds" });
      }
      const returnRow = await ReturnRequest.findById(returnId);
      if (!returnRow) {
        return res.status(404).json({ message: "Return request not found" });
      }
      if (returnRow.status !== "REFUND_APPROVED") {
        return res.status(400).json({ message: "Return refund must be approved before processing gateway refund" });
      }
      if (String(returnRow.order) !== String(order._id)) {
        return res.status(400).json({ message: "Return request does not match this order" });
      }
    }

    const eligibility = validateRefundEligibility(order, { sourceType });
    if (!eligibility.isEligible) {
      return res.status(400).json({
        message: eligibility.errors[0] || "Order is not eligible for refund",
        errors: eligibility.errors
      });
    }

    const refundAmount =
      sourceType === "return"
        ? Number(refundAmountRaw ?? req.body?.finalRefundAmount ?? order.totalPrice)
        : Number(order.totalPrice);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      return res.status(400).json({ message: "Invalid refund amount" });
    }
    if (refundAmount > Number(order.totalPrice || 0) + 0.01) {
      return res.status(400).json({ message: "Refund amount cannot exceed order total" });
    }

    const existingRefund = await Refund.findOne({
      orderId,
      status: "success"
    });

    if (existingRefund) {
      return res.status(400).json({
        message: "Refund already successfully processed for this order",
        refund: existingRefund
      });
    }

    const bankTranId = resolveSslBankTranId(order);
    const refundRequestId = `REFUND_${order._id}_${Date.now()}`;
    const refundRefId = `REFUND_REF_${randomUUID().slice(0, 12).toUpperCase()}`;
    const actor = actorFromUser(req.user, "admin");
    const now = new Date();
    const refundRemarks =
      String(remarks || "").trim() ||
      (sourceType === "return" ? "Return approved — refund via SSLCommerz" : "Refund approved by admin");

    const refund = new Refund({
      refundRequestId,
      orderId: order._id,
      userId: order.user,
      transactionId: bankTranId,
      bankTranId,
      refundAmount,
      refundRemarks,
      refundRefId,
      status: "processing",
      sourceType,
      requestedBy: req.user._id,
      approvedBy: req.user._id,
      approvedAt: now
    });

    await refund.save();

    try {
      const refundResponse = await processSSLCommerZRefund({
        bankTranId,
        refundAmount,
        refundRemarks,
        refundRefId,
        refundTransId: buildRefundTransId(refundRequestId)
      });

      refund.gatewayResponse = refundResponse.rawResponse;
      refund.status = refundResponse.success ? "success" : "failed";

      if (refundResponse.success) {
        refund.completedAt = now;
        refund.processedAt = now;

        order.refundStatus = "success";
        order.refundRefId = refundRefId;
        order.refundedAt = now;
        order.refund = {
          amount: refundAmount,
          reason: refundRemarks,
          refundedAt: now,
          refundedBy: actor,
          sslRefundRefId: refundResponse.refundRefId || refundRefId
        };

        if (sourceType === "cancellation") {
          setOrderStatus(order, {
            toStatus: "refunded",
            actor,
            note: `SSLCommerz refund processed (Txn: ${bankTranId}). Ref: ${refundRefId}`,
            at: now
          });
        } else if (order.status !== "returned") {
          try {
            setOrderStatus(order, {
              toStatus: "returned",
              actor,
              note: `Return refund via SSLCommerz. Ref: ${refundRefId}`,
              at: now
            });
          } catch {
            /* refund fields still saved below */
          }
        }

        appendAdminNote(order, {
          body: `Refund processed via SSLCommerz (${sourceType}). Amount: ৳${refundAmount}. Ref: ${refundRefId}. Bank Txn: ${bankTranId}`,
          actor,
          isPrivate: true,
          at: now
        });

        await order.save();

        notifyOrderRefunded(order, {
          amount: refundAmount,
          note: refundRemarks,
          transactionId: refundResponse.refundRefId || refundRefId,
          method: "SSLCommerz (original payment method)"
        });

        if (sourceType === "return") {
          await finalizeReturnRequestAfterRefund({
            returnRequestId: req.body.returnRequestId,
            order,
            bankTranId,
            refundRefId: refundResponse.refundRefId || refundRefId,
            refundAmount,
            remarks: refundRemarks,
            actor
          });
        }
      } else {
        refund.failureReason = refundResponse.message;
        order.refundStatus = "failed";
        await order.save();
      }

      await refund.save();

      if (!refundResponse.success) {
        notifyRefundFailed(order, refundResponse.message || "Gateway refund failed");
        return res.status(400).json({
          message: refundResponse.message || "SSLCommerz refund failed",
          refund,
          gatewayResponse: refundResponse
        });
      }

      return res.json({
        message: "Refund processed successfully",
        refund,
        order,
        gatewayResponse: refundResponse
      });
    } catch (error) {
      refund.status = "failed";
      refund.failureReason = error.message;
      await refund.save();

      order.refundStatus = "failed";
      await order.save();

      notifyRefundFailed(order, error.message);

      return res.status(502).json({
        message: "Refund processing failed",
        error: error.message,
        refund
      });
    }
  } catch (error) {
    console.error("Process refund error:", error);
    return res.status(500).json({
      message: "Error processing refund",
      error: error.message
    });
  }
};

const normalizeRefundDisplayStatus = (gatewayStatus, localStatus) => {
  const g = String(gatewayStatus || "").toLowerCase();
  const l = String(localStatus || "").toLowerCase();
  if (l === "success" || ["success", "valid", "refunded"].includes(g)) return "success";
  if (l === "failed" || g === "failed") return "failed";
  if (l === "processing" || g === "processing") return "processing";
  return l || g || "unknown";
};

export const getRefundStatus = async (req, res) => {
  try {
    const { refundRefId } = req.params;

    const refund = await Refund.findOne({ refundRefId }).populate("orderId userId approvedBy");

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    if (!req.user?.isAdmin && String(refund.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const order = refund.orderId;
    const localStatus =
      refund.status === "success" || order?.refundStatus === "success" ? "success" : refund.status;

    try {
      const statusResponse = await checkRefundStatus(refundRefId);
      refund.gatewayResponse = statusResponse.rawResponse;

      const gatewayStatus = String(statusResponse.status || "").toLowerCase();
      if (["success", "valid", "refunded"].includes(gatewayStatus)) {
        refund.status = "success";
        if (!refund.completedAt) refund.completedAt = new Date();
      }

      await refund.save();

      const displayStatus = normalizeRefundDisplayStatus(statusResponse.status, refund.status);

      return res.json({
        message: "Refund status retrieved",
        refund,
        status: displayStatus
      });
    } catch (error) {
      const displayStatus = normalizeRefundDisplayStatus(null, localStatus);

      return res.json({
        message:
          displayStatus === "success"
            ? "Refund completed (local record)"
            : "Could not fetch from gateway, returning local record",
        refund,
        status: displayStatus,
        gateway_error: error.message
      });
    }
  } catch (error) {
    console.error("Get refund status error:", error);
    return res.status(500).json({
      message: "Error retrieving refund status",
      error: error.message
    });
  }
};

export const getOrderRefunds = async (req, res) => {
  try {
    const { orderId } = req.params;

    const refunds = await Refund.find({ orderId })
      .populate("userId", "name email")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(refunds);
  } catch (error) {
    console.error("Get order refunds error:", error);
    return res.status(500).json({
      message: "Error retrieving refunds",
      error: error.message
    });
  }
};

export const retryFailedRefund = async (req, res) => {
  try {
    const { refundRefId } = req.params;
    const { remarks } = req.body;

    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const refund = await Refund.findOne({ refundRefId }).populate("orderId");
    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    if (refund.status === "success") {
      return res.status(400).json({ message: "Refund already succeeded" });
    }

    refund.retryCount += 1;
    refund.lastRetryAt = new Date();

    if (refund.retryCount > 5) {
      return res.status(400).json({
        message: "Maximum retry attempts exceeded",
        retryCount: refund.retryCount
      });
    }

    const order = refund.orderId;
    if (!order) {
      return res.status(404).json({ message: "Order not found for this refund" });
    }

    try {
      const refundResponse = await processSSLCommerZRefund({
        bankTranId: refund.bankTranId,
        refundAmount: refund.refundAmount,
        refundRemarks: remarks || refund.refundRemarks,
        refundRefId,
        refundTransId: buildRefundTransId(refund.refundRequestId || refundRefId)
      });

      refund.gatewayResponse = refundResponse.rawResponse;
      refund.status = refundResponse.success ? "success" : "failed";

      if (refundResponse.success) {
        const actor = actorFromUser(req.user, "admin");
        const now = new Date();
        refund.completedAt = now;
        refund.processedAt = now;

        order.refundStatus = "success";
        order.refundRefId = refundRefId;
        order.refundedAt = now;
        order.refund = {
          amount: refund.refundAmount,
          reason: remarks || refund.refundRemarks,
          refundedAt: now,
          refundedBy: actor,
          sslRefundRefId: refundResponse.refundRefId || refundRefId
        };

        if (order.status === "cancelled") {
          setOrderStatus(order, {
            toStatus: "refunded",
            actor,
            note: `SSLCommerz refund retry succeeded. Ref: ${refundRefId}`,
            at: now
          });
        }

        await order.save();
        notifyOrderRefunded(order, {
          amount: refund.refundAmount,
          note: remarks || refund.refundRemarks,
          transactionId: refundResponse.refundRefId || refundRefId,
          method: "SSLCommerz (original payment method)"
        });
      } else {
        refund.failureReason = refundResponse.message;
        notifyRefundFailed(order, refundResponse.message);
      }

      await refund.save();

      return res.json({
        message: "Retry completed",
        refund,
        order,
        success: refundResponse.success
      });
    } catch (error) {
      refund.status = "failed";
      refund.failureReason = error.message;
      await refund.save();

      return res.status(502).json({
        message: "Retry failed",
        error: error.message,
        refund
      });
    }
  } catch (error) {
    console.error("Retry refund error:", error);
    return res.status(500).json({
      message: "Error retrying refund",
      error: error.message
    });
  }
};

/**
 * Approve order cancellation (required before gateway refund)
 * POST /api/refunds/approve-cancellation/:orderId
 */
export const approveCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "cancelled") {
      return res.status(400).json({ message: "Order must be in cancelled status" });
    }

    if (order.cancellationApprovedAt) {
      return res.status(400).json({ message: "Cancellation already approved" });
    }

    const actor = actorFromUser(req.user, "admin");

    order.cancellationApprovedAt = new Date();
    order.cancellationApprovedBy = actor;

    appendAdminNote(order, {
      body: "Cancellation approved by admin. Refund can now be processed for eligible SSLCommerz payments.",
      actor,
      isPrivate: true
    });

    await order.save();

    const populated = await Order.findById(order._id).populate("user", "name email");

    notifyCancellationApproved(order);

    return res.json({
      message: "Cancellation approved",
      order: populated
    });
  } catch (error) {
    console.error("Approve cancellation error:", error);
    return res.status(500).json({
      message: "Error approving cancellation",
      error: error.message
    });
  }
};

export default {
  processRefund,
  getRefundStatus,
  getOrderRefunds,
  retryFailedRefund,
  approveCancellation
};
