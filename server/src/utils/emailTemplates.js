const layout = (title, bodyHtml) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;background:#f5f5f5;padding:24px;margin:0">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e5e5">
    <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.06em">ToyKart</p>
    <h1 style="margin:0 0 16px;font-size:22px;color:#111">${title}</h1>
    ${bodyHtml}
    <p style="margin-top:24px;font-size:12px;color:#888">Questions? Reply to this email or visit your account on ToyKart.</p>
  </div>
</body>
</html>`;

const summaryTable = (rows) => `
<table style="width:100%;margin:16px 0;font-size:15px;border-collapse:collapse">
  ${rows.map(([k, v]) => `<tr><td style="color:#666;padding:6px 0">${k}</td><td style="text-align:right;padding:6px 0"><strong>${v}</strong></td></tr>`).join("")}
</table>`;

export const verificationEmail = ({ name, link }) => ({
  subject: "Verify your ToyKart account",
  text: `Hi ${name}, verify your email: ${link}`,
  html: layout(
    "Verify your email",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Thanks for signing up. Click the button below to verify your email address.</p>
     <p style="margin:24px 0">
       <a href="${link}" style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600">
         Verify email
       </a>
     </p>
     <p style="font-size:13px;color:#666">Or copy this link:<br><a href="${link}">${link}</a></p>`
  )
});

export const resetOtpEmail = ({ name, otp, minutes }) => ({
  subject: "ToyKart password reset code",
  text: `Hi ${name}, your reset code is ${otp}. It expires in ${minutes} minutes.`,
  html: layout(
    "Password reset code",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your 6-digit code:</p>
     <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111;margin:16px 0">${otp}</p>
     <p style="color:#666">Expires in <strong>${minutes} minutes</strong>.</p>`
  )
});

export const orderPlacedEmail = ({ name, orderNumber, totalPrice, itemCount, paymentMethod }) => ({
  subject: `Order confirmed — ${orderNumber}`,
  text: `Hi ${name}, order ${orderNumber} placed (${itemCount} items, ৳${totalPrice}). Payment: ${paymentMethod}.`,
  html: layout(
    "Order placed",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Thanks for your order! We have received it and will process it soon.</p>
     ${summaryTable([
       ["Order", orderNumber],
       ["Items", String(itemCount)],
       ["Total", `৳${totalPrice}`],
       ["Payment", paymentMethod]
     ])}
     <p>${paymentMethod === "Cash on Delivery" ? "Please keep cash ready when your order is delivered." : "Complete online payment if you have not already."}</p>`
  )
});

export const paymentReceivedEmail = ({ name, orderNumber, amount }) => ({
  subject: `Payment received — ${orderNumber}`,
  text: `Hi ${name}, we received ৳${amount} for order ${orderNumber}.`,
  html: layout(
    "Payment received",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your online payment was successful.</p>
     ${summaryTable([["Order", orderNumber], ["Amount paid", `৳${amount}`]])}`
  )
});

export const orderStatusEmail = ({ name, orderNumber, statusLabel, note }) => ({
  subject: `Order update — ${orderNumber}`,
  text: `Hi ${name}, order ${orderNumber} is now: ${statusLabel}. ${note || ""}`,
  html: layout(
    "Order update",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your order status has been updated.</p>
     ${summaryTable([["Order", orderNumber], ["Status", statusLabel]])}
     ${note ? `<p style="color:#444">${note}</p>` : ""}`
  )
});

export const orderCancelledEmail = ({ name, orderNumber, reason, cancelledBy }) => ({
  subject: `Order cancelled — ${orderNumber}`,
  text: `Hi ${name}, order ${orderNumber} was cancelled. ${reason || ""}`,
  html: layout(
    "Order cancelled",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your order has been cancelled${cancelledBy ? ` (${cancelledBy})` : ""}.</p>
     ${summaryTable([["Order", orderNumber]])}
     ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
     <p>If you paid online, a refund may be processed after admin review.</p>`
  )
});

export const orderRefundedEmail = ({ name, orderNumber, amount, method, note, transactionId }) => ({
  subject: `Refund processed — ${orderNumber}`,
  text: `Hi ${name}, refund ৳${amount} for order ${orderNumber}. Method: ${method}.`,
  html: layout(
    "Refund processed",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your refund has been processed.</p>
     ${summaryTable([
       ["Order", orderNumber],
       ["Amount", `৳${amount}`],
       ["Method", method],
       ...(transactionId ? [["Reference", transactionId]] : [])
     ])}
     ${note ? `<p style="color:#444">${note}</p>` : ""}`
  )
});

export const paymentFailedEmail = ({ name, orderNumber, reason }) => ({
  subject: `Payment not completed — ${orderNumber}`,
  text: `Hi ${name}, payment for order ${orderNumber} did not complete. ${reason || ""}`,
  html: layout(
    "Payment not completed",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your online payment was not completed. Your order is still unpaid.</p>
     ${summaryTable([["Order", orderNumber]])}
     <p>You can try paying again from your orders page or choose Cash on Delivery if available.</p>`
  )
});

export const paymentCancelledEmail = ({ name, orderNumber }) => ({
  subject: `Payment cancelled — ${orderNumber}`,
  text: `Hi ${name}, you cancelled payment for order ${orderNumber}.`,
  html: layout(
    "Payment cancelled",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>You cancelled the payment step. Order <strong>${orderNumber}</strong> is still waiting for payment.</p>
     <p>You can complete payment later from your account.</p>`
  )
});

export const refundFailedEmail = ({ name, orderNumber, note }) => ({
  subject: `Refund issue — ${orderNumber}`,
  text: `Hi ${name}, there was an issue processing your refund for ${orderNumber}. ${note || ""}`,
  html: layout(
    "Refund processing issue",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We could not complete your refund automatically. Our team will follow up shortly.</p>
     ${summaryTable([["Order", orderNumber]])}
     ${note ? `<p>${note}</p>` : ""}`
  )
});

export const returnMessageEmail = ({ name, returnId, orderNumber, messagePreview }) => ({
  subject: `New message on return ${returnId}`,
  text: `Hi ${name}, ToyKart replied on your return ${returnId}: ${messagePreview}`,
  html: layout(
    "New message on your return",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Our team sent you a message about return <strong>${returnId}</strong> (order ${orderNumber}).</p>
     <p style="background:#f5f5f5;padding:12px;border-radius:8px;color:#333">${messagePreview}</p>
     <p>Please log in to your account to view and reply.</p>`
  )
});

export const cancellationApprovedEmail = ({ name, orderNumber, paymentMethod }) => ({
  subject: `Cancellation approved — ${orderNumber}`,
  text: `Hi ${name}, your cancelled order ${orderNumber} was approved for refund processing.`,
  html: layout(
    "Cancellation approved",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>Your order cancellation has been approved by our team.</p>
     ${summaryTable([["Order", orderNumber], ["Payment", paymentMethod]])}
     <p>${paymentMethod === "Cash on Delivery" ? "No online payment was taken for this order." : "Your refund will be sent back to your original payment method shortly."}</p>`
  )
});

export const returnSubmittedEmail = ({ name, returnId, orderNumber, reason }) => ({
  subject: `Return request received — ${returnId}`,
  text: `Hi ${name}, we received your return request ${returnId} for order ${orderNumber}.`,
  html: layout(
    "Return request received",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>We received your return / refund request and will review it soon.</p>
     ${summaryTable([
       ["Request", returnId],
       ["Order", orderNumber],
       ["Reason", reason]
     ])}`
  )
});

export const returnUpdateEmail = ({ name, returnId, orderNumber, statusLabel, note, extraRows = [] }) => ({
  subject: `Return update — ${returnId}`,
  text: `Hi ${name}, return ${returnId}: ${statusLabel}. ${note || ""}`,
  html: layout(
    "Return update",
    `<p>Hi <strong>${name}</strong>,</p>
     <p>There is an update on your return request.</p>
     ${summaryTable([
       ["Request", returnId],
       ["Order", orderNumber],
       ["Status", statusLabel],
       ...extraRows
     ])}
     ${note ? `<p style="color:#444">${note}</p>` : ""}`
  )
});
