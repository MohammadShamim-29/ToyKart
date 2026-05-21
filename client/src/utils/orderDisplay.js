export const orderNumberDisplay = (order) =>
  order?.orderNumber || String(order?._id || order?.id || "").slice(-8).toUpperCase();

export const paymentMethodLabel = (method) => {
  if (method === "SSLCommerz") return "Online payment (Card / MFS)";
  if (method === "CashOnDelivery") return "Cash on delivery";
  return method || "—";
};

export const paymentStatusLabel = (order) => {
  if (order?.paymentStatus) {
    const s = String(order.paymentStatus);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  if (order?.paymentMethod === "CashOnDelivery") return "Pay on delivery";
  if (order?.isPaid) return "Paid";
  return "Pending";
};

export const orderStatusLabel = (status) => {
  const s = String(status || "pending").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
};
