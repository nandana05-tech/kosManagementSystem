import api from './api';

export const paymentService = {
  /**
   * Get all payments
   */
  getAll: async (params = {}) => {
    return api.get('/payment', { params });
  },

  /**
   * Get payment by ID
   */
  getById: async (id) => {
    return api.get(`/payment/${id}`);
  },

  /**
   * Create payment (initiate Midtrans transaction)
   */
  create: async (data) => {
    return api.post('/payment', data);
  },

  /**
   * Verify payment manually (Pemilik only)
   */
  verify: async (id) => {
    return api.post(`/payment/${id}/verify`);
  },

  /**
   * Check payment status from Midtrans
   */
  checkStatus: async (id) => {
    return api.get(`/payment/${id}/status`);
  },

  /**
   * Sync payment status from Midtrans (after redirect)
   */
  syncStatus: async (orderId) => {
    return api.get(`/payment/sync/${orderId}`);
  },

  /**
   * Cancel payment
   */
  cancel: async (id) => {
    return api.post(`/payment/${id}/cancel`);
  },

  /**
   * Get payments grouped by user (Pemilik only)
   */
  getGroupedByUser: async (params = {}) => {
    return api.get('/payment/grouped', { params });
  },

  /**
   * Get payment summary
   */
  getSummary: async () => {
    return api.get('/payment/summary');
  },
};

export default paymentService;
