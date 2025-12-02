import axios from './axiosConfig';

const API_URL = '/api/book-requests';

export const bookRequestService = {
  // Member: Create request
  createRequest: async (bookId, notes) => {
    const response = await axios.post(API_URL, { bookId, notes });
    return response.data;
  },

  // Member: Get my requests
  getMyRequests: async () => {
    const response = await axios.get(`${API_URL}/my-requests`);
    return response.data;
  },

  // Member: Cancel request
  cancelRequest: async (requestId) => {
    const response = await axios.delete(`${API_URL}/${requestId}/cancel`);
    return response.data;
  },

  // Admin: Get pending requests
  getPendingRequests: async () => {
    const response = await axios.get(`${API_URL}/pending`);
    return response.data;
  },

  // Admin: Get all requests
  getAllRequests: async () => {
    const response = await axios.get(`${API_URL}/all`);
    return response.data;
  },

  // Admin: Approve request
  approveRequest: async (requestId, adminNotes) => {
    const response = await axios.post(`${API_URL}/${requestId}/process`, {
      action: 'APPROVE',
      adminNotes
    });
    return response.data;
  },

  // Admin: Rejection request
  declineRequest: async (requestId, adminNotes) => {
    const response = await axios.post(`${API_URL}/${requestId}/process`, {
      action: 'REJECT',
      adminNotes
    });
    return response.data;
  }
};

export default bookRequestService;