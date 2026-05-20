/**
 * SSL Commerz Refund Utility Functions
 * Handles all communication with SSLCOMMERZ refund APIs
 */

const getSslBaseUrl = () => {
  const isLive = String(process.env.SSLCZ_IS_LIVE).toLowerCase() === "true";
  return isLive ? "https://securepay.sslcommerz.com" : "https://sandbox.sslcommerz.com";
};

const validateEnvironmentVariables = () => {
  const storeId = process.env.SSLCZ_STORE_ID;
  const storePassword = process.env.SSLCZ_STORE_PASSWORD;

  if (!storeId || !storePassword) {
    throw new Error("SSLCOMMERZ credentials are not configured");
  }

  return { storeId, storePassword };
};

/**
 * Process refund through SSLCOMMERZ gateway
 * @param {Object} refundData - Refund request data
 * @returns {Promise<Object>} Gateway response
 */
export const processSSLCommerZRefund = async (refundData) => {
  const { bankTranId, refundAmount, refundRemarks, refundRefId } = refundData;

  if (!bankTranId) {
    throw new Error("Bank Transaction ID is required for refund processing");
  }

  if (refundAmount <= 0) {
    throw new Error("Refund amount must be greater than 0");
  }

  try {
    const { storeId, storePassword } = validateEnvironmentVariables();
    const baseUrl = getSslBaseUrl();

    // Build refund request parameters
    const params = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      bank_tran_id: bankTranId,
      refund_amount: String(Number(refundAmount).toFixed(2)),
      refund_remarks: refundRemarks || "Refund approved by admin",
      refe_id: refundRefId,
      format: "json"
    });

    console.log("[SSLCOMMERZ] Processing refund:", {
      bankTranId,
      refundAmount,
      refundRefId
    });

    // Make request to SSLCOMMERZ refund API
    const response = await fetch(
      `${baseUrl}/gwprocess/v4/refund.php`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      }
    );

    if (!response.ok) {
      throw new Error(`SSLCOMMERZ API returned status ${response.status}`);
    }

    const result = await response.json();

    console.log("[SSLCOMMERZ] Refund response:", result);

    // Validate and parse response
    if (!result) {
      throw new Error("Empty response from SSLCOMMERZ");
    }

    return {
      success: result.status === "success",
      status: result.status || "unknown",
      refundRefId: result.refund_ref_id || refundRefId,
      bankTranId: result.bank_tran_id,
      transactionId: result.tran_id,
      refundAmount: result.refund_amount,
      message: result.status_message || result.error_reason || "Refund processed",
      rawResponse: result
    };
  } catch (error) {
    console.error("[SSLCOMMERZ] Refund processing error:", error);
    throw new Error(`SSL Commerz refund failed: ${error.message}`);
  }
};

/**
 * Check refund status from SSLCOMMERZ gateway
 * @param {string} refundRefId - Refund Reference ID
 * @returns {Promise<Object>} Status response
 */
export const checkRefundStatus = async (refundRefId) => {
  if (!refundRefId) {
    throw new Error("Refund Reference ID is required");
  }

  try {
    const { storeId, storePassword } = validateEnvironmentVariables();
    const baseUrl = getSslBaseUrl();

    const params = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      refe_id: refundRefId,
      format: "json"
    });

    console.log("[SSLCOMMERZ] Checking refund status:", { refundRefId });

    const response = await fetch(
      `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php?${params.toString()}`,
      {
        method: "GET"
      }
    );

    if (!response.ok) {
      throw new Error(`SSLCOMMERZ API returned status ${response.status}`);
    }

    const result = await response.json();

    console.log("[SSLCOMMERZ] Status check response:", result);

    return {
      success: result.status === "success" || result.status === "VALID",
      status: result.status || "unknown",
      message: result.status_message || result.error_reason || "Status retrieved",
      rawResponse: result
    };
  } catch (error) {
    console.error("[SSLCOMMERZ] Status check error:", error);
    throw new Error(`Failed to check refund status: ${error.message}`);
  }
};

/**
 * Validate that order is eligible for refund
 * @param {Object} order - Order object
 * @returns {Object} Validation result
 */
export const validateRefundEligibility = (order) => {
  const errors = [];

  // Check payment method
  if (order.paymentMethod !== "SSLCommerz") {
    errors.push("Only online payment orders are eligible for gateway refund");
  }

  // Check if order is paid
  if (!order.isPaid) {
    errors.push("Order must be paid before refund");
  }

  // Check for transaction ID
  if (!order.paymentReference) {
    errors.push("Transaction ID not found for this order");
  }

  // Check total amount
  if (!order.totalPrice || order.totalPrice <= 0) {
    errors.push("Invalid order amount");
  }

  return {
    isEligible: errors.length === 0,
    errors
  };
};

export default {
  processSSLCommerZRefund,
  checkRefundStatus,
  validateRefundEligibility,
  getSslBaseUrl,
  validateEnvironmentVariables
};
