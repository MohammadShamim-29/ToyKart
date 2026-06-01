import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import { sendCustomerEmail } from "./sendEmail.js";
import {
  orderCancelledEmail,
  orderPlacedEmail,
  orderRefundedEmail,
  orderStatusEmail,
  paymentFailedEmail,
  paymentReceivedEmail,
  refundFailedEmail,
  returnSubmittedEmail,
  returnUpdateEmail
} from "./emailTemplates.js";
import { humanOrderNumber } from "./orderLifecycle.js";

const ORDER_STATUS_LABELS = {
  shipped: "Shipped",
  delivered: "Delivered"
};

const RETURN_STATUS_LABELS = {
  NEED_MORE_INFO: "More information needed",
  REFUND_APPROVED: "Refund approved",
  REFUND_REJECTED: "Refund rejected",
  REJECTED: "Rejected",
  REPLACEMENT_SHIPPED: "Replacement shipped"
};

/** Only these admin order status changes email the customer */
const NOTIFY_ORDER_STATUSES = new Set(["shipped", "delivered"]);

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  return String(value);
};

export const resolveCustomerRecipient = async ({ order, userId, returnUserId }) => {
  let customerId = toIdString(userId) || toIdString(returnUserId);

  if (!customerId && order) {
    if (!order.user && order._id) {
      const lean = await Order.findById(order._id).select("user shippingAddress").lean();
      customerId = toIdString(lean?.user);
      order = lean || order;
    } else {
      customerId = toIdString(order.user);
    }
  }

  if (!customerId || !mongoose.Types.ObjectId.isValid(customerId)) {
    return null;
  }

  const user = await User.findById(customerId).select("email name");
  if (user?.email) {
    return {
      to: user.email.trim().toLowerCase(),
      name: user.name || order?.shippingAddress?.firstName || "Customer",
      customerId
    };
  }

  const shippingEmail = order?.shippingAddress?.email?.trim()?.toLowerCase();
  if (shippingEmail) {
    return {
      to: shippingEmail,
      name: order?.shippingAddress?.firstName || "Customer",
      customerId
    };
  }

  return null;
};

const safeNotify = async (label, fn) => {
  try {
    await fn();
  } catch (err) {
    console.error(`[ToyKart notify] ${label} failed:`, err.message);
  }
};

const shortReturnId = (id) => `RET-${String(id).slice(-6).toUpperCase()}`;

const sendToCustomer = async (label, recipient, tpl) => {
  if (!recipient?.to || !tpl) {
    console.warn(`[ToyKart notify] ${label} skipped — no customer email`);
    return;
  }
  const result = await sendCustomerEmail({
    to: recipient.to,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html
  });
  if (result?.blocked) {
    console.warn(`[ToyKart notify] ${label} not sent to ${recipient.to} (admin/sender blocked)`);
    return;
  }
  console.log(`[ToyKart notify] ${label} → ${recipient.to} (customer ${recipient.customerId})`);
};

const paymentLabel = (order) =>
  order?.paymentMethod === "SSLCommerz" ? "Online (SSLCommerz)" : "Cash on Delivery";

// ——— Orders (main events only) ———

export const notifyOrderPlaced = async (order, userId) =>
  safeNotify("order_placed", async () => {
    const recipient = await resolveCustomerRecipient({ order, userId });
    if (!recipient) return;
    const orderNumber = humanOrderNumber(order._id);
    const itemCount = order.orderItems?.reduce((n, i) => n + (Number(i.qty) || 0), 0) || 0;
    await sendToCustomer(
      "order_placed",
      recipient,
      orderPlacedEmail({
        name: recipient.name,
        orderNumber,
        totalPrice: Number(order.totalPrice).toFixed(2),
        itemCount,
        paymentMethod: paymentLabel(order)
      })
    );
  });

export const notifyPaymentFailed = async (order) =>
  safeNotify("payment_failed", async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      "payment_failed",
      recipient,
      paymentFailedEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        reason: "Payment did not complete. Please try again from checkout."
      })
    );
  });

/** No email — customer chose to leave payment; order-placed email is enough */
export const notifyPaymentCancelled = async () => {};

export const notifyPaymentReceived = async (order) =>
  safeNotify("payment_received", async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      "payment_received",
      recipient,
      paymentReceivedEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        amount: Number(order.totalPrice).toFixed(2)
      })
    );
  });

/** Only shipped & delivered — not confirmed/processing */
export const notifyOrderStatusChange = async (order, newStatus, note) => {
  if (!NOTIFY_ORDER_STATUSES.has(newStatus)) return;
  return safeNotify(`order_${newStatus}`, async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      `order_${newStatus}`,
      recipient,
      orderStatusEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        statusLabel: ORDER_STATUS_LABELS[newStatus] || newStatus,
        note
      })
    );
  });
};

export const notifyOrderCancelled = async (order, { reason, cancelledBy } = {}) =>
  safeNotify("order_cancelled", async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      "order_cancelled",
      recipient,
      orderCancelledEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        reason,
        cancelledBy
      })
    );
  });

export const notifyOrderRefunded = async (order, { amount, note, transactionId, method } = {}) =>
  safeNotify("order_refunded", async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      "order_refunded",
      recipient,
      orderRefundedEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        amount: Number(amount ?? order.refund?.amount ?? order.totalPrice).toFixed(2),
        method:
          method ||
          (order.paymentMethod === "SSLCommerz"
            ? "Original payment method (SSLCommerz)"
            : "Bank / MFS (as arranged with support)"),
        note,
        transactionId
      })
    );
  });

export const notifyRefundFailed = async (order, note) =>
  safeNotify("refund_failed", async () => {
    const recipient = await resolveCustomerRecipient({ order });
    if (!recipient) return;
    await sendToCustomer(
      "refund_failed",
      recipient,
      refundFailedEmail({
        name: recipient.name,
        orderNumber: humanOrderNumber(order._id),
        note
      })
    );
  });

/** Skipped — refund email covers this */
export const notifyCancellationApproved = async () => {};

/** Skipped — use NEED_MORE_INFO return email instead */
export const notifyReturnAdminMessage = async () => {};

// ——— Returns (main events only) ———

export const notifyReturnSubmitted = async (returnRow, order) =>
  safeNotify("return_submitted", async () => {
    const recipient = await resolveCustomerRecipient({ order, returnUserId: returnRow.user });
    if (!recipient) return;
    await sendToCustomer(
      "return_submitted",
      recipient,
      returnSubmittedEmail({
        name: recipient.name,
        returnId: shortReturnId(returnRow._id),
        orderNumber: humanOrderNumber(order._id),
        reason: returnRow.reason
      })
    );
  });

const notifyReturnStatus = async (returnRow, order, status, note, extraRows = []) => {
  const label = RETURN_STATUS_LABELS[status] || status;
  return safeNotify(`return_${status}`, async () => {
    const recipient = await resolveCustomerRecipient({ order, returnUserId: returnRow.user });
    if (!recipient) return;
    await sendToCustomer(
      `return_${status}`,
      recipient,
      returnUpdateEmail({
        name: recipient.name,
        returnId: shortReturnId(returnRow._id),
        orderNumber: humanOrderNumber(order?._id || returnRow.order),
        statusLabel: label,
        note,
        extraRows
      })
    );
  });
};

/**
 * Return emails only for milestones — not every admin status click.
 */
export const notifyReturnStatusIfNeeded = async (returnRow, previousStatus, order) => {
  const status = returnRow.status;
  if (status === previousStatus) return;

  const orderDoc =
    order ||
    (await Order.findById(returnRow.order).select("user shippingAddress paymentMethod refund").lean());
  if (!orderDoc) return;

  const note = returnRow.timeline?.at(-1)?.note;

  if (status === "NEED_MORE_INFO") {
    return notifyReturnStatus(
      returnRow,
      orderDoc,
      status,
      note || "Please log in and provide the requested information."
    );
  }

  if (status === "REFUND_APPROVED") {
    const amt = returnRow.refundDetails?.finalRefundAmount;
    return notifyReturnStatus(
      returnRow,
      orderDoc,
      status,
      note || "Your refund has been approved and will be processed soon.",
      amt ? [["Refund amount", `৳${amt}`]] : []
    );
  }

  if (status === "REJECTED" || status === "REFUND_REJECTED") {
    return notifyReturnStatus(returnRow, orderDoc, status, returnRow.rejectionReason || note);
  }

  if (status === "REFUND_PROCESSED" || status === "COMPLETED") {
    const amt = returnRow.refundDetails?.finalRefundAmount || orderDoc.refund?.amount;
    const txn = returnRow.refundDetails?.transactionId;
    return notifyOrderRefunded(orderDoc, {
      amount: amt,
      method: returnRow.refundMethod || paymentLabel(orderDoc),
      transactionId: txn,
      note: "Your return has been completed and refund processed."
    });
  }

  if (status === "REPLACEMENT_SHIPPED") {
    const p = returnRow.replacementDetails;
    return notifyReturnStatus(returnRow, orderDoc, status, note, [
      ...(p?.trackingNumber ? [["Tracking", p.trackingNumber]] : []),
      ...(p?.carrier ? [["Carrier", p.carrier]] : [])
    ]);
  }
};

export const resolveOrderFromSslCallback = async (payload) => {
  const orderId = toIdString(payload?.value_a);
  if (orderId && mongoose.Types.ObjectId.isValid(orderId)) {
    const byId = await Order.findById(orderId);
    if (byId) return byId;
  }
  const tranId = String(payload?.tran_id || "").trim();
  if (tranId) {
    return Order.findOne({ paymentReference: tranId });
  }
  return null;
};

export const sendOrderPlacedEmail = notifyOrderPlaced;
