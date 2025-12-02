// src/service/axiosConfig.js
import axios from "axios";

// ==========================================================
// BACKEND BASE URL (FINAL)
// Remove /librario because your backend URLs are /api/*
// ==========================================================
const BASE_URL = "http://localhost:1205/librario";

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ==========================================================
// REQUEST INTERCEPTOR — ATTACH TOKEN FOR PROTECTED ROUTES
// ==========================================================
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    const publicEndpoints = [
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
    ];

    const isPublic = publicEndpoints.some((path) =>
      config.url.includes(path)
    );

    if (!isPublic && token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================================
// RESPONSE INTERCEPTOR — AUTO LOGOUT ON 401
// ==========================================================
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ==========================================================
// BOOK APIs
// ==========================================================
export const bookAPI = {
  getAllBooks: () => instance.get("/api/books"),
  getBookById: (id) => instance.get(`/api/books/${id}`),
  searchBooks: (data) => instance.post("/api/books/search", data),
  createBook: (data) => instance.post("/api/books", data),
  updateBook: (id, data) => instance.put(`/api/books/${id}`, data),
  deleteBook: (id) => instance.delete(`/api/books/${id}`),
  getAvailableBooks: () => instance.get("/api/books/available"),
};

// ==========================================================
// MEMBER APIs
// ==========================================================
export const memberAPI = {
  getAllMembers: () => instance.get("/api/members"),
  getMemberById: (id) => instance.get(`/api/members/${id}`),
  searchMembers: (data) => instance.post("/api/members/search", data),
  createMember: (data) => instance.post("/api/members", data),
  updateMember: (id, data) => instance.put(`/api/members/${id}`, data),
  deleteMember: (id) => instance.delete(`/api/members/${id}`),
  updateMembershipStatus: (id, status) =>
    instance.patch(`/api/members/${id}/status`, null, { params: { status } }),
  extendMembership: (id, months) =>
    instance.patch(`/api/members/${id}/extend`, null, { params: { months } }),
};

// ==========================================================
// BORROW & RETURN APIs
// ==========================================================
export const borrowAPI = {
  issueBook: (data) => instance.post("/api/borrow/issue", data),
  returnBook: (data) => instance.post("/api/borrow/return", data),
  getBorrowRecordById: (id) => instance.get(`/api/borrow/${id}`),
  getBorrowHistory: (data) => instance.post("/api/borrow/history", data),
  getActiveBorrowsByUser: (userId) =>
    instance.get(`/api/borrow/user/${userId}/active`),
  getOverdueBooks: () => instance.get("/api/borrow/overdue"),
  calculatePenalty: (id) => instance.get(`/api/borrow/${id}/penalty`),
};

// ==========================================================
// CATEGORY APIs
// ==========================================================
export const categoryAPI = {
  getAllCategories: () => instance.get("/api/categories"),
  getCategoryById: (id) => instance.get(`/api/categories/${id}`),
  createCategory: (data) => instance.post("/api/categories", data),
  updateCategory: (id, data) => instance.put(`/api/categories/${id}`, data),
  deleteCategory: (id) => instance.delete(`/api/categories/${id}`),
};

// ==========================================================
// AUTH APIs
// ==========================================================
export const authAPI = {
  login: (data) => instance.post("/api/auth/login", data),
  register: (data) => instance.post("/api/auth/register", data),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
  isAuthenticated: () => !!localStorage.getItem("token"),
};

// ==========================================================
// HELPERS
// ==========================================================
export const setAuthToken = (token) => localStorage.setItem("token", token);
export const removeAuthToken = () => localStorage.removeItem("token");

export default instance;
