import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";
import userModel from "../models/userModel.js";

// Create a Registry
export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestsTotal = new Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const activeUsers = new Gauge({
  name: "active_users_total",
  help: "Total number of registered users",
  registers: [register],
});

export const verifiedUsers = new Gauge({
  name: "verified_users_total",
  help: "Total number of verified users",
  registers: [register],
});

export const feedbackSubmitted = new Counter({
  name: "feedback_submitted_total",
  help: "Total feedback submissions",
  registers: [register],
});

export const feedbackBySentiment = new Counter({
  name: "feedback_by_sentiment_total",
  help: "Feedback count by sentiment",
  labelNames: ["sentiment"],
  registers: [register],
});

// Update user metrics periodically
export const updateUserMetrics = async () => {
  try {
    const [total, verified] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ isAccountVerified: true }),
    ]);
    activeUsers.set(total);
    verifiedUsers.set(verified);
  } catch (err) {
    console.error("Error updating user metrics:", err.message);
  }
};

// Middleware to track requests
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || "unknown";

    httpRequestsTotal.inc({
      method: req.method,
      route: route,
      status: res.statusCode,
    });

    httpRequestDuration.observe({ method: req.method, route: route }, duration);
  });

  next();
};

// Get metrics endpoint handler
export const getMetrics = async (req, res) => {
  try {
    // Update user metrics before returning
    await updateUserMetrics();

    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};
