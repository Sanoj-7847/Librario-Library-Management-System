import axios from "./axiosConfig";

const API_URL = "/api/borrow";

export const borrowService = {
  // Issue a book
  issueBook: async (borrowData) => {
    const response = await axios.post(`${API_URL}/issue`, borrowData);
    return response.data;
  },

  // Return a book
  returnBook: async (returnData) => {
    const response = await axios.post(`${API_URL}/return`, returnData);
    return response.data;
  },

  // Get borrow record by ID
  getBorrowRecordById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  // Get my borrow history (for current user)
  getMyHistory: async () => {
    const response = await axios.get(`${API_URL}/my-history`);
    return response.data;
  },

  // Get all active borrows (Admin/Librarian)
  getAllActiveBorrows: async () => {
    const response = await axios.get(`${API_URL}/active`);
    return response.data;
  },

  // Get borrow history with filters
  getBorrowHistory: async (filters) => {
    const response = await axios.post(`${API_URL}/history`, filters);
    return response.data;
  },

  // Get active borrows by user ID
  getActiveBorrowsByUser: async (userId) => {
    const response = await axios.get(`${API_URL}/user/${userId}/active`);
    return response.data;
  },

  // Get overdue records
  getOverdueRecords: async () => {
    const response = await axios.get(`${API_URL}/overdue`);
    return response.data;
  },

  // Calculate penalty
  calculatePenalty: async (id) => {
    const response = await axios.get(`${API_URL}/${id}/penalty`);
    return response.data;
  },

  // Mark penalty as paid
  markPenaltyAsPaid: async (id) => {
    const response = await axios.patch(`${API_URL}/${id}/penalty/paid`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await axios.get(`${API_URL}/statistics`);
    return response.data;
  }
};

export default borrowService;