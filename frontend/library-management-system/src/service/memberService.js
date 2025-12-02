import axios from "./axiosConfig";

const API_URL = "/api/members";

export const memberService = {
  getAllMembers: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },

  getMemberById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },

  createMember: async (memberData) => {
    const response = await axios.post(API_URL, memberData);
    return response.data;
  },

  updateMember: async (id, memberData) => {
    const response = await axios.put(`${API_URL}/${id}`, memberData);
    return response.data;
  },

  deleteMember: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  },
};
