import mongoose from "mongoose";
import Order from "../models/Order.js";
import ReturnRequest from "../models/ReturnRequest.js";
import { sendReturnSubmitted } from "../utils/mailer.js";

const asTrimmed = (v) => String(v ?? "").trim();

const serializeReturnRequest = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  return {
    ...obj,
    id: String(obj._id)
  };
};

export const createReturnRequest = async (req, res) => {
  const { orderId, reason: rawReason, customerReason, description, evidenceAttachments, refundMethod, refundAccountInfo, requestType } = req.body;
  const reason = asTrimmed(rawReason || customerReason);

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  if (!reason) {
    return res.status(400).json({ message: "Reason is required" });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (String(order.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized to request return for this order" });
  }

  // Business Rule: Only delivered orders can be returned
  if (order.status !== "delivered") {
    return res.status(400).json({ message: "Returns can only be requested for delivered orders." });
  }

  // Business Rule: Return request must be submitted within 7 days of delivery
  const deliveredAt = order.deliveredAt || order.updatedAt;
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  if (new Date() - new Date(deliveredAt) > sevenDaysInMs) {
    return res.status(400).json({ message: "Return period has expired (7 days from delivery)." });
  }

  const existingOpen = await ReturnRequest.findOne({
    order: order._id,
    user: req.user._id,
    status: { $nin: ["COMPLETED", "REJECTED", "CLOSED"] }
  });
  if (existingOpen) {
    return res.status(400).json({ message: "A return/refund request is already open for this order." });
  }

  const created = await ReturnRequest.create({
    order: order._id,
    user: req.user._id,
    orderItem: {
      // Assuming return for whole order or first item for simplicity, normally we'd pick items
      product: order.orderItems[0].product,
      name: order.orderItems[0].name,
      qty: order.orderItems[0].qty,
      price: order.orderItems[0].price
    },
    requestType: requestType || "return_refund",
    status: "PENDING",
    reason,
    description,
    evidenceAttachments: Array.isArray(evidenceAttachments) ? evidenceAttachments : [],
    refundMethod: refundMethod || "OriginalPaymentMethod",
    refundAccountInfo,
    timeline: [
      {
        status: "PENDING",
        note: "Return/refund requested by customer",
        actorRole: "customer",
        actorName: req.user?.name || req.user?.email || "Customer",
        createdAt: new Date()
      }
    ]
  });

  await created.populate("order", "_id itemsPrice shippingPrice taxPrice totalPrice status createdAt");
  sendReturnSubmitted(created, req.user);
  return res.status(201).json(serializeReturnRequest(created));
};

export const getMyReturnRequests = async (req, res) => {
  const rows = await ReturnRequest.find({ user: req.user._id })
    .populate("order", "_id itemsPrice shippingPrice taxPrice totalPrice status createdAt")
    .sort({ createdAt: -1 });
  return res.json(rows.map((r) => serializeReturnRequest(r)));
};

export const getMyReturnRequestById = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const row = await ReturnRequest.findById(id).populate("order", "_id itemsPrice shippingPrice taxPrice totalPrice status createdAt");
  if (!row) return res.status(404).json({ message: "Return request not found" });
  if (String(row.user) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not authorized" });
  }

  return res.json(serializeReturnRequest(row));
};

export const sendReturnMessage = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { text, attachments } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid request id" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const isCustomer = String(row.user) === String(req.user._id);
  const isAdmin = req.user.isAdmin;

  if (!isCustomer && !isAdmin) {
    return res.status(403).json({ message: "Not authorized" });
  }

  const message = {
    senderType: isAdmin ? "ADMIN" : "CUSTOMER",
    sender: req.user._id,
    text: asTrimmed(text),
    attachments: Array.isArray(attachments) ? attachments : [],
    createdAt: new Date()
  };

  row.conversation.push(message);
  
  // If customer responds and status was NEED_MORE_INFO, auto-update status
  if (isCustomer && row.status === "NEED_MORE_INFO") {
    row.status = "CUSTOMER_RESPONDED";
    row.timeline.push({
      status: "CUSTOMER_RESPONDED",
      note: "Customer submitted additional information via message.",
      actorRole: "customer",
      actorName: req.user?.name || "Customer"
    });
  }

  await row.save();
  return res.status(201).json(serializeReturnRequest(row));
};
