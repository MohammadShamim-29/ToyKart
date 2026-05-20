import express from "express";
import {
  createReturnRequest,
  getMyReturnRequestById,
  getMyReturnRequests,
  sendReturnMessage
} from "../controllers/returnRequestController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.route("/").post(createReturnRequest);
router.route("/my").get(getMyReturnRequests);
router.route("/:id").get(getMyReturnRequestById);
router.route("/:id/messages").post(sendReturnMessage);

export default router;
