import mongoose from "mongoose";
import ReturnRequest from "../models/ReturnRequest.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import {
  canTransitionReturnStatus,
  getAllowedReturnTransitions,
  isCodOrder
} from "../utils/returnRequestLifecycle.js";
import { notifyReturnStatusIfNeeded } from "../utils/notifyUserEmail.js";

const asTrimmed = (v) => String(v ?? "").trim();

const mapRecord = (doc) => {
  const obj = typeof doc.toObject === "function" ? doc.toObject({ virtuals: false }) : doc;
  const out = { ...obj, id: String(obj._id) };
  if (out.order?._id) {
    out.order = { ...out.order, id: String(out.order._id) };
  }
  if (out.user?._id) {
    out.user = { ...out.user, id: String(out.user._id) };
  }
  return out;
};

export const listAdminReturnRequests = async (req, res) => {
  const orderFields =
    "_id itemsPrice shippingPrice taxPrice totalPrice status paymentMethod isPaid bankTranId paymentReference refundStatus refundRefId createdAt";

  const rows = await ReturnRequest.find()
    .populate("order", orderFields)
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  return res.json(rows.map((r) => mapRecord(r)));
};

export const getAdminReturnRequest = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const orderFields =
    "_id itemsPrice shippingPrice taxPrice totalPrice status paymentMethod isPaid bankTranId paymentReference refundStatus refundRefId createdAt";

  const row = await ReturnRequest.findById(id)
    .populate("order", orderFields)
    .populate("user", "name email");
  if (!row) return res.status(404).json({ message: "Return request not found" });
  return res.json(mapRecord(row));
};

export const updateAdminReturnRequest = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const { status, note, adminNote } = req.body;
  const previousStatus = row.status;

  if (status && status !== row.status) {
    const order = await Order.findById(row.order).select("paymentMethod status refundStatus");
    if (!canTransitionReturnStatus(row.status, status, order)) {
      const allowed = getAllowedReturnTransitions(row.status, order);
      return res.status(400).json({
        message: `Cannot transition from ${row.status} to ${status}. Allowed transitions: ${allowed.join(", ") || "none"}`
      });
    }

    if (status === "REJECTED" && !asTrimmed(note) && !asTrimmed(adminNote)) {
      return res.status(400).json({ message: "Rejection reason/note is required." });
    }

    if (status === "NEED_MORE_INFO" && !asTrimmed(note) && !asTrimmed(adminNote)) {
      return res.status(400).json({ message: "Note is required when requesting more info." });
    }

    row.status = status;
    row.timeline.push({
      status,
      note: note || `Status updated to ${status}`,
      actorRole: "admin",
      actorName: req.user?.name || "Admin",
      createdAt: new Date()
    });

    if (status === "REJECTED" && note) {
      row.rejectionReason = note;
    }

    if (status === "COMPLETED") {
      const order = await Order.findById(row.order);
      const now = new Date();
      const finalAmount = Number(row.refundDetails?.finalRefundAmount || 0);

      if (previousStatus === "REFUND_APPROVED" && !row.refundDetails?.processedAt) {
        row.refundDetails = {
          ...(row.refundDetails?.toObject?.() || row.refundDetails || {}),
          processedAt: now
        };
        if (asTrimmed(req.body?.transactionId)) {
          row.refundDetails.transactionId = asTrimmed(req.body.transactionId);
        }
      }

      if (order) {
        if (order.status !== "returned") {
          order.status = "returned";
        }
        order.refund = {
          amount: finalAmount,
          reason: row.reason,
          refundedAt: now,
          refundedBy: { user: req.user._id, role: "admin", name: req.user.name }
        };
        if (isCodOrder(order)) {
          order.refundStatus = "success";
          order.refundedAt = now;
        }
        await order.save();
      }
    }
  }

  if (adminNote) {
    row.adminNotes.push({
      body: adminNote,
      createdBy: req.user?.name || "Admin",
      createdAt: new Date()
    });
  }

  await row.save();
  await row.populate(
    "order",
    "_id itemsPrice shippingPrice taxPrice totalPrice status paymentMethod isPaid bankTranId paymentReference refundStatus refundRefId createdAt"
  );
  await row.populate("user", "name email");

  const orderForNotify = await Order.findById(row.order);
  if (status && status !== previousStatus) {
    notifyReturnStatusIfNeeded(row, previousStatus, orderForNotify);
  }

  return res.json(mapRecord(row));
};

export const schedulePickup = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { scheduledDate, courierName, trackingNumber, pickupCharge } = req.body;

  const pickupChargeNum = Number(pickupCharge || 0);
  if (!Number.isFinite(pickupChargeNum) || pickupChargeNum < 0) {
    return res.status(400).json({ message: "pickupCharge must be a valid number ≥ 0" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  row.pickupDetails = {
    scheduledDate: scheduledDate ? new Date(scheduledDate) : new Date(),
    courierName,
    trackingNumber,
    pickupCharge: pickupChargeNum
  };
  row.status = "PICKUP_SCHEDULED";
  row.timeline.push({
    status: "PICKUP_SCHEDULED",
    note: `Pickup scheduled with ${courierName || "courier"}. Tracking: ${trackingNumber || "N/A"}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  await row.save();
  const order = await Order.findById(row.order);
  notifyReturnStatusIfNeeded(row, "APPROVED_FOR_PICKUP", order);
  return res.json(mapRecord(row));
};

export const markPickedUp = async (req, res) => {
  const id = asTrimmed(req.params.id);

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  if (row.status !== "PICKUP_SCHEDULED") {
    return res.status(400).json({ message: "Can only mark as picked up when status is PICKUP_SCHEDULED." });
  }

  if (row.pickupDetails) {
    row.pickupDetails.pickedUpAt = new Date();
  }
  row.status = "PICKED_UP";
  row.timeline.push({
    status: "PICKED_UP",
    note: "Product has been picked up from customer.",
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  // Update the original order status to "returned"
  const order = await Order.findById(row.order);
  if (order && order.status !== "returned") {
    order.status = "returned";
    order.refund = {
      amount: 0,
      reason: "Item picked up for return",
      refundedAt: new Date(),
      refundedBy: { user: req.user._id, role: "admin", name: req.user.name }
    };
    await order.save();
  }

  await row.save();
  notifyReturnStatusIfNeeded(row, "PICKUP_SCHEDULED", order);
  return res.json(mapRecord(row));
};

export const recordInspection = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { condition, packagingStatus, accessoriesStatus, inspectionNotes } = req.body;

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  row.inspectionDetails = {
    condition,
    packagingStatus,
    accessoriesStatus,
    inspectionNotes,
    inspectedBy: req.user._id,
    inspectedAt: new Date()
  };
  row.status = "INSPECTION_COMPLETED";
  row.timeline.push({
    status: "INSPECTION_COMPLETED",
    note: `Inspection completed. Condition: ${condition}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, "PICKED_UP", await Order.findById(row.order));
  return res.json(mapRecord(row));
};

export const approveRefund = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { approvedAmount, deductions, finalRefundAmount, refundMethod } = req.body;

  const approvedAmountNum = Number(approvedAmount || 0);
  const deductionsNum = Number(deductions || 0);
  const finalRefundAmountNum = Number(finalRefundAmount || 0);
  if (!Number.isFinite(approvedAmountNum) || approvedAmountNum < 0) {
    return res.status(400).json({ message: "approvedAmount must be a valid number ≥ 0" });
  }
  if (!Number.isFinite(deductionsNum) || deductionsNum < 0) {
    return res.status(400).json({ message: "deductions must be a valid number ≥ 0" });
  }
  if (!Number.isFinite(finalRefundAmountNum) || finalRefundAmountNum < 0) {
    return res.status(400).json({ message: "finalRefundAmount must be a valid number ≥ 0" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const prevStatus = row.status;
  row.refundDetails = {
    approvedAmount: approvedAmountNum,
    deductions: deductionsNum,
    finalRefundAmount: finalRefundAmountNum,
    refundMethod: refundMethod || row.refundMethod
  };
  row.status = "REFUND_APPROVED";
  row.timeline.push({
    status: "REFUND_APPROVED",
    note: `Refund approved for amount: ${finalRefundAmount}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, prevStatus, await Order.findById(row.order));
  return res.json(mapRecord(row));
};

export const rejectRefund = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { rejectionReason } = req.body;

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const prevStatus = row.status;
  row.rejectionReason = rejectionReason;
  row.status = "REFUND_REJECTED";
  row.timeline.push({
    status: "REFUND_REJECTED",
    note: `Refund rejected. Reason: ${rejectionReason}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, prevStatus, await Order.findById(row.order));
  return res.json(mapRecord(row));
};

export const processRefundFull = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { transactionId } = req.body;

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const prevStatus = row.status;

  if (row.refundDetails) {
    row.refundDetails.transactionId = transactionId;
    row.refundDetails.processedAt = new Date();
  }
  
  // If status was REFUND_APPROVED, move to REFUND_PROCESSED
  if (row.status === "REFUND_APPROVED") {
    row.status = "REFUND_PROCESSED";
    row.timeline.push({
      status: "REFUND_PROCESSED",
      note: `Refund processed. Transaction ID: ${transactionId || "N/A"}. Expected to complete within ${row.refundDetails?.estimatedCompletionDays || 7} working days.`,
      actorRole: "admin",
      actorName: req.user?.name || "Admin"
    });
  } else {
    row.status = "REFUND_PROCESSED";
    row.timeline.push({
      status: "REFUND_PROCESSED",
      note: `Refund processed. TransID: ${transactionId}`,
      actorRole: "admin",
      actorName: req.user?.name || "Admin"
    });
  }

  // Update original order to 'returned' if applicable
  const order = await Order.findById(row.order);
  if (order) {
    order.status = "returned";
    order.refund = {
      amount: row.refundDetails?.finalRefundAmount || 0,
      reason: row.reason,
      refundedAt: new Date(),
      refundedBy: { user: req.user._id, role: "admin", name: req.user.name }
    };
    await order.save();
  }

  await row.save();
  notifyReturnStatusIfNeeded(row, prevStatus, order);
  return res.json(mapRecord(row));
};

export const returnItemToCustomer = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { trackingNumber, shippingCharge, reason } = req.body;

  const shippingChargeNum = Number(shippingCharge || 0);
  if (!Number.isFinite(shippingChargeNum) || shippingChargeNum < 0) {
    return res.status(400).json({ message: "shippingCharge must be a valid number ≥ 0" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  const prevStatus = row.status;
  row.returnToCustomerDetails = {
    trackingNumber,
    shippingCharge: shippingChargeNum,
    reason,
    returnedAt: new Date()
  };
  row.status = "ITEM_RETURNED_TO_CUSTOMER";
  row.timeline.push({
    status: "ITEM_RETURNED_TO_CUSTOMER",
    note: `Item returned to customer. Tracking: ${trackingNumber}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin"
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, prevStatus, await Order.findById(row.order));
  return res.json(mapRecord(row));
};

export const approveReplacement = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id).populate("order");
  if (!row) return res.status(404).json({ message: "Return request not found" });

  if (row.status !== "INSPECTION_COMPLETED") {
    return res.status(400).json({ message: "Can only approve replacement when inspection is completed." });
  }

  const condition = row.inspectionDetails?.condition;
  if (condition !== "damaged" && condition !== "wrong_item") {
    return res.status(400).json({ message: "Replacement is only available for damaged or wrong items." });
  }

  const originalOrder = row.order;
  if (!originalOrder) {
    return res.status(404).json({ message: "Original order not found." });
  }

  // Build replacement order items from the original order
  const orderItems = originalOrder.orderItems.map((item) => ({
    name: item.name,
    qty: item.qty,
    image: item.image || "",
    price: 0,
    product: item.product
  }));

  const replacementOrder = await Order.create({
    user: originalOrder.user,
    orderItems,
    shippingAddress: originalOrder.shippingAddress,
    paymentMethod: "CashOnDelivery",
    itemsPrice: 0,
    taxPrice: 0,
    shippingPrice: 0,
    totalPrice: 0,
    status: "processing",
    statusHistory: [
      {
        from: "pending",
        to: "processing",
        note: "Free replacement order created for damaged/wrong item from return request",
        changedBy: { user: req.user._id, role: "admin", name: req.user.name },
        changedAt: new Date()
      }
    ]
  });

  row.replacementDetails = {
    replacementOrder: replacementOrder._id
  };
  row.status = "REPLACEMENT_APPROVED";
  row.timeline.push({
    status: "REPLACEMENT_APPROVED",
    note: `Free replacement approved. Replacement order #${replacementOrder._id.toString().slice(-6).toUpperCase()} created.`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin",
    createdAt: new Date()
  });

  // Mark original order as returned
  if (originalOrder.status !== "returned") {
    originalOrder.status = "returned";
    originalOrder.refund = {
      amount: 0,
      reason: `Replacement approved for ${condition} item`,
      refundedAt: new Date(),
      refundedBy: { user: req.user._id, role: "admin", name: req.user.name }
    };
    await originalOrder.save();
  }

  await row.save();
  notifyReturnStatusIfNeeded(row, "INSPECTION_COMPLETED", originalOrder);
  await row.populate("replacementDetails.replacementOrder", "_id totalPrice status");
  return res.json(mapRecord(row));
};

export const markReplacementShipped = async (req, res) => {
  const id = asTrimmed(req.params.id);
  const { trackingNumber, carrier, note } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  if (row.status !== "REPLACEMENT_APPROVED") {
    return res.status(400).json({ message: "Replacement must be approved before marking as shipped." });
  }

  row.replacementDetails = {
    ...row.replacementDetails,
    trackingNumber: trackingNumber || "",
    carrier: carrier || "",
    note: note || "",
    shippedAt: new Date()
  };
  row.status = "REPLACEMENT_SHIPPED";
  row.timeline.push({
    status: "REPLACEMENT_SHIPPED",
    note: `Replacement shipped${trackingNumber ? `, Tracking: ${trackingNumber}` : ""}${carrier ? ` via ${carrier}` : ""}`,
    actorRole: "admin",
    actorName: req.user?.name || "Admin",
    createdAt: new Date()
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, "REPLACEMENT_APPROVED", await Order.findById(row.order));
  return res.json(mapRecord(row));
};

export const markReplacementDelivered = async (req, res) => {
  const id = asTrimmed(req.params.id);
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid return request id" });
  }

  const row = await ReturnRequest.findById(id);
  if (!row) return res.status(404).json({ message: "Return request not found" });

  if (row.status !== "REPLACEMENT_SHIPPED") {
    return res.status(400).json({ message: "Replacement must be shipped before marking as delivered." });
  }

  const prevStatus = row.status;
  row.replacementDetails = {
    ...row.replacementDetails,
    deliveredAt: new Date()
  };
  row.status = "REPLACEMENT_DELIVERED";
  row.timeline.push({
    status: "REPLACEMENT_DELIVERED",
    note: "Replacement delivered to customer.",
    actorRole: "admin",
    actorName: req.user?.name || "Admin",
    createdAt: new Date()
  });

  await row.save();
  notifyReturnStatusIfNeeded(row, prevStatus, await Order.findById(row.order));
  return res.json(mapRecord(row));
};
