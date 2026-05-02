import mongoose from "mongoose";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";

const ACTIVE_STATUSES = new Set(["requested", "under_review", "more_info_required", "approved"]);

const asTrimmed = (v) => String(v ?? "").trim();

const requestTypeSafe = (value) => {
  const v = asTrimmed(value).toLowerCase();
  if (["return_refund", "refund_only", "exchange"].includes(v)) return v;
  return "return_refund";
};

const serializeReturnRequest = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  return {
    ...obj,
    id: String(obj._id)
  };
};

export const createReturnRequest = async (req, res) => {
  const orderId = asTrimmed(req.body?.orderId);
  const customerReason = asTrimmed(req.body?.customerReason);
  const requestType = requestTypeSafe(req.body?.requestType);

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  if (!customerReason) {
    return res.status(400).json({ message: "Reason is required" });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to request return for this order" });
  }

  const existingOpen = await ReturnRequest.findOne({
    order: order._id,
    user: req.user._id,
    status: { $in: [...ACTIVE_STATUSES] }
  });
  if (existingOpen) {
    return res.status(400).json({ message: "A return/refund request is already open for this order." });
  }

  const items = Array.isArray(order.orderItems)
    ? order.orderItems.map((it) => ({
        product: it.product,
        name: it.name,
        qty: it.qty,
        reason: customerReason
      }))
    : [];

  const created = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    requestType,
    status: "requested",
    customerReason,
    items,
    timeline: [
      {
        status: "requested",
        note: "Return/refund requested by customer",
        actorRole: "customer",
        actorName: req.user?.name || req.user?.email || "Customer",
        createdAt: new Date()
      }
    ]
  });

  await created.populate("order", "_id totalPrice status createdAt");
  return res.status(201).json(serializeReturnRequest(created));
};

export const getMyReturnRequests = async (req, res) => {
  const rows = await ReturnRequest.find({ user: req.user._id })
    .populate("order", "_id totalPrice status createdAt")
    .sort({ createdAt: -1 });
  return res.json(rows.map((r) => serializeReturnRequest(r)));
};

export const getMyReturnRequestById = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const row = await ReturnRequest.findById(id).populate("order", "_id totalPrice status createdAt");
  if (!row) return res.status(404).json({ message: "Return request not found" });
  if (String(row.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  return res.json(serializeReturnRequest(row));
};
