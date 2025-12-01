/**
 * api-server.js - Express API for Submitting Feedback Jobs
 *
 * Key decisions:
 * - POST /feedback accepts {userId, text, metadata} and queues for processing
 * - Uses UUID for jobId if not provided (ensures uniqueness)
 * - Exposes /metrics for Prometheus scraping
 * - Structured JSON logs for Logstash compatibility
 * - Returns jobId immediately (async processing)
 */

import express from "express";
import { v4 as uuidv4 } from "uuid";
import {
  Registry,
  Counter,
  Histogram,
  collectDefaultMetrics,
} from "prom-client";
import pino from "pino";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { addFeedbackJob, feedbackQueue } from "./queue.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ============ LOGGING ============
const logger = pino({
  level: "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ============ METRICS ============
const register = new Registry();

// Collect default Node.js metrics (memory, CPU, etc.)
collectDefaultMetrics({ register });

const httpRequests = new Counter({
  name: "http_requests_total",
  help: "Total HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

const httpDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "path"],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
  registers: [register],
});

const jobsQueued = new Counter({
  name: "feedback_jobs_queued_total",
  help: "Total feedback jobs queued",
  registers: [register],
});

// ============ EXPRESS APP ============
const app = express();
app.use(express.json());

// Request logging and metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    httpRequests.inc({
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode,
    });
    httpDuration.observe(
      { method: req.method, path: req.route?.path || req.path },
      duration
    );
    logger.info(
      { method: req.method, path: req.path, status: res.statusCode, duration },
      "Request"
    );
  });
  next();
});

/**
 * POST /feedback - Submit feedback for async processing
 * Body: { userId: string, text: string, metadata?: object, jobId?: string }
 * Returns: { jobId: string, status: 'queued' }
 */
app.post("/feedback", async (req, res) => {
  try {
    const { userId, text, metadata = {}, jobId } = req.body;

    // Validation
    if (!userId || !text) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["userId", "text"],
      });
    }

    if (typeof text !== "string" || text.length > 5000) {
      return res.status(400).json({
        error: "Text must be a string with max 5000 characters",
      });
    }

    // Generate jobId if not provided (for idempotency, client can provide their own)
    const finalJobId = jobId || uuidv4();

    // Add to queue - BullMQ handles duplicate jobIds automatically
    await addFeedbackJob(finalJobId, { userId, text, metadata });

    jobsQueued.inc();
    logger.info({ jobId: finalJobId, userId }, "Feedback job queued");

    res.status(202).json({
      jobId: finalJobId,
      status: "queued",
      message: "Feedback submitted for processing",
    });
  } catch (error) {
    // Handle duplicate job submission gracefully
    if (error.message?.includes("Duplicated job")) {
      return res.status(200).json({
        jobId: req.body.jobId,
        status: "already_queued",
        message: "Job already exists",
      });
    }

    logger.error({ error: error.message }, "Failed to queue feedback");
    res.status(500).json({ error: "Failed to queue feedback" });
  }
});

/**
 * GET /feedback/:jobId - Check job status
 */
app.get("/feedback/:jobId", async (req, res) => {
  try {
    const job = await feedbackQueue.getJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();
    const result = job.returnvalue;

    res.json({
      jobId: job.id,
      state,
      progress: job.progress,
      attempts: job.attemptsMade,
      result: state === "completed" ? result : null,
      failedReason: state === "failed" ? job.failedReason : null,
    });
  } catch (error) {
    logger.error(
      { error: error.message, jobId: req.params.jobId },
      "Failed to get job"
    );
    res.status(500).json({ error: "Failed to get job status" });
  }
});

/**
 * GET /health - Health check endpoint
 */
app.get("/health", async (req, res) => {
  try {
    // Check Redis connection
    await feedbackQueue.client.ping();
    res.json({ status: "ok", queue: "connected" });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

/**
 * GET /metrics - Prometheus metrics endpoint
 */
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ============ START SERVER ============
const PORT = parseInt(process.env.API_PORT) || 3005;

app.listen(PORT, () => {
  logger.info({ port: PORT }, "API server started");
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("Shutting down API server...");
  await feedbackQueue.close();
  process.exit(0);
});
