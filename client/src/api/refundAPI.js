import api from "../api";

/**
 * Refund API services
 */

export const refundAPI = {
  /**
   * Process refund for an order
   * @param {string} orderId - Order ID
   * @param {object} data - Refund data { remarks, sourceType }
   * @returns {Promise<object>}
   */
  processRefund: async (orderId, data = {}) => {
    const response = await api.post(`/refunds/process/${orderId}`, data);
    return response.data;
  },

  /**
   * Get refund status
   * @param {string} refundRefId - Refund Reference ID
   * @returns {Promise<object>}
   */
  getRefundStatus: async (refundRefId) => {
    const response = await api.get(`/refunds/status/${refundRefId}`);
    return response.data;
  },

  /**
   * Get all refunds for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<array>}
   */
  getOrderRefunds: async (orderId) => {
    const response = await api.get(`/refunds/order/${orderId}`);
    return response.data;
  },

  /**
   * Retry failed refund
   * @param {string} refundRefId - Refund Reference ID
   * @param {object} data - Retry data { remarks }
   * @returns {Promise<object>}
   */
  retryFailedRefund: async (refundRefId, data = {}) => {
    const response = await api.post(`/refunds/retry/${refundRefId}`, data);
    return response.data;
  },

  /**
   * Approve order cancellation
   * @param {string} orderId - Order ID
   * @returns {Promise<object>}
   */
  approveCancellation: async (orderId) => {
    const response = await api.post(`/refunds/approve-cancellation/${orderId}`);
    return response.data;
  }
};

export default refundAPI;
