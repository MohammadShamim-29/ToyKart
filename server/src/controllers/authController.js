import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const normalizeName = (value) => String(value || "").trim().replace(/\s+/g, " ");
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const normalizePhone = (value) => String(value || "").trim();

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => {
  const raw = String(password || "");
  if (raw.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (raw.length > 72) {
    return "Password must be at most 72 characters";
  }
  if (!/[a-z]/.test(raw) || !/[A-Z]/.test(raw) || !/\d/.test(raw) || !/[^A-Za-z0-9]/.test(raw)) {
    return "Password must include uppercase, lowercase, number, and special character";
  }
  return null;
};

const sanitizeAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  avatar: user.avatar || "",
  isAdmin: user.isAdmin,
  createdAt: user.createdAt,
  token: generateToken(user._id)
});

export const registerUser = async (req, res) => {
  const name = normalizeName(req.body?.name);
  const email = normalizeEmail(req.body?.email);
  const phone = normalizePhone(req.body?.phone);
  const password = String(req.body?.password || "");

  if (!name || !email || !phone || !password) {
    return res.status(400).json({ message: "Name, email, phone, and password are required" });
  }

  if (name.length < 2 || name.length > 60) {
    return res.status(400).json({ message: "Name must be between 2 and 60 characters" });
  }

  if (!isValidEmail(email) || email.length > 254) {
    return res.status(400).json({ message: "Please provide a valid email address" });
  }

  if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
    return res.status(400).json({ message: "Please provide a valid phone number" });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    phone,
    password: hashedPassword
  });

  sendWelcomeEmail(user);

  return res.status(201).json(sanitizeAuthUser(user));
};

export const loginUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  return res.json(sanitizeAuthUser(user));
};

export const loginAdminUser = async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  return res.json(sanitizeAuthUser(user));
};

export const getMe = async (req, res) => {
  return res.json(req.user);
};

export const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const name = normalizeName(req.body?.name);
  const phone = normalizePhone(req.body?.phone);
  const avatar = String(req.body?.avatar || "").trim();

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

  if (avatar !== undefined) {
    user.avatar = avatar;
  }

  const updatedUser = await user.save();
  return res.json(sanitizeAuthUser(updatedUser));
};

export const updateUserPassword = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return res.status(400).json({ message: passwordError });
  }

  const salt = await bcrypt.genSalt(12);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return res.json({ message: "Password updated successfully" });
};
