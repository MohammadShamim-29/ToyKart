import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    username: {
      type: String,
      trim: true,
      lowercase: true,
      sparse: true,
      unique: true,
      maxlength: 32
    },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    address: { type: String, trim: true, default: "", maxlength: 500 },
    password: { type: String, required: true },
    avatar: { type: String, default: "" },
    provider: { type: String, default: "local" },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpire: { type: Date, select: false },
    resetPasswordOTP: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    resetPasswordVerifiedAt: { type: Date, select: false },
    refreshTokenHash: { type: String, select: false }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
