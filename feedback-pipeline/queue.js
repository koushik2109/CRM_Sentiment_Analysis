/**
 * queue.js - BullMQ Queue Configuration
 *
 * Key decisions:
 * - Uses ioredis for Redis connection (required by BullMQ)
 * - Exports both Queue (for adding jobs) and connection (for workers)
 * - Default job options include retry with exponential backoff
 */

import { Queue } from "bullmq";
import IORedis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Shared Redis connection config
export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Required for BullMQ
};

// Create Redis connection for BullMQ
export const connection = new IORedis(redisConfig);

// Feedback processing queue with sensible defaults
export const feedbackQueue = new Queue("feedback-processing", {
  connection,
  defaultJobOptions: {
    // Exponential backoff: 1s, 2s, 4s (2^attempt * 1000ms)
    attempts: parseInt(process.env.MAX_RETRIES) || 3,
    backoff: {
      type: "exponential",
      delay: 1000, // Base delay 1 second
    },
    // Remove completed jobs after 24h, failed after 7 days
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

/**
 * Add feedback job to queue
 * @param {string} jobId - Unique job ID (for idempotency)
 * @param {object} data - {userId, text, metadata}
 */
export async function addFeedbackJob(jobId, data) {
  // jobId as the job name ensures idempotency - same jobId won't create duplicate
  return feedbackQueue.add("process-feedback", data, {
    jobId, // Unique ID prevents duplicate processing
  });
}

export default feedbackQueue;
