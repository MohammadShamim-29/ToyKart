import express from "express";
import {
  forgotPassword,
  getMe,
  loginAdminUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resendVerification,
  resetPassword,
  updateUserPassword,
  updateUserProfile,
  verifyEmail,
  verifyResetOtp
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authLimiter, otpLimiter } from "../middleware/authRateLimit.js";

const router = express.Router();

router.use(authLimiter);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdminUser);
router.post("/refresh", refreshAccessToken);
router.post("/logout", protect, logoutUser);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/verify-reset-otp", otpLimiter, verifyResetOtp);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.get("/verify-email/:token", verifyEmail);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", otpLimiter, resendVerification);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateUserProfile);
router.patch("/password", protect, updateUserPassword);

export default router;
