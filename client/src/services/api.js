import axios from "axios";
import Cookie from "js-cookie";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// API Endpoints
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  isAuthenticated: () => api.post("/auth/is-auth"),
  sendVerifyOtp: (userId) => api.post("/auth/send-verify-otp", { userId }),
  verifyEmail: (userId, otp) => api.post("/auth/verify-email", { userId, otp }),
  sendResetOtp: (email) => api.post("/auth/send-reset-otp", { email }),
  resetPassword: (email, otp, newPassword) =>
    api.post("/auth/reset-password", { email, otp, newPassword }),
};

export const userAPI = {
  getUserData: (userId) => api.post("/user/get-user-data", { userId }),
};

export default api;
