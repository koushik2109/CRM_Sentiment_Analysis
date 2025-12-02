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
  getAllUsers: () => api.get("/user/all"),
  updateProfile: (data) => api.put("/user/profile", data),
  changePassword: (currentPassword, newPassword) =>
    api.put("/user/password", { currentPassword, newPassword }),
  updateNotifications: (notifications) =>
    api.put("/user/notifications", { notifications }),
  inviteUser: (email, role) => api.post("/user/invite", { email, role }),
  updateUserRole: (userId, role) => api.put(`/user/${userId}/role`, { role }),
  heartbeat: () => api.post("/user/heartbeat"),
};

export const feedbackAPI = {
  submit: (text, metadata = {}) =>
    api.post("/feedback/submit", { text, metadata }),
  getResult: (jobId) => api.get(`/feedback/result/${jobId}`),
  getHistory: (page = 1, limit = 10) =>
    api.get(`/feedback/history?page=${page}&limit=${limit}`),
  getStats: () => api.get("/feedback/stats"),
  getHealth: () => api.get("/feedback/health"),
  clearHistory: () => api.delete("/feedback/clear"),
};

export const adminAPI = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (page = 1, limit = 10, search = "") =>
    api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getFeedback: (page = 1, limit = 10) =>
    api.get(`/admin/feedback?page=${page}&limit=${limit}`),
  getHealth: () => api.get("/admin/health"),
  controlDocker: (action) => api.post(`/admin/docker/${action}`),
};

export default api;
