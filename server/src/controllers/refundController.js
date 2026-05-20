import { randomUUID } from "crypto";
import Refund from "../models/Refund.js";
import Order from "../models/Order.js";
import {
  processSSLCommerZRefund,
  checkRefundStatus,
  validateRefundEligibility
} from "../utils/sslcommerzRefund.js";
import { appendAdminNote, actorFromUser } from "../utils/orderLifecycle.js";

const normalizeText = (value) => String(value ?? "").trim();

/**
 * Process refund for an order
 * POST /api/refunds/process/:orderId
 */
export const processRefund = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { remarks, sourceType } = req.body;

    // Validate admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Fetch order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Validate refund eligibility
    const eligibility = validateRefundEligibility(order);
    if (!eligibility.isEligible) {
      return res.status(400).json({
        message: "Order is not eligible for refund",
        errors: eligibility.errors
      });
    }

    // Check if refund already processed successfully
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

    // Generate refund request ID
    const refundRequestId = `REFUND_${order._id}_${Date.now()}`;
    const refundRefId = `REFUND_REF_${randomUUID().slice(0, 12).toUpperCase()}`;

    // Create refund record
    const refund = new Refund({
      refundRequestId,
      orderId: order._id,
      userId: order.user,
      transactionId: order.paymentReference,
      bankTranId: order.bankTranId || order.paymentReference,
      refundAmount: order.totalPrice,
      refundRemarks: remarks || "Refund approved by admin",
      refundRefId,
      status: "processing",
      sourceType: sourceType || "cancellation",
      requestedBy: req.user._id,
      approvedBy: req.user._id,
      approvedAt: new Date()
    });

    await refund.save();

    try {
      // Call SSLCOMMERZ refund API
      const refundResponse = await processSSLCommerZRefund({
        bankTranId: order.bankTranId || order.paymentReference,
        refundAmount: order.totalPrice,
        refundRemarks: remarks || "Refund approved by admin",
        refundRefId
      });

      // Update refund record with gateway response
      refund.gatewayResponse = refundResponse.rawResponse;
      refund.status = refundResponse.success ? "success" : "failed";

      if (refundResponse.success) {
        refund.completedAt = new Date();
        refund.processedAt = new Date();

        // Update order
        order.refundStatus = "success";
        order.refundRefId = refundRefId;
        order.refundedAt = new Date();

        const actor = actorFromUser(req.user, "admin");
        appendAdminNote(order, {
          body: `Refund processed successfully. Refund Ref: ${refundRefId}. Amount: ৳${order.totalPrice}`,
          actor,
          isPrivate: true
        });

        await order.save();
      } else {
        refund.failureReason = refundResponse.message;
        order.refundStatus = "failed";
      }

      await refund.save();

      return res.json({
        message: refundResponse.success ? "Refund processed successfully" : "Refund processing failed",
        refund,
        gatewayResponse: refundResponse
      });
    } catch (error) {
      // Update refund as failed
      refund.status = "failed";
      refund.failureReason = error.message;
      await refund.save();

      order.refundStatus = "failed";
      await order.save();

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

/**
 * Check refund status
 * GET /api/refunds/status/:refundRefId
 */
export const getRefundStatus = async (req, res) => {
  try {
    const { refundRefId } = req.params;

    // Fetch refund record
    const refund = await Refund.findOne({ refundRefId }).populate(
      "orderId userId approvedBy"
    );

    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    // Only admin or order user can check status
    if (
      req.user.role !== "admin" &&
      String(refund.userId._id) !== String(req.user._id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    try {
      // Query SSLCOMMERZ for latest status
      const statusResponse = await checkRefundStatus(refundRefId);

      // Update refund record
      refund.gatewayResponse = statusResponse.rawResponse;

      if (statusResponse.status === "success" || statusResponse.status === "VALID") {
        refund.status = "success";
        refund.completedAt = new Date();
      }

      await refund.save();

      return res.json({
        message: "Refund status retrieved",
        refund,
        status: statusResponse.status
      });
    } catch (error) {
      return res.json({
        message: "Could not fetch from gateway, returning local record",
        refund,
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

/**
 * Get refunds for an order
 * GET /api/refunds/order/:orderId
 */
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

/**
 * Retry failed refund
 * POST /api/refunds/retry/:refundRefId
 */
export const retryFailedRefund = async (req, res) => {
  try {
    const { refundRefId } = req.params;
    const { remarks } = req.body;

    // Validate admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Find refund
    const refund = await Refund.findOne({ refundRefId });
    if (!refund) {
      return res.status(404).json({ message: "Refund not found" });
    }

    // Check if already successful
    if (refund.status === "success") {
      return res.status(400).json({ message: "Refund already succeeded" });
    }

    // Increment retry count
    refund.retryCount += 1;
    refund.lastRetryAt = new Date();

    // Limit retry attempts
    if (refund.retryCount > 5) {
      return res.status(400).json({
        message: "Maximum retry attempts exceeded",
        retryCount: refund.retryCount
      });
    }

    try {
      // Retry refund
      const refundResponse = await processSSLCommerZRefund({
        bankTranId: refund.bankTranId,
        refundAmount: refund.refundAmount,
        refundRemarks: remarks || refund.refundRemarks,
        refundRefId
      });

      refund.gatewayResponse = refundResponse.rawResponse;
      refund.status = refundResponse.success ? "success" : "failed";

      if (refundResponse.success) {
        refund.completedAt = new Date();
        refund.processedAt = new Date();
      } else {
        refund.failureReason = refundResponse.message;
      }

      await refund.save();

      return res.json({
        message: "Retry completed",
        refund,
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
 * Approve order cancellation
 * POST /api/refunds/approve-cancellation/:orderId
 */
export const approveCancellation = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate admin
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "cancelled") {
      return res.status(400).json({ message: "Order must be in cancelled status" });
    }

    const actor = actorFromUser(req.user, "admin");

    order.cancellationApprovedAt = new Date();
    order.cancellationApprovedBy = actor;

    appendAdminNote(order, {
      body: "Cancellation approved by admin",
      actor,
      isPrivate: true
    });

    await order.save();

    return res.json({
      message: "Cancellation approved",
      order
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
