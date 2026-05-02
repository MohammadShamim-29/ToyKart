import express from "express";
import {
  cancelMyOrder,
  createOrder,
  getMyOrderById,
  getMyOrders,
  deleteMyOrderHistory,
  initSslCommerzPayment,
  sslCommerzCancel,
  sslCommerzFail,
  sslCommerzIpn,
  sslCommerzSuccess
} from "../controllers/orderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.post("/payment/sslcommerz/success", sslCommerzSuccess);
router.post("/payment/sslcommerz/fail", sslCommerzFail);
router.post("/payment/sslcommerz/cancel", sslCommerzCancel);
router.post("/payment/sslcommerz/ipn", sslCommerzIpn);
router.get("/my", protect, getMyOrders);
router.post("/:id/pay/sslcommerz", protect, initSslCommerzPayment);
router.get("/:id", protect, getMyOrderById);
router.patch("/:id/cancel", protect, cancelMyOrder);
router.patch("/:id/delete-history", protect, deleteMyOrderHistory);

export default router;
