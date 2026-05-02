import express from "express";
import {
  addAdminOrderNote,
  cancelAdminOrder,
  getAdminOrder,
  listAdminOrders,
  refundAdminOrder,
  updateAdminOrder,
  updateAdminOrderStatus
} from "../controllers/adminOrderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.route("/").get(listAdminOrders);
router.route("/:id").get(getAdminOrder).put(updateAdminOrder);
router.patch("/:id/status", updateAdminOrderStatus);
router.post("/:id/notes", addAdminOrderNote);
router.patch("/:id/cancel", cancelAdminOrder);
router.patch("/:id/refund", refundAdminOrder);

export default router;

