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
  labelNames: ["method", "route", "status_code"],
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

// New metrics for Grafana dashboard
export const usersTotal = new Gauge({
  name: "users_total",
  help: "Total number of users in the system",
  registers: [register],
});

export const usersOnline = new Gauge({
  name: "users_online",
  help: "Number of currently online users",
  registers: [register],
});

export const feedbackTotal = new Gauge({
  name: "feedback_total",
  help: "Total feedback count",
  registers: [register],
});

export const feedbackSentiment = new Gauge({
  name: "feedback_sentiment",
  help: "Feedback count by sentiment",
  labelNames: ["sentiment"],
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
    const [total, verified, online] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ isAccountVerified: true }),
      userModel.countDocuments({ isOnline: true }),
    ]);
    activeUsers.set(total);
    verifiedUsers.set(verified);
    usersTotal.set(total);
    usersOnline.set(online);
  } catch (err) {
    console.error("Error updating user metrics:", err.message);
  }
};

// Update feedback metrics
export const updateFeedbackMetrics = async (db) => {
  try {
    const totalFeedback = await db
      .collection("feedback_results")
      .countDocuments({});
    feedbackTotal.set(totalFeedback);

    const sentiments = await db
      .collection("feedback_results")
      .aggregate([{ $group: { _id: "$sentiment", count: { $sum: 1 } } }])
      .toArray();

    // Reset all sentiment gauges first
    feedbackSentiment.set({ sentiment: "positive" }, 0);
    feedbackSentiment.set({ sentiment: "neutral" }, 0);
    feedbackSentiment.set({ sentiment: "negative" }, 0);

    sentiments.forEach((s) => {
      if (s._id) {
        feedbackSentiment.set({ sentiment: s._id.toLowerCase() }, s.count);
      }
    });
  } catch (err) {
    console.error("Error updating feedback metrics:", err.message);
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
      status_code: res.statusCode,
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

    // Try to update feedback metrics if MongoDB is available
    try {
      const { MongoClient } = await import("mongodb");
      const client = new MongoClient(process.env.MONGO_URI);
      await client.connect();
      const db = client.db(process.env.MONGO_DB || "feedback_pipeline");
      await updateFeedbackMetrics(db);
      await client.close();
    } catch (err) {
      // Feedback DB might not be available, that's ok
    }

    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
};
