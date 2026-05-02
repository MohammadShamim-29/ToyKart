import express from "express";
import {
  getAdminReturnRequest,
  listAdminReturnRequests,
  updateAdminReturnRequest
} from "../controllers/adminReturnRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);
router.route("/").get(listAdminReturnRequests);
router.route("/:id").get(getAdminReturnRequest).put(updateAdminReturnRequest);

export default router;
