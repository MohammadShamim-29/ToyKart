import express from "express";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.use(protect, admin);
router.get("/", getAdminDashboard);

export default router;
