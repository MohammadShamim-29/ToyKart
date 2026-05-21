import express from "express";
import {
  processRefund,
  getRefundStatus,
  getOrderRefunds,
  retryFailedRefund,
  approveCancellation
} from "../controllers/refundController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

/**
 * Refund Routes
 * All routes require authentication
 */

// Process refund for an order
router.post("/process/:orderId", protect, admin, processRefund);

// Get refund status by reference ID
router.get("/status/:refundRefId", protect, getRefundStatus);

// Get all refunds for an order
router.get("/order/:orderId", protect, admin, getOrderRefunds);

// Retry failed refund
router.post("/retry/:refundRefId", protect, admin, retryFailedRefund);

// Approve order cancellation
router.post("/approve-cancellation/:orderId", protect, admin, approveCancellation);

export default router;
