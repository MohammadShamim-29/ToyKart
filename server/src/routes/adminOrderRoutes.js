import express from "express";
import {
  addAdminOrderNote,
  cancelAdminOrder,
  deleteAdminOrder,
  getAdminOrder,
  listAdminOrders,
  getAdminOrderAnalytics,
  refundAdminOrder,
  updateAdminOrder,
  updateAdminOrderStatus
} from "../controllers/adminOrderController.js";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);

router.get("/analytics", (req, res, next) => {
  if (req.query.executive === "true") {
    return getAdminDashboard(req, res, next);
  }
  return getAdminOrderAnalytics(req, res, next);
});
router.get("/dashboard", getAdminDashboard);
router.route("/").get(listAdminOrders);
router.route("/:id").get(getAdminOrder).put(updateAdminOrder).delete(deleteAdminOrder);
router.patch("/:id/status", updateAdminOrderStatus);
router.post("/:id/notes", addAdminOrderNote);
router.patch("/:id/cancel", cancelAdminOrder);
router.patch("/:id/refund", refundAdminOrder);

export default router;

