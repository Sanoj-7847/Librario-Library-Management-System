import axios from "./axiosConfig";

export const authService = {
  register: (data) => axios.post("/api/auth/register", data).then(res => res.data),
  login: (data) => axios.post("/api/auth/login", data).then(res => res.data),

  forgotPassword: (email) => axios.post("/api/auth/forgot-password", { email }).then(res => res.data),
  verifyOtp: (email, otp) => axios.post("/api/auth/verify-otp", { email, otp }).then(res => res.data),
  resetPassword: (email, otp, newPassword) =>
    axios.post("/api/auth/reset-password", { email, otp, newPassword }).then(res => res.data),

  getCurrentUser: () => JSON.parse(localStorage.getItem("user") || "null"),
  isAuthenticated: () => !!localStorage.getItem("token"),
};
