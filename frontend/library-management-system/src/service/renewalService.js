import axios from './axiosConfig';

const API_URL = '/api/renewals';

export const renewalService = {
  // Member: Create renewal request
  createRequest: async (borrowRecordId, renewalDays, reason) => {
    const response = await axios.post(API_URL, {
      borrowRecordId,
      renewalDays,
      reason
    });
    return response.data;
  },

  // Member: Get my renewal requests
  getMyRequests: async () => {
    const response = await axios.get(`${API_URL}/my-requests`);
    return response.data;
  },

  // Member: Cancel renewal request
  cancelRequest: async (requestId) => {
    const response = await axios.delete(`${API_URL}/${requestId}/cancel`);
    return response.data;
  },

  // Admin: Get pending renewal requests
  getPendingRequests: async () => {
    const response = await axios.get(`${API_URL}/pending`);
    return response.data;
  },

  // Admin: Process renewal request (approve/reject)
  processRequest: async (requestId, action, renewalDays, adminNotes) => {
    const response = await axios.post(`${API_URL}/${requestId}/process`, {
      action,
      renewalDays,
      adminNotes
    });
    return response.data;
  }
};

export default renewalService;