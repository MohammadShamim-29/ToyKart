import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";

const normalizeText = (value) => String(value ?? "").trim();

const userIdFromParams = (req, res) => {
  const raw = req.params.id;
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") {
    res.status(400).json({ message: "Invalid user id" });
    return null;
  }

  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid user id" });
    return null;
  }

  return id;
};

const serializeUser = (userDoc) => {
  const user = typeof userDoc.toObject === "function" ? userDoc.toObject({ virtuals: false }) : userDoc;
  const { password, ...safe } = user || {};
  return safe;
};

export const listAdminUsers = async (req, res) => {
  const q = normalizeText(req.query.q);
  const isAdminParam = normalizeText(req.query.isAdmin).toLowerCase();

  const query = {};
  if (isAdminParam === "true") query.isAdmin = true;
  if (isAdminParam === "false") query.isAdmin = false;

  if (q) {
    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const sortField = normalizeText(req.query.sortField) || "createdAt";
  const sortOrder = normalizeText(req.query.sortOrder).toUpperCase() === "ASC" ? 1 : -1;
  const safeSortField = ["createdAt", "updatedAt", "name", "email"].includes(sortField) ? sortField : "createdAt";

  const users = await User.find(query)
    .select("name email phone isAdmin createdAt updatedAt")
    .sort({ [safeSortField]: sortOrder, createdAt: -1 });

  return res.json(users.map(serializeUser));
};

export const getAdminUser = async (req, res) => {
  const id = userIdFromParams(req, res);
  if (!id) return;

  const user = await User.findById(id).select("name email phone isAdmin createdAt updatedAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const [orderCount, latestOrder] = await Promise.all([
    Order.countDocuments({ user: user._id }),
    Order.findOne({ user: user._id }).sort({ createdAt: -1 }).select("_id createdAt status totalPrice")
  ]);

  return res.json({
    ...serializeUser(user),
    orderCount,
    latestOrder: latestOrder
      ? {
          _id: latestOrder._id,
          createdAt: latestOrder.createdAt,
          status: latestOrder.status,
          totalPrice: latestOrder.totalPrice
        }
      : null
  });
};

export const deleteAdminUser = async (req, res) => {
  const id = userIdFromParams(req, res);
  if (!id) return;

  if (String(req.user?._id) === String(id)) {
    return res.status(400).json({ message: "You cannot delete your own account while logged in." });
  }

  const user = await User.findById(id).select("name email phone isAdmin createdAt updatedAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  await User.deleteOne({ _id: user._id });

  return res.json(serializeUser(user));
};
