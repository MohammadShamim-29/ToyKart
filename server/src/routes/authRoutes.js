import express from "express";
import { getMe, loginAdminUser, loginUser, registerUser, updateUserProfile, updateUserPassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdminUser);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateUserProfile);
router.patch("/password", protect, updateUserPassword);

export default router;
