import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM = process.env.EMAIL_FROM || "noreply@toykart.com";
const APP_NAME = "ToyKart";
const BASE_URL = process.env.CLIENT_URL || "http://localhost:5173";

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Email send failed:", err.message);
  }
};

const layout = (title, body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden">
      <tr><td style="padding:24px 32px;background:#059669;color:#fff;font-size:20px;font-weight:700">${APP_NAME}</td></tr>
      <tr><td style="padding:32px;font-size:15px;color:#374151;line-height:1.6">
        <h2 style="margin:0 0 16px;color:#111827">${title}</h2>
        ${body}
      </td></tr>
      <tr><td style="padding:16px 32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
        &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

/* ─── Order Emails ─── */

export const sendOrderConfirmation = (order, user) => {
  const items = order.orderItems.map((i) =>
    `<tr><td style="padding:6px 0">${i.name} x${i.qty}</td><td style="text-align:right">BDT ${(i.qty * i.price).toLocaleString()}</td></tr>`
  ).join("");

  const html = layout("Order Confirmed", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your order has been placed successfully.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px">
      <tr><td style="padding:8px 0;font-weight:700;border-bottom:1px solid #e5e7eb">Items</td></tr>
      ${items}
      <tr><td style="padding:8px 0;border-top:2px solid #111827;font-weight:700">Total</td>
          <td style="text-align:right;font-weight:700">BDT ${order.totalPrice.toLocaleString()}</td></tr>
    </table>
    <p style="margin-top:16px"><a href="${BASE_URL}/orders/${order._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Order</a></p>
  `);

  sendEmail({ to: user.email, subject: `Order Confirmed #${order._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendOrderShipped = (order, user) => {
  const carrier = order.fulfillment?.carrier || "";
  const tracking = order.fulfillment?.trackingNumber || "";

  const html = layout("Order Shipped", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your order has been shipped${carrier ? ` via <strong>${carrier}</strong>` : ""}.</p>
    ${tracking ? `<p>Tracking Number: <strong>${tracking}</strong></p>` : ""}
    <p style="margin-top:16px"><a href="${BASE_URL}/orders/${order._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Track Order</a></p>
  `);

  sendEmail({ to: user.email, subject: `Order Shipped #${order._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendOrderDelivered = (order, user) => {
  const html = layout("Order Delivered", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your order has been delivered. We hope you love your purchase!</p>
    <p>If you have any issues, you can request a return within 7 days.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}/orders/${order._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Order</a></p>
  `);

  sendEmail({ to: user.email, subject: `Order Delivered #${order._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendOrderCancelled = (order, user, reason) => {
  const html = layout("Order Cancelled", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your order has been cancelled.</p>
    ${reason ? `<p>Reason: ${reason}</p>` : ""}
    <p>If you paid for this order, the refund will be processed shortly.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}/orders" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">My Orders</a></p>
  `);

  sendEmail({ to: user.email, subject: `Order Cancelled #${order._id.toString().slice(-6).toUpperCase()}`, html });
};

/* ─── Return Emails ─── */

export const sendReturnSubmitted = (ret, user) => {
  const html = layout("Return Request Received", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your return request has been submitted successfully.</p>
    <p><strong>Request ID:</strong> #${ret._id.toString().slice(-6).toUpperCase()}</p>
    <p><strong>Reason:</strong> ${ret.reason}</p>
    <p>Our team will review your request and get back to you within 1-2 business days.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}/returns/${ret._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Request</a></p>
  `);

  sendEmail({ to: user.email, subject: `Return Request Submitted #${ret._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendPickupScheduled = (ret, user, pickup) => {
  const date = pickup.scheduledDate ? new Date(pickup.scheduledDate).toLocaleString("en-BD") : "";
  const html = layout("Pickup Scheduled", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>A courier pickup has been scheduled for your returned item.</p>
    ${date ? `<p><strong>Scheduled Date:</strong> ${date}</p>` : ""}
    ${pickup.courierName ? `<p><strong>Courier:</strong> ${pickup.courierName}</p>` : ""}
    ${pickup.trackingNumber ? `<p><strong>Tracking:</strong> ${pickup.trackingNumber}</p>` : ""}
    <p>Please ensure the item is properly packaged and ready for pickup.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}/returns/${ret._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Details</a></p>
  `);

  sendEmail({ to: user.email, subject: `Pickup Scheduled - Return #${ret._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendRefundProcessed = (ret, user) => {
  const amount = ret.refundDetails?.finalRefundAmount || 0;
  const method = ret.refundDetails?.refundMethod || ret.refundMethod || "Original Payment Method";
  const html = layout("Refund Processed", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your refund has been processed.</p>
    <p><strong>Amount:</strong> BDT ${amount.toLocaleString()}</p>
    <p><strong>Method:</strong> ${method}</p>
    ${ret.refundDetails?.transactionId ? `<p><strong>Transaction ID:</strong> ${ret.refundDetails.transactionId}</p>` : ""}
    <p>The amount will reflect in your account within 5-7 business days.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}/returns/${ret._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Details</a></p>
  `);

  sendEmail({ to: user.email, subject: `Refund Processed - Return #${ret._id.toString().slice(-6).toUpperCase()}`, html });
};

export const sendReplacementShipped = (ret, user, replacementOrderId) => {
  const tracking = ret.replacementDetails?.trackingNumber || "";
  const carrier = ret.replacementDetails?.carrier || "";
  const orderLabel = `#${String(replacementOrderId || "").slice(-6).toUpperCase()}`;

  const html = layout("Replacement Shipped", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Your free replacement order ${orderLabel} has been shipped.</p>
    ${carrier ? `<p><strong>Carrier:</strong> ${carrier}</p>` : ""}
    ${tracking ? `<p><strong>Tracking Number:</strong> ${tracking}</p>` : ""}
    <p style="margin-top:16px"><a href="${BASE_URL}/returns/${ret._id}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">View Details</a></p>
  `);

  sendEmail({ to: user.email, subject: `Replacement Shipped - Return #${ret._id.toString().slice(-6).toUpperCase()}`, html });
};

/* ─── Auth Emails ─── */

export const sendWelcomeEmail = (user) => {
  const html = layout("Welcome to ToyKart", `
    <p>Hello <strong>${user.name || user.email}</strong>,</p>
    <p>Welcome to ToyKart! Your account has been created successfully.</p>
    <p>You can now browse our collection, place orders, and track your deliveries.</p>
    <p style="margin-top:16px"><a href="${BASE_URL}" style="display:inline-block;padding:10px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px">Start Shopping</a></p>
  `);

  sendEmail({ to: user.email, subject: "Welcome to ToyKart!", html });
};

export default sendEmail;