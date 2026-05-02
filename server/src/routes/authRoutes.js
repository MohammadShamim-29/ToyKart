import express from "express";
import { getMe, loginAdminUser, loginUser, registerUser } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdminUser);
router.get("/me", protect, getMe);

export default router;
