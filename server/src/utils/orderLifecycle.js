export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
  "refunded"
];

const ORDER_TRANSITIONS = {
  pending: new Set(["confirmed", "cancelled"]),
  confirmed: new Set(["processing", "cancelled"]),
  processing: new Set(["shipped", "cancelled"]),
  shipped: new Set(["delivered", "returned"]),
  delivered: new Set(["returned"]),
  cancelled: new Set(["refunded"]),
  returned: new Set(["refunded"]),
  refunded: new Set()
};

export const normalizeOrderStatus = (status) => {
  if (ORDER_STATUSES.includes(status)) return status;
  return "pending";
};

export const canTransitionOrderStatus = (fromStatus, toStatus) => {
  if (!ORDER_STATUSES.includes(toStatus)) return false;
  const from = normalizeOrderStatus(fromStatus);
  const to = toStatus;
  if (from === to) return true;
  return ORDER_TRANSITIONS[from]?.has(to) || false;
};

export const actorFromUser = (user, fallbackRole = "system") => ({
  user: user?._id || undefined,
  role: user?.isAdmin ? "admin" : user ? "customer" : fallbackRole,
  name: user?.name || "",
  email: user?.email || ""
});

export const appendAdminNote = (order, { body, actor, isPrivate = true, at = new Date() }) => {
  const text = String(body || "").trim();
  if (!text) return;
  if (!Array.isArray(order.adminNotes)) {
    order.adminNotes = [];
  }
  order.adminNotes.push({
    body: text,
    isPrivate: Boolean(isPrivate),
    createdBy: actor,
    createdAt: at
  });
};

export const setOrderStatus = (order, { toStatus, actor, note = "", at = new Date() }) => {
  if (!ORDER_STATUSES.includes(toStatus)) {
    const err = new Error("Invalid order status");
    err.statusCode = 400;
    throw err;
  }
  const next = toStatus;
  const prev = normalizeOrderStatus(order.status);

  if (!canTransitionOrderStatus(prev, next)) {
    const err = new Error(`Invalid status transition: ${prev} -> ${next}`);
    err.statusCode = 400;
    throw err;
  }

  if (prev === next) return;

  order.status = next;
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }

  order.statusHistory.push({
    from: prev,
    to: next,
    note: String(note || "").trim(),
    changedBy: actor,
    changedAt: at
  });

  if (next === "shipped" && !order.fulfillment?.shippedAt) {
    order.fulfillment = order.fulfillment || {};
    order.fulfillment.shippedAt = at;
  }
  if (next === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = order.deliveredAt || at;
  }
  if (next === "cancelled") {
    order.isDelivered = false;
    order.cancelledAt = order.cancelledAt || at;
    order.cancelledBy = order.cancelledBy || actor;
  }
  if (next === "returned") {
    order.isDelivered = false;
  }
  if (next === "refunded") {
    order.isPaid = true;
    order.isDelivered = false;
  }
};

export const ensureOrderLifecycleDefaults = (order) => {
  const status = normalizeOrderStatus(order.status);
  if (order.status !== status) {
    order.status = status;
  }
  if (!Array.isArray(order.statusHistory)) {
    order.statusHistory = [];
  }
  if (!Array.isArray(order.adminNotes)) {
    order.adminNotes = [];
  }
  if (!order.refund) {
    order.refund = { amount: 0, reason: "", sslRefundRefId: "" };
  }
  return order;
};

export const derivePaymentStatus = (order) => {
  if (order?.refundStatus === "success" || normalizeOrderStatus(order?.status) === "refunded") {
    return "refunded";
  }
  const refundAmount = Number(order?.refund?.amount || 0);
  if (refundAmount > 0) return "refunded";
  return order?.isPaid ? "paid" : "pending";
};

/** Customer-facing / admin label key for composite cancelled+refunded state */
export const deriveDisplayStatus = (order) => {
  const status = normalizeOrderStatus(order?.status);
  const refunded =
    status === "refunded" || order?.refundStatus === "success" || Number(order?.refund?.amount || 0) > 0;

  if (order?.cancelledAt && refunded) {
    return "cancelled_refunded";
  }
  return status;
};

export const humanOrderNumber = (id) => String(id || "").slice(-8).toUpperCase();

/** Orders ready to pack/ship: confirmed or processing, paid online or COD (not yet shipped+). */
export const AWAITING_SHIPMENT_STATUSES = ["confirmed", "processing"];

export const awaitingShipmentFilter = () => ({
  status: { $in: AWAITING_SHIPMENT_STATUSES },
  $or: [{ isPaid: true }, { paymentMethod: "CashOnDelivery" }]
});
