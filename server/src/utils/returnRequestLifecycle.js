export const isCodOrder = (order) => order?.paymentMethod === "CashOnDelivery";

/** Return statuses allowed after REFUND_APPROVED for COD (manual payout, no SSL gateway). */
export const COD_POST_REFUND_APPROVED_STATUSES = ["REFUND_PROCESSED", "COMPLETED"];

const BASE_TRANSITIONS = {
  PENDING: ["UNDER_REVIEW", "NEED_MORE_INFO", "REJECTED"],
  UNDER_REVIEW: ["NEED_MORE_INFO", "APPROVED_FOR_PICKUP", "REJECTED"],
  NEED_MORE_INFO: ["CUSTOMER_RESPONDED", "UNDER_REVIEW"],
  CUSTOMER_RESPONDED: ["UNDER_REVIEW", "NEED_MORE_INFO", "APPROVED_FOR_PICKUP"],
  APPROVED_FOR_PICKUP: ["PICKUP_SCHEDULED"],
  PICKUP_SCHEDULED: ["PICKED_UP"],
  PICKED_UP: ["INSPECTION_COMPLETED"],
  INSPECTION_COMPLETED: ["REFUND_APPROVED", "REFUND_REJECTED", "REPLACEMENT_APPROVED"],
  REFUND_APPROVED: ["REFUND_PROCESSED"],
  REFUND_PROCESSED: ["COMPLETED"],
  REPLACEMENT_APPROVED: ["REPLACEMENT_SHIPPED"],
  REPLACEMENT_SHIPPED: ["REPLACEMENT_DELIVERED"],
  REPLACEMENT_DELIVERED: ["COMPLETED"],
  REFUND_REJECTED: ["ITEM_RETURNED_TO_CUSTOMER"],
  ITEM_RETURNED_TO_CUSTOMER: ["CLOSED"],
  REJECTED: ["CLOSED"]
};

export const getAllowedReturnTransitions = (currentStatus, order) => {
  const allowed = [...(BASE_TRANSITIONS[currentStatus] || [])];
  if (currentStatus === "REFUND_APPROVED" && isCodOrder(order)) {
    for (const next of COD_POST_REFUND_APPROVED_STATUSES) {
      if (!allowed.includes(next)) allowed.push(next);
    }
  }
  return allowed;
};

export const canTransitionReturnStatus = (fromStatus, toStatus, order) =>
  getAllowedReturnTransitions(fromStatus, order).includes(toStatus);
