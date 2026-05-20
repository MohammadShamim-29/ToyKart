import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import ReturnRequest from "../models/ReturnRequest.js";
import {
  actorFromUser,
  appendAdminNote,
  canTransitionOrderStatus,
  derivePaymentStatus,
  ensureOrderLifecycleDefaults,
  humanOrderNumber,
  normalizeOrderStatus,
  ORDER_STATUSES,
  setOrderStatus
} from "../utils/orderLifecycle.js";
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled } from "../utils/mailer.js";

const normalizeText = (value) => String(value ?? "").trim();

const orderIdFromParams = (req, res) => {
  const raw = req.params.id;
  if (raw == null || String(raw).trim() === "" || String(raw) === "[object Object]") {
    res.status(400).json({ message: "Invalid order id" });
    return null;
  }
  const id = String(raw).trim();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: "Invalid order id" });
    return null;
  }
  return id;
};

const serializeAdminOrder = (orderDoc) => {
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject({ virtuals: false }) : orderDoc;
  const status = normalizeOrderStatus(order.status);
  const itemCount = Array.isArray(order.orderItems)
    ? order.orderItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
    : 0;

  return {
    ...order,
    status,
    paymentStatus: derivePaymentStatus(order),
    orderNumber: humanOrderNumber(order._id),
    customerName: order.user?.name || order.shippingAddress?.firstName || "Customer",
    customerEmail: order.user?.email || order.shippingAddress?.email || "",
    itemCount
  };
};

const restoreOrderStock = async (order) => {
  if (!Array.isArray(order?.orderItems)) return;
  for (const item of order.orderItems) {
    if (!item?.product || !item?.qty) continue;
    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: Number(item.qty) || 0 } });
  }
};

const parseOptionalDate = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) {
    const err = new Error("Invalid date value");
    err.statusCode = 400;
    throw err;
  }
  return dt;
};

const parsePositiveAmount = (value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    const err = new Error("Amount must be a positive number");
    err.statusCode = 400;
    throw err;
  }
  return amount;
};

const refundSslPayment = async (bankTranId, amount, remarks) => {
  const baseUrl = String(process.env.SSLCZ_IS_LIVE).toLowerCase() === "true"
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";

  const params = new URLSearchParams({
    store_id: process.env.SSLCZ_STORE_ID || "",
    store_passwd: process.env.SSLCZ_STORE_PASSWORD || "",
    bank_tran_id: bankTranId,
    refund_amount: String(Number(amount).toFixed(2)),
    refund_remarks: remarks || "",
    v: "1",
    format: "json"
  });

  const response = await fetch(`${baseUrl}/gwprocess/v4/refund.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`SSLCommerz refund API failed with status ${response.status}`);
  }

  return response.json();
};

const applyMutableOrderFields = ({ order, body, actor }) => {
  const now = new Date();

  if (body.status !== undefined) {
    const next = normalizeOrderStatus(body.status);
    if (!ORDER_STATUSES.includes(next)) {
      const err = new Error("Invalid order status");
      err.statusCode = 400;
      throw err;
    }

    const prev = normalizeOrderStatus(order.status);
    if (!canTransitionOrderStatus(prev, next)) {
      const err = new Error(`Invalid status transition: ${prev} -> ${next}`);
      err.statusCode = 400;
      throw err;
    }

    if (prev !== next) {
      setOrderStatus(order, {
        toStatus: next,
        actor,
        note: normalizeText(body.statusNote) || "Status updated by admin",
        at: now
      });
    }
  }

  if (body.isPaid !== undefined) {
    const nextPaid = Boolean(body.isPaid);
    if (nextPaid && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = now;
      appendAdminNote(order, {
        body: "Payment marked as paid.",
        actor,
        isPrivate: true,
        at: now
      });
    }
    if (!nextPaid && order.isPaid) {
      order.isPaid = false;
      order.paidAt = undefined;
      appendAdminNote(order, {
        body: "Payment marked as unpaid.",
        actor,
        isPrivate: true,
        at: now
      });
    }
  }

  if (body.paymentReference !== undefined) {
    order.paymentReference = normalizeText(body.paymentReference);
  }

  if (body.fulfillment !== undefined && body.fulfillment && typeof body.fulfillment === "object") {
    order.fulfillment = order.fulfillment || {};
    if (body.fulfillment.carrier !== undefined) {
      order.fulfillment.carrier = normalizeText(body.fulfillment.carrier);
    }
    if (body.fulfillment.trackingNumber !== undefined) {
      order.fulfillment.trackingNumber = normalizeText(body.fulfillment.trackingNumber);
    }
    if (body.fulfillment.shippedAt !== undefined) {
      order.fulfillment.shippedAt = parseOptionalDate(body.fulfillment.shippedAt);
    }
  }

  if (body.internalMemo !== undefined) {
    order.internalMemo = String(body.internalMemo ?? "").trim();
  }

  const adminNote = normalizeText(body.adminNote);
  if (adminNote) {
    appendAdminNote(order, {
      body: adminNote,
      actor,
      isPrivate: body.adminNotePrivate !== false,
      at: now
    });
  }

  if (body.cancelReason !== undefined) {
    order.cancelReason = normalizeText(body.cancelReason);
  }

  const refundAmount = parsePositiveAmount(body.refundAmount);
  if (refundAmount !== undefined) {
    if (refundAmount > Number(order.totalPrice || 0)) {
      const err = new Error("Refund amount cannot be greater than order total");
      err.statusCode = 400;
      throw err;
    }
    order.refund = {
      amount: refundAmount,
      reason: normalizeText(body.refundReason),
      refundedAt: now,
      refundedBy: actor
    };

    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = now;
    }

    appendAdminNote(order, {
      body: `Refund recorded: ৳${refundAmount}${order.refund.reason ? ` (${order.refund.reason})` : ""}`,
      actor,
      isPrivate: true,
      at: now
    });
  }
};

export const listAdminOrders = async (req, res) => {
  const query = { adminDeletedAt: { $exists: false } };
  const status = normalizeText(req.query.status);
  const paymentStatus = normalizeText(req.query.paymentStatus).toLowerCase();
  const dateFrom = normalizeText(req.query.dateFrom);
  const dateTo = normalizeText(req.query.dateTo);
  const q = normalizeText(req.query.q);

  if (status && ORDER_STATUSES.includes(status)) {
    query.status = status;
  }

  if (paymentStatus === "paid") {
    query.isPaid = true;
    query["refund.amount"] = { $lte: 0 };
  } else if (paymentStatus === "pending") {
    query.isPaid = false;
  } else if (paymentStatus === "refunded") {
    query["refund.amount"] = { $gt: 0 };
  }

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      if (!Number.isNaN(start.getTime())) {
        query.createdAt.$gte = start;
      }
    }
    if (dateTo) {
      const end = new Date(dateTo);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    if (Object.keys(query.createdAt).length === 0) {
      delete query.createdAt;
    }
  }

  const sortField = normalizeText(req.query.sortField) || "createdAt";
  const sortOrder = normalizeText(req.query.sortOrder).toUpperCase() === "ASC" ? 1 : -1;

  const safeSortField = ["createdAt", "updatedAt", "totalPrice", "status"].includes(sortField)
    ? sortField
    : "createdAt";

  const orders = await Order.find(query)
    .populate("user", "name email")
    .sort({ [safeSortField]: sortOrder, createdAt: -1 });

  let serialized = orders.map((order) => {
    ensureOrderLifecycleDefaults(order);
    return serializeAdminOrder(order);
  });

  if (q) {
    const terms = q
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    serialized = serialized.filter((order) => {
      const haystack = [
        String(order._id || ""),
        String(order.id || ""),
        String(order.orderNumber || ""),
        String(order.customerName || ""),
        String(order.customerEmail || ""),
        String(order.user?.name || ""),
        String(order.user?.email || ""),
        String(order.shippingAddress?.firstName || ""),
        String(order.shippingAddress?.email || ""),
        String(order.shippingAddress?.phone || ""),
        String(order.shippingAddress?.city || ""),
        String(order.shippingAddress?.country || "")
      ]
        .join(" ")
        .toLowerCase();

      return terms.every((term) => haystack.includes(term));
    });
  }

  return res.json(serialized);
};

export const getAdminOrder = async (req, res) => {
  const id = orderIdFromParams(req, res);
  if (!id) return;

  const order = await Order.findById(id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug sku image");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  ensureOrderLifecycleDefaults(order);
  return res.json(serializeAdminOrder(order));
};

export const updateAdminOrder = async (req, res) => {
  const id = orderIdFromParams(req, res);
  if (!id) return;

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  ensureOrderLifecycleDefaults(order);
  const actor = actorFromUser(req.user, "admin");

  try {
    applyMutableOrderFields({ order, body: req.body || {}, actor });

    if (normalizeOrderStatus(order.status) === "cancelled" && !order.cancelledAt) {
      order.cancelledAt = new Date();
      order.cancelledBy = actor;
      await restoreOrderStock(order);
    }

    await order.save();
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }

  const populated = await Order.findById(order._id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug sku image");
  return res.json(serializeAdminOrder(populated));
};

export const updateAdminOrderStatus = async (req, res) => {
  const id = orderIdFromParams(req, res);
  if (!id) return;

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  ensureOrderLifecycleDefaults(order);

  const status = normalizeText(req.body?.status);
  if (!status || !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ message: "A valid status is required" });
  }

  const actor = actorFromUser(req.user, "admin");
  const now = new Date();

  try {
    setOrderStatus(order, {
      toStatus: status,
      actor,
      note: normalizeText(req.body?.note) || "Status updated by admin",
      at: now
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }

  if (status === "cancelled") {
    order.cancelReason = normalizeText(req.body?.reason) || order.cancelReason;
    order.cancelledBy = actor;
    order.cancelledAt = now;
    await restoreOrderStock(order);
  }

  await order.save();

  const populated = await Order.findById(order._id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug sku image");

  if (status === "shipped" && populated?.user) sendOrderShipped(populated, populated.user);
  if (status === "delivered" && populated?.user) sendOrderDelivered(populated, populated.user);
  if (status === "cancelled" && populated?.user) sendOrderCancelled(populated, populated.user, req.body?.reason);

  return res.json(serializeAdminOrder(populated));
};

export const addAdminOrderNote = async (req, res) => {
  const id = orderIdFromParams(req, res);
  if (!id) return;

  const note = normalizeText(req.body?.note);
  if (!note) {
    return res.status(400).json({ message: "Note text is required" });
  }

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  ensureOrderLifecycleDefaults(order);

  appendAdminNote(order, {
    body: note,
    actor: actorFromUser(req.user, "admin"),
    isPrivate: req.body?.isPrivate !== false
  });

  await order.save();

  const populated = await Order.findById(order._id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug sku image");

  return res.status(201).json(serializeAdminOrder(populated));
};

export const cancelAdminOrder = async (req, res) => {
  const id = orderIdFromParams(req, res);
  if (!id) return;

  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  ensureOrderLifecycleDefaults(order);

  const current = normalizeOrderStatus(order.status);
  if (!["pending", "confirmed", "processing"].includes(current)) {
    return res.status(400).json({ message: `Order cannot be cancelled from status ${current}` });
  }

  const actor = actorFromUser(req.user, "admin");
  const reason = normalizeText(req.body?.reason);

  setOrderStatus(order, {
    toStatus: "cancelled",
    actor,
    note: reason ? `Cancelled by admin: ${reason}` : "Cancelled by admin"
  });

  order.cancelReason = reason || "Cancelled by admin";
  order.cancelledBy = actor;
  order.cancelledAt = new Date();

  await restoreOrderStock(order);

  await order.save();

  const populated = await Order.findById(order._id)
    .populate("user", "name email")
    .populate("orderItems.product", "name slug sku image");

  sendOrderCancelled(populated, populated.user, reason);

  return res.json(serializeAdminOrder(populated));
};

export const refundAdminOrder = async (req, res) => {
    const id = orderIdFromParams(req, res);
    if (!id) return;

    const order = await Order.findById(id);
    if (!order) {
        return res.status(404).json({ message: "Order not found" });
    }

    ensureOrderLifecycleDefaults(order);

    let amount;
    try {
        amount = parsePositiveAmount(req.body?.amount);
    } catch (error) {
        if (error.statusCode === 400) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }

    if (amount === undefined) {
        return res.status(400).json({ message: "Refund amount is required" });
    }

    if (amount > Number(order.totalPrice || 0)) {
        return res.status(400).json({ message: "Refund amount cannot exceed order total" });
    }
    const actor = actorFromUser(req.user, "admin");
    const reason = normalizeText(req.body?.reason);
    const now = new Date();

    // Process SSLCommerz refund if the order was paid via SSLCommerz
    let sslRefundRefId = null;
    if (order.paymentMethod === "SSLCommerz" && order.isPaid) {
        // Use stored paymentReference (transaction ID from SSLCommerz)
        const bankTranId = order.paymentReference;

        if (!bankTranId) {
            return res.status(400).json({ message: "No SSL transaction ID found for this order. Cannot process SSLCommerz refund." });
        }

        try {
            const result = await refundSslPayment(bankTranId, amount, reason || "Admin refund");
            if (result?.status === "success") {
                sslRefundRefId = result.refund_ref_id || null;
            } else {
                return res.status(400).json({
                    message: `SSLCommerz refund failed: ${result?.errorReason || "Unknown error"}`
                });
            }
        } catch (err) {
            return res.status(502).json({ message: `SSLCommerz refund error: ${err.message}` });
        }
    }

    order.refund = {
        amount,
        reason,
        refundedAt: now,
        refundedBy: actor,
        sslRefundRefId
    };

    setOrderStatus(order, {
        toStatus: "refunded",
        actor,
        note: reason ? `Refund issued: BDT ${amount} (${reason})${sslRefundRefId ? ` [Ref: ${sslRefundRefId}]` : ""}` : `Refund issued: BDT ${amount}${sslRefundRefId ? ` [Ref: ${sslRefundRefId}]` : ""}`
    });

    appendAdminNote(order, {
        body: `Refund issued: BDT ${amount}${reason ? ` (${reason})` : ""}${sslRefundRefId ? ` [SSL Ref: ${sslRefundRefId}]` : ""}`,
        actor,
        isPrivate: true,
        at: now
    });

    await order.save();

    const populated = await Order.findById(order._id)
        .populate("user", "name email")
        .populate("orderItems.product", "name slug sku image");

    return res.json(serializeAdminOrder(populated));
};

export const getAdminOrderAnalytics = async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Total Sales (only paid orders)
  const totalSalesData = await Order.aggregate([
    { $match: { isPaid: true, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  const totalSales = totalSalesData[0]?.total || 0;

  // Today's Sales
  const todaySalesData = await Order.aggregate([
    { $match: { isPaid: true, status: { $ne: "cancelled" }, paidAt: { $gte: todayStart } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
  ]);
  const todaySales = todaySalesData[0]?.total || 0;

  // Sales by Category
  const salesByCategory = await Order.aggregate([
    { $match: { isPaid: true, status: { $ne: "cancelled" } } },
    { $unwind: "$orderItems" },
    {
      $lookup: {
        from: "products",
        localField: "orderItems.product",
        foreignField: "_id",
        as: "productInfo"
      }
    },
    { $unwind: "$productInfo" },
    {
      $lookup: {
        from: "categories",
        localField: "productInfo.category",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    { $unwind: "$categoryInfo" },
    {
      $group: {
        _id: "$categoryInfo.name",
        totalAmount: { $sum: { $multiply: ["$orderItems.price", "$orderItems.qty"] } },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { totalAmount: -1 } }
  ]);

  res.json({
    totalSales,
    todaySales,
    salesByCategory
  });
};

export const deleteAdminOrder = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid order id" });
  }
  const order = await Order.findById(id);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  // Check for active return requests
  const activeReturn = await ReturnRequest.findOne({
    order: id,
    status: { $nin: ["COMPLETED", "REJECTED", "CLOSED", "REFUND_REJECTED", "ITEM_RETURNED_TO_CUSTOMER"] }
  });
  if (activeReturn) {
    return res.status(400).json({
      message: "Cannot delete order with an active return request. Close the return request first."
    });
  }

  // Soft delete — preserve audit trail
  order.adminDeletedAt = new Date();
  order.adminDeletedBy = req.user._id;
  await order.save();

  return res.json({ message: "Order deleted", id });
};
