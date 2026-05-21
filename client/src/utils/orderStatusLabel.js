const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
  refunded: "Refunded",
  cancelled_refunded: "Cancelled · Refunded"
};

export const getOrderStatusKey = (order) => {
  if (!order) return "pending";
  if (order.displayStatus) return order.displayStatus;
  const status = String(order.status || "pending").toLowerCase();
  const refunded =
    status === "refunded" ||
    order.refundStatus === "success" ||
    Number(order?.refund?.amount || 0) > 0;

  if (order.cancelledAt && refunded) {
    return "cancelled_refunded";
  }
  return status;
};

export const getOrderStatusLabel = (order) => {
  const key = getOrderStatusKey(order);
  return STATUS_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1);
};

export const ORDER_STATUS_UI = {
  pending: { label: "Pending", color: "#d97706", bg: "#fef3c7" },
  confirmed: { label: "Confirmed", color: "#2563eb", bg: "#dbeafe" },
  processing: { label: "Processing", color: "#7c3aed", bg: "#ede9fe" },
  shipped: { label: "Shipped", color: "#0891b2", bg: "#cffafe" },
  delivered: { label: "Delivered", color: "#059669", bg: "#d1fae5" },
  cancelled: { label: "Cancelled", color: "#dc2626", bg: "#fee2e2" },
  returned: { label: "Returned", color: "#d97706", bg: "#fef3c7" },
  refunded: { label: "Refunded", color: "#0891b2", bg: "#cffafe" },
  cancelled_refunded: { label: "Cancelled · Refunded", color: "#0f766e", bg: "#ccfbf1" }
};

export const getOrderStatusUi = (order) => {
  const key = getOrderStatusKey(order);
  return ORDER_STATUS_UI[key] || { label: getOrderStatusLabel(order), color: "#6b7280", bg: "#f3f4f6" };
};
