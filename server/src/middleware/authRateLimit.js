import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." }
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 8,
  message: { message: "Too many OTP requests. Try again in an hour." }
});
