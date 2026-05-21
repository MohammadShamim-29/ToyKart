/**
 * SSL Commerz Refund API (official v4 docs)
 * Initiate + status: GET validator/api/merchantTransIDvalidationAPI.php
 * @see https://developer.sslcommerz.com/doc/v4/
 */

const normalizeText = (value) => String(value ?? "").trim();

export const getSslBaseUrl = () => {
  const isLive = String(process.env.SSLCZ_IS_LIVE).toLowerCase() === "true";
  return isLive ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
};

const refundValidatorUrl = () => `${getSslBaseUrl()}/validator/api/merchantTransIDvalidationAPI.php`;

const validateEnvironmentVariables = () => {
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePassword = process.env.SSLCZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new Error("SSLCOMMERZ credentials are not configured");
  }

  return { storeId, storePassword };
};

/** Mandatory refund_trans_id (max 30 chars) — required since 2025-02-24 */
export const buildRefundTransId = (seed) => {
  const compact = String(seed || `TR${Date.now()}`).replace(/[^a-zA-Z0-9]/g, "");
  return compact.slice(0, 30) || `TR${Date.now()}`.slice(0, 30);
};

/**
 * Resolve SSLCommerz bank_tran_id (banks end) — required for refunds.
 */
export const resolveSslBankTranId = (order) => {
  if (!order) return "";
  const bankTranId = normalizeText(order.bankTranId);
  if (bankTranId) return bankTranId;
  const paymentReference = normalizeText(order.paymentReference);
  if (paymentReference && !paymentReference.startsWith("TOYKART_")) {
    return paymentReference;
  }
  const gatewayBank = normalizeText(order.paymentResult?.bank_tran_id);
  if (gatewayBank) return gatewayBank;
  return "";
};

const parseRefundInitiateResponse = (result, fallbackRefId) => {
  const apiConnect = normalizeText(result?.APIConnect).toUpperCase();
  const status = normalizeText(result?.status).toLowerCase();
  const errorReason = normalizeText(result?.errorReason || result?.error_reason);

  if (apiConnect !== "DONE") {
    return {
      success: false,
      status: status || apiConnect || "failed",
      message: errorReason || `SSLCommerz connection failed (${apiConnect || "unknown"})`,
      rawResponse: result
    };
  }

  const success = status === "success" || status === "processing";

  return {
    success,
    status,
    refundRefId: result?.refund_ref_id || fallbackRefId,
    bankTranId: result?.bank_tran_id,
    transactionId: result?.trans_id,
    refundAmount: result?.refund_amount,
    message: success
      ? errorReason || "Refund initiated successfully"
      : errorReason || "Refund request failed",
    rawResponse: result
  };
};

/**
 * Initiate refund — GET merchantTransIDvalidationAPI.php with refund params
 */
export const processSSLCommerZRefund = async (refundData) => {
  const { bankTranId, refundAmount, refundRemarks, refundRefId, refundTransId } = refundData;

  if (!bankTranId) {
    throw new Error("Bank transaction ID is required for refund processing");
  }

  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than 0");
  }

  const { storeId, storePassword } = validateEnvironmentVariables();
  const transId = buildRefundTransId(refundTransId || refundRefId);
  const refeId = String(refundRefId || transId).slice(0, 50);

  const params = new URLSearchParams({
    bank_tran_id: bankTranId,
    refund_trans_id: transId,
    store_id: storeId,
    store_passwd: storePassword,
    refund_amount: String(Number(refundAmount).toFixed(2)),
    refund_remarks: refundRemarks || "Refund approved by admin",
    refe_id: refeId,
    v: "1",
    format: "json"
  });

  const url = `${refundValidatorUrl()}?${params.toString()}`;

  console.log("[SSLCOMMERZ] Initiate refund:", { bankTranId, refundAmount, refund_trans_id: transId });

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`SSLCOMMERZ API returned HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log("[SSLCOMMERZ] Refund initiate response:", result);

  return parseRefundInitiateResponse(result, refeId);
};

/**
 * Query refund status by refund_ref_id from SSLCommerz
 */
export const checkRefundStatus = async (refundRefId) => {
  if (!refundRefId) {
    throw new Error("Refund reference ID is required");
  }

  const { storeId, storePassword } = validateEnvironmentVariables();

  const params = new URLSearchParams({
    refund_ref_id: refundRefId,
    store_id: storeId,
    store_passwd: storePassword,
    format: "json"
  });

  const url = `${refundValidatorUrl()}?${params.toString()}`;

  console.log("[SSLCOMMERZ] Query refund status:", { refundRefId });

  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    throw new Error(`SSLCOMMERZ API returned HTTP ${response.status}`);
  }

  const result = await response.json();
  console.log("[SSLCOMMERZ] Refund status response:", result);

  const apiConnect = normalizeText(result?.APIConnect).toUpperCase();
  const status = normalizeText(result?.status).toLowerCase();
  const errorReason = normalizeText(result?.errorReason || result?.error_reason);

  if (apiConnect !== "DONE") {
    return {
      success: false,
      status: status || apiConnect || "unknown",
      message: errorReason || `SSLCommerz connection failed (${apiConnect || "unknown"})`,
      rawResponse: result
    };
  }

  return {
    success: status === "refunded" || status === "processing",
    status,
    message: errorReason || "Status retrieved",
    rawResponse: result
  };
};

export const validateRefundEligibility = (order, options = {}) => {
  const { sourceType = "cancellation" } = options;
  const errors = [];

  if (sourceType === "cancellation") {
    if (normalizeOrderStatus(order?.status) !== "cancelled") {
      errors.push("Order must be cancelled before processing a refund");
    }
    if (!order?.cancellationApprovedAt) {
      errors.push("Cancellation must be approved by admin before refund can be processed");
    }
  }

  if (order.paymentMethod !== "SSLCommerz") {
    errors.push("Only SSLCommerz online payment orders can be refunded through the gateway");
  }

  if (!order.isPaid) {
    errors.push("Order must be paid before refund");
  }

  if (!resolveSslBankTranId(order)) {
    errors.push("SSLCommerz bank transaction ID not found on this order");
  }

  if (!order.totalPrice || order.totalPrice <= 0) {
    errors.push("Invalid order amount");
  }

  if (order.refundStatus === "success") {
    errors.push("Refund has already been processed for this order");
  }

  return {
    isEligible: errors.length === 0,
    errors
  };
};

const normalizeOrderStatus = (status) => {
  const allowed = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned", "refunded"];
  return allowed.includes(status) ? status : "pending";
};

export default {
  processSSLCommerZRefund,
  checkRefundStatus,
  validateRefundEligibility,
  resolveSslBankTranId,
  buildRefundTransId,
  getSslBaseUrl,
  validateEnvironmentVariables
};
