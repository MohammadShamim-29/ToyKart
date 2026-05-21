import jwt from "jsonwebtoken";
import crypto from "crypto";

export const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "30d"
  });

export const generateRefreshToken = () => crypto.randomBytes(40).toString("hex");

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

export const generateSecureToken = () => crypto.randomBytes(32).toString("hex");
