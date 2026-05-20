import express from "express";
import {
  getAdminReturnRequest,
  listAdminReturnRequests,
  updateAdminReturnRequest,
  schedulePickup,
  markPickedUp,
  recordInspection,
  approveRefund,
  rejectRefund,
  processRefundFull,
  returnItemToCustomer,
  approveReplacement,
  markReplacementShipped,
  markReplacementDelivered
} from "../controllers/adminReturnRequestController.js";
import { sendReturnMessage } from "../controllers/returnRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);
router.route("/").get(listAdminReturnRequests);
router.route("/:id").get(getAdminReturnRequest).put(updateAdminReturnRequest);
router.route("/:id/messages").post(sendReturnMessage);
router.route("/:id/pickup").post(schedulePickup);
router.route("/:id/picked-up").post(markPickedUp);
router.route("/:id/inspection").post(recordInspection);
router.route("/:id/approve-refund").post(approveRefund);
router.route("/:id/reject-refund").post(rejectRefund);
router.route("/:id/process-refund").post(processRefundFull);
router.route("/:id/return-to-customer").post(returnItemToCustomer);
router.route("/:id/approve-replacement").post(approveReplacement);
router.route("/:id/replacement-shipped").post(markReplacementShipped);
router.route("/:id/replacement-delivered").post(markReplacementDelivered);

export default router;
