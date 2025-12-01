/**
 * worker.js - BullMQ Worker for Feedback Processing
 *
 * Key decisions:
 * - Idempotent storage: Uses jobId as MongoDB _id (upsert prevents duplicates)
 * - Concurrency tunable via env var for throughput optimization
 * - Prometheus metrics for monitoring (duration, success, failures)
 * - Structured JSON logs (pino) for Logstash/ELK ingestion
 * - Graceful shutdown on SIGTERM/SIGINT
 */

import { Worker } from "bullmq";
import { MongoClient } from "mongodb";
import { Registry, Counter, Histogram } from "prom-client";
import pino from "pino";
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connection } from "./queue.js";
import { analyzeSentiment } from "./ai-client.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// ============ LOGGING ============
// Structured JSON logs for Logstash
const logger = pino({
  level: "info",
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// ============ METRICS ============
// Separate registry for worker metrics
const register = new Registry();

const jobsProcessed = new Counter({
  name: "feedback_jobs_processed_total",
  help: "Total feedback jobs processed",
  labelNames: ["status"], // success, failed
  registers: [register],
});

const jobDuration = new Histogram({
  name: "feedback_job_duration_seconds",
  help: "Job processing duration in seconds",
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register],
});

const sentimentDistribution = new Counter({
  name: "feedback_sentiment_total",
  help: "Distribution of sentiment results",
  labelNames: ["sentiment"],
  registers: [register],
});

// ============ MONGODB ============
const mongoClient = new MongoClient(
  process.env.MONGO_URI || "mongodb://localhost:27017"
);
let feedbackCollection;

async function connectMongo() {
  await mongoClient.connect();
  const db = mongoClient.db(process.env.MONGO_DB || "feedback_pipeline");
  feedbackCollection = db.collection("feedback_results");

  // Create unique index on jobId for idempotency
  await feedbackCollection.createIndex({ jobId: 1 }, { unique: true });
  logger.info("MongoDB connected");
}

/**
 * Store result idempotently using jobId
 * Upsert ensures same job processed twice won't create duplicates
 */
async function storeResult(jobId, userId, text, metadata, result) {
  const doc = {
    jobId,
    userId,
    text,
    metadata,
    result,
    processedAt: new Date(),
  };

  // Upsert: insert if not exists, update if exists (idempotent)
  await feedbackCollection.updateOne(
    { jobId }, // Filter by unique jobId
    { $set: doc },
    { upsert: true }
  );
}

// ============ WORKER ============
const CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY) || 5;

const worker = new Worker(
  "feedback-processing",
  async (job) => {
    const startTime = Date.now();
    const { userId, text, metadata } = job.data;

    logger.info(
      { jobId: job.id, userId, attempt: job.attemptsMade + 1 },
      "Processing job"
    );

    try {
      // Call AI API for sentiment analysis
      const result = await analyzeSentiment(text);

      // Store result idempotently (jobId as unique key)
      await storeResult(job.id, userId, text, metadata, result);

      // Record metrics
      const duration = (Date.now() - startTime) / 1000;
      jobDuration.observe(duration);
      jobsProcessed.inc({ status: "success" });
      sentimentDistribution.inc({ sentiment: result.sentiment });

      logger.info(
        {
          jobId: job.id,
          userId,
          sentiment: result.sentiment,
          score: result.score,
          duration,
        },
        "Job completed"
      );

      return result;
    } catch (error) {
      jobsProcessed.inc({ status: "failed" });

      logger.error(
        {
          jobId: job.id,
          userId,
          error: error.message,
          attempt: job.attemptsMade + 1,
          retryable: error.retryable,
        },
        "Job failed"
      );

      // Rethrow to trigger BullMQ retry with exponential backoff
      throw error;
    }
  },
  {
    connection,
    concurrency: CONCURRENCY, // Process N jobs in parallel
  }
);

// Worker event handlers
worker.on("ready", () =>
  logger.info({ concurrency: CONCURRENCY }, "Worker ready")
);
worker.on("error", (err) =>
  logger.error({ error: err.message }, "Worker error")
);

// ============ METRICS SERVER ============
const app = express();
const METRICS_PORT = parseInt(process.env.WORKER_METRICS_PORT) || 3006;

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", worker: worker.isRunning() });
});

// ============ STARTUP & SHUTDOWN ============
async function start() {
  await connectMongo();
  app.listen(METRICS_PORT, () => {
    logger.info({ port: METRICS_PORT }, "Worker metrics server started");
  });
}

async function shutdown() {
  logger.info("Shutting down worker...");
  await worker.close();
  await mongoClient.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start().catch((err) => {
  logger.error({ error: err.message }, "Failed to start worker");
  process.exit(1);
});
