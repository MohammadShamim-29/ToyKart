import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateOtp,
  generateRefreshToken,
  generateSecureToken,
  hashToken
} from "../utils/generateToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { resetOtpEmail, verificationEmail } from "../utils/emailTemplates.js";

const REFRESH_COOKIE = "toykart_refresh";
const REFRESH_DAYS = 7;
const OTP_MINUTES = Number(process.env.OTP_EXPIRE_MINUTES || 10);

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();
const normalizeUsername = (value) => String(value || "").trim().toLowerCase();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => {
  const raw = String(password || "");
  if (raw.length < 8) return "Password must be at least 8 characters";
  if (raw.length > 72) return "Password must be at most 72 characters";
  if (!/[a-z]/.test(raw) || !/[A-Z]/.test(raw) || !/\d/.test(raw) || !/[^A-Za-z0-9]/.test(raw)) {
    return "Password must include uppercase, lowercase, number, and special character";
  }
  return null;
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/auth"
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
};

const issueAuthResponse = async (user, res, { remember = true } = {}) => {
  const payload = sanitizeAuthUser(user);
  if (remember) {
    const refreshToken = generateRefreshToken();
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save({ validateBeforeSave: false });
    setRefreshCookie(res, refreshToken);
  }
  return res.json(payload);
};

const sanitizeAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  username: user.username || "",
  avatar: user.avatar || "",
  isAdmin: user.isAdmin,
  isVerified: Boolean(user.isVerified),
  createdAt: user.createdAt,
  token: generateAccessToken(user._id)
});

const sendVerificationEmail = async (user) => {
  const token = generateSecureToken();
  user.emailVerificationToken = hashToken(token);
  user.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const apiUrl = process.env.SERVER_BASE_URL || "http://localhost:5000";
  const link = `${clientUrl}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
  const apiLink = `${apiUrl}/api/auth/verify-email/${token}?email=${encodeURIComponent(user.email)}`;
  const tpl = verificationEmail({ name: user.name, link });

  await sendEmail({
    to: user.email,
    subject: tpl.subject,
    text: `${tpl.text}\n\nAPI link: ${apiLink}`,
    html: `${tpl.html}<p style="font-size:12px;color:#999;margin-top:16px">Direct API: <a href="${apiLink}">${apiLink}</a></p>`
  });
};

const findUserByResetOtp = async (email, otp) => {
  const user = await User.findOne({ email }).select(
    "+resetPasswordOTP +resetPasswordExpires +resetPasswordVerifiedAt"
  );
  if (!user?.resetPasswordOTP || !user.resetPasswordExpires) return { user: null, valid: false };
  if (user.resetPasswordExpires < new Date()) return { user, valid: false, expired: true };
  if (user.resetPasswordOTP !== hashToken(otp)) return { user, valid: false };
  return { user, valid: true };
};

const clearResetFields = (user) => {
  user.resetPasswordOTP = undefined;
  user.resetPasswordExpires = undefined;
  user.resetPasswordVerifiedAt = undefined;
};

export const registerUser = async (req, res) => {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const phone = normalizePhone(req.body?.phone);
  const username = normalizeUsername(req.body?.username);
  const password = String(req.body?.password || "");
  const address = String(req.body?.address || "").trim();
  const avatar = String(req.body?.avatar || "").trim();
  const newsletter = Boolean(req.body?.newsletter);

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "Name, email, phone, and password are required" });
  }

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: "Name must be between 2 and 60 characters" });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    return res.status(400).json({ message: "Please provide a valid phone number" });
  }

  if (username && !/^[a-z0-9_]{3,32}$/.test(username)) {
    return res.status(400).json({ message: "Username must be 3–32 characters (letters, numbers, underscore)" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const existingUser = await User.findOne({ $or: [{ email }, ...(username ? [{ username }] : [])] });
  if (existingUser) {
    return res.status(400).json({
      message: existingUser.email === email ? "Email already registered" : "Username already taken"
    });
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    phone,
    username: username || undefined,
    password: hashedPassword,
    address,
    avatar,
    newsletter,
    isVerified: false
  });

  try {
    await sendVerificationEmail(user);
  } catch (err) {
    console.error("[ToyKart] verification email failed", err.message);
  }

  return res.status(201).json({
    message: "Account created. We sent a verification link to your email (optional).",
    email: user.email,
    isVerified: false
  });
};

export const loginUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const remember = req.body?.remember !== false;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email }).select("+refreshTokenHash");
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  return issueAuthResponse(user, res, { remember });
};

export const loginAdminUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  if (!user.isAdmin) return res.status(403).json({ message: "Admin access required" });

  return res.json(sanitizeAuthUser(user));
};

export const refreshAccessToken = async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) return res.status(401).json({ message: "Refresh token missing" });

  const user = await User.findOne({ refreshTokenHash: hashToken(raw) }).select("+refreshTokenHash");
  if (!user) {
    clearRefreshCookie(res);
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const refreshToken = generateRefreshToken();
  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });
  setRefreshCookie(res, refreshToken);

  return res.json(sanitizeAuthUser(user));
};

export const logoutUser = async (req, res) => {
  if (req.user?._id) {
    const user = await User.findById(req.user._id).select("+refreshTokenHash");
    if (user) {
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
    }
  }
  clearRefreshCookie(res);
  return res.json({ message: "Logged out" });
};

export const forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  if (!isValidEmail(email)) {
    return res.status(400).json({ message: "Valid email is required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ message: "If that email exists, we sent a verification code." });
  }

  const otp = generateOtp();
  user.resetPasswordOTP = hashToken(otp);
  user.resetPasswordExpires = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  user.resetPasswordVerifiedAt = undefined;
  await user.save({ validateBeforeSave: false });

  const tpl = resetOtpEmail({ name: user.name, otp, minutes: OTP_MINUTES });

  try {
    await sendEmail({ to: user.email, subject: tpl.subject, text: tpl.text, html: tpl.html });
  } catch (err) {
    console.error("[ToyKart] forgot-password email failed", err.message);
    return res.status(503).json({
      message: "Could not send email. Check server Gmail settings and try again."
    });
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[ToyKart OTP] ${email}: ${otp}`);
  }

  const payload = {
    message: "If that email exists, we sent a verification code. Check inbox and spam.",
    expiresIn: OTP_MINUTES * 60
  };

  if (process.env.DEV_SHOW_OTP === "true" && process.env.NODE_ENV !== "production") {
    payload.devOtp = otp;
  }

  return res.json(payload);
};

export const verifyResetOtp = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const { user, valid, expired } = await findUserByResetOtp(email, otp);
  if (!user) {
    return res.json({ message: "If the code is valid, you can set a new password.", verified: false });
  }

  if (expired) {
    return res.status(400).json({ message: "Code expired. Request a new one." });
  }

  if (!valid) {
    return res.status(400).json({ message: "Invalid verification code" });
  }

  user.resetPasswordVerifiedAt = new Date();
  await user.save({ validateBeforeSave: false });

  return res.json({
    message: "Code verified. You can set a new password.",
    verified: true,
    expiresIn: OTP_MINUTES * 60
  });
};

export const resetPassword = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const otp = String(req.body?.otp || "").trim();
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and new password are required" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const user = await User.findOne({ email }).select(
    "+resetPasswordOTP +resetPasswordExpires +resetPasswordVerifiedAt"
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset session" });
  }

  const verifiedAt = user.resetPasswordVerifiedAt;
  const verifiedRecently =
    verifiedAt && verifiedAt > new Date(Date.now() - OTP_MINUTES * 60 * 1000);

  if (!verifiedRecently) {
    if (!otp) {
      return res.status(400).json({ message: "Verify OTP first or include otp in this request" });
    }
    const check = await findUserByResetOtp(email, otp);
    if (!check.valid) {
      return res.status(400).json({
        message: check.expired ? "Code expired. Request a new one." : "Invalid verification code"
      });
    }
  } else if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
    return res.status(400).json({ message: "Reset session expired. Request a new code." });
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(password, salt);
  clearResetFields(user);
  user.refreshTokenHash = undefined;
  await user.save();

  clearRefreshCookie(res);
  return res.json({ message: "Password reset successful. You can sign in now." });
};

export const verifyEmail = async (req, res) => {
  const email = normalizeEmail(req.body?.email || req.query?.email);
  const token = String(req.body?.token || req.params?.token || req.query?.token || "").trim();

  if (!email || !token) {
    return res.status(400).json({ message: "Verification token and email are required" });
  }

  const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpire");
  if (!user?.emailVerificationToken) {
    return res.status(400).json({ message: "Invalid or already verified" });
  }

  if (user.emailVerificationExpire < new Date()) {
    return res.status(400).json({ message: "Verification link expired" });
  }

  if (user.emailVerificationToken !== hashToken(token)) {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save({ validateBeforeSave: false });

  return res.json({ message: "Email verified successfully!", verified: true, isVerified: true });
};

export const resendVerification = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const user = await User.findOne({ email }).select("+emailVerificationToken +emailVerificationExpire");

  if (!user) {
    return res.json({ message: "If that email is registered, we sent a new link." });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: "Email is already verified" });
  }

  await sendVerificationEmail(user);
  return res.json({ message: "Verification email sent." });
};

export const getMe = async (req, res) => {
  return res.json(req.user);
};

export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const name = normalizeName(req.body?.name);
  const phone = normalizePhone(req.body?.phone);
  const avatar = String(req.body?.avatar || "").trim();
  const address = req.body?.address;

  if (name) {
    if (name.length < 2 || name.length > 60) {
      return res.status(400).json({ message: "Name must be between 2 and 60 characters" });
    }
    user.name = name;
  }

  if (phone) {
    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      return res.status(400).json({ message: "Please provide a valid phone number" });
    }
    user.phone = phone;
  }

  if (avatar !== undefined) user.avatar = avatar;
  if (address !== undefined) user.address = String(address).trim();

  const updatedUser = await user.save();
  return res.json(sanitizeAuthUser(updatedUser));
};

export const updateUserPassword = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

  const passwordError = validatePassword(newPassword);
  if (passwordError) return res.status(400).json({ message: passwordError });

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return res.json({ message: "Password updated successfully" });
};
