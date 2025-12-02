import axios from "./axiosConfig";

const API_URL = "/api/categories";

export const categoryService = {
  // Get all categories
  getAllCategories: async () => {
    try {
      const response = await axios.get(API_URL);
      console.log("CategoryService - getAllCategories response:", response.data);
      return response.data;
    } catch (error) {
      console.error("CategoryService - getAllCategories error:", error);
      throw error;
    }
  },

  // Get category by ID
  getCategoryById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      console.log("CategoryService - getCategoryById response:", response.data);
      return response.data;
    } catch (error) {
      console.error("CategoryService - getCategoryById error:", error);
      throw error;
    }
  },

  // Create new category
  createCategory: async (categoryData) => {
    try {
      const response = await axios.post(API_URL, categoryData);
      console.log("CategoryService - createCategory response:", response.data);
      return response.data;
    } catch (error) {
      console.error("CategoryService - createCategory error:", error);
      throw error;
    }
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, categoryData);
      console.log("CategoryService - updateCategory response:", response.data);
      return response.data;
    } catch (error) {
      console.error("CategoryService - updateCategory error:", error);
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      console.log("CategoryService - deleteCategory response:", response.data);
      return response.data;
    } catch (error) {
      console.error("CategoryService - deleteCategory error:", error);
      throw error;
    }
  },
};