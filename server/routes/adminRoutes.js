import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  getAdminStats,
  getAllUsersAdmin,
  getAllFeedbackAdmin,
  deleteUser,
  getSystemHealth,
  controlDockerMonitoring,
} from "../controllers/adminController.js";

const adminRouter = express.Router();

// All routes require admin authentication
adminRouter.use(adminAuth);

// Dashboard stats
adminRouter.get("/stats", getAdminStats);

// User management
adminRouter.get("/users", getAllUsersAdmin);
adminRouter.delete("/users/:userId", deleteUser);

// Feedback management
adminRouter.get("/feedback", getAllFeedbackAdmin);

// System health
adminRouter.get("/health", getSystemHealth);

// Docker monitoring control
adminRouter.post("/docker/:action", controlDockerMonitoring);

export default adminRouter;
