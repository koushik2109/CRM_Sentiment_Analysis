import { Queue } from "bullmq";
import IORedis from "ioredis";
import { MongoClient } from "mongodb";
import crypto from "crypto";
import axios from "axios";

// AI Client Configuration
const HUGGINGFACE_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const AI_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGINGFACE_MODEL}`;
const AI_API_KEY = process.env.AI_API_KEY;
const AI_TIMEOUT_MS = 30000;

// Create AI client
const aiClient = axios.create({
  baseURL: AI_API_URL,
  timeout: AI_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    ...(AI_API_KEY && { Authorization: `Bearer ${AI_API_KEY}` }),
  },
});

// Lazy initialization - connections created on first use
let connection = null;
let feedbackQueue = null;
let mongoClient = null;
let feedbackDb = null;
let redisAvailable = null; // null = not checked, true/false = checked

// Check if Redis is available
async function checkRedisConnection() {
  if (redisAvailable !== null) return redisAvailable;

  try {
    const testConn = new IORedis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry
    });

    await testConn.ping();
    await testConn.quit();
    redisAvailable = true;
    console.log("✅ Redis connection successful");
  } catch (err) {
    redisAvailable = false;
    console.warn(
      "⚠️ Redis not available - feedback queue features disabled:",
      err.message
    );
  }

  return redisAvailable;
}

// Get Redis connection (lazy init)
function getRedisConnection() {
  if (!connection) {
    const redisConfig = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true, // Don't connect immediately
    };
    connection = new IORedis(redisConfig);

    connection.on("error", (err) => {
      console.error("Redis connection error:", err.message);
      redisAvailable = false;
    });
  }
  return connection;
}

// Get BullMQ queue (lazy init)
function getQueue() {
  if (!feedbackQueue) {
    feedbackQueue = new Queue("feedback-processing", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: parseInt(process.env.MAX_RETRIES) || 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: { age: 86400 },
        removeOnFail: { age: 604800 },
      },
    });
  }
  return feedbackQueue;
}

// Get MongoDB connection (lazy init)
async function getMongoDb() {
  if (!feedbackDb) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    feedbackDb = mongoClient.db(process.env.MONGO_DB || "feedback_pipeline");
  }
  return feedbackDb;
}

/**
 * Analyze sentiment using Hugging Face AI
 */
async function analyzeWithAI(text) {
  try {
    const response = await aiClient.post("", {
      inputs: text,
      options: { wait_for_model: true },
    });

    const raw = response.data;

    // Handle Hugging Face format: [[{label, score}, ...]]
    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const results = raw[0];
      const top = results.reduce(
        (a, b) => (a.score > b.score ? a : b),
        results[0]
      );

      const labelMap = {
        POSITIVE: "positive",
        NEGATIVE: "negative",
        NEUTRAL: "neutral",
        positive: "positive",
        negative: "negative",
        neutral: "neutral",
        LABEL_0: "negative",
        LABEL_1: "neutral",
        LABEL_2: "positive",
      };

      return {
        sentiment: labelMap[top.label] || top.label.toLowerCase(),
        confidence: Math.round(top.score * 100) / 100,
        allScores: results.map((r) => ({
          label: r.label,
          score: Math.round(r.score * 100) / 100,
          percentage: `${(r.score * 100).toFixed(1)}%`,
        })),
        intents: extractIntents(text),
        raw,
        aiProcessed: true,
      };
    }
    return null;
  } catch (error) {
    // Only log once - 401 means invalid API key
    if (error.response?.status === 401) {
      if (!analyzeWithAI.loggedAuthError) {
        console.warn(
          "⚠️ AI API: Invalid or expired API key - using fallback sentiment analysis"
        );
        analyzeWithAI.loggedAuthError = true;
      }
    } else {
      console.error("AI API error:", error.message);
    }
    return null;
  }
}

/**
 * Extract intents from text
 */
function extractIntents(text) {
  const intents = [];
  const lower = text.toLowerCase();

  if (lower.includes("help") || lower.includes("support"))
    intents.push("support_request");
  if (
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("broken")
  )
    intents.push("bug_report");
  if (
    lower.includes("feature") ||
    lower.includes("suggest") ||
    lower.includes("wish")
  )
    intents.push("feature_request");
  if (lower.includes("cancel") || lower.includes("refund"))
    intents.push("churn_risk");
  if (
    lower.includes("love") ||
    lower.includes("great") ||
    lower.includes("amazing")
  )
    intents.push("positive_feedback");
  if (
    lower.includes("hate") ||
    lower.includes("terrible") ||
    lower.includes("worst")
  )
    intents.push("negative_feedback");
  if (
    lower.includes("price") ||
    lower.includes("cost") ||
    lower.includes("expensive")
  )
    intents.push("pricing_concern");

  return intents.length ? intents : ["general_feedback"];
}

/**
 * Submit feedback for sentiment analysis
 * POST /api/feedback/submit
 *
 * Returns IMMEDIATE analysis results with full metrics
 */
export const submitFeedback = async (req, res) => {
  try {
    const { text, metadata = {} } = req.body;
    const userId = req.userId;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Feedback text is required",
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Feedback text exceeds maximum length of 5000 characters",
      });
    }

    const jobId = crypto.randomUUID();
    const submittedAt = new Date();
    const trimmedText = text.trim();

    // Try AI analysis first
    let aiResult = await analyzeWithAI(trimmedText);

    // Fallback to simple analysis if AI fails
    if (!aiResult) {
      const sentiment = analyzeSimpleSentiment(trimmedText);
      aiResult = {
        sentiment,
        confidence: 0.7,
        allScores: [{ label: sentiment, score: 0.7, percentage: "70.0%" }],
        intents: extractIntents(trimmedText),
        aiProcessed: false,
      };
    }

    // Store complete feedback document
    const db = await getMongoDb();
    const feedbackDoc = {
      jobId,
      userId,
      text: trimmedText,
      sentiment: aiResult.sentiment,
      confidence: aiResult.confidence,
      allScores: aiResult.allScores,
      intents: aiResult.intents,
      raw: aiResult.raw || null,
      aiProcessed: aiResult.aiProcessed,
      submittedAt,
      processedAt: new Date(),
      metadata: {
        ...metadata,
        source: aiResult.aiProcessed ? "ai-analysis" : "fallback-analysis",
        wordCount: trimmedText.split(/\s+/).length,
        charCount: trimmedText.length,
      },
    };

    await db.collection("feedback_results").insertOne(feedbackDoc);

    // Return FULL analysis results immediately
    return res.status(200).json({
      success: true,
      message: "Feedback analyzed successfully",
      jobId,
      analysis: {
        sentiment: aiResult.sentiment,
        confidence: aiResult.confidence,
        confidencePercent: `${(aiResult.confidence * 100).toFixed(1)}%`,
        allScores: aiResult.allScores,
        intents: aiResult.intents,
        aiProcessed: aiResult.aiProcessed,
      },
      metrics: {
        wordCount: trimmedText.split(/\s+/).length,
        charCount: trimmedText.length,
        processedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Submit feedback error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

/**
 * Simple keyword-based sentiment analysis (fallback when AI unavailable)
 */
function analyzeSimpleSentiment(text) {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    "good",
    "great",
    "excellent",
    "amazing",
    "wonderful",
    "fantastic",
    "love",
    "best",
    "happy",
    "satisfied",
    "awesome",
    "perfect",
    "helpful",
    "friendly",
    "thank",
  ];
  const negativeWords = [
    "bad",
    "terrible",
    "awful",
    "horrible",
    "hate",
    "worst",
    "disappointed",
    "angry",
    "frustrated",
    "poor",
    "slow",
    "broken",
    "useless",
    "annoying",
    "problem",
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) negativeCount++;
  });

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

/**
 * Get feedback analysis result by job ID
 * GET /api/feedback/result/:jobId
 */
export const getFeedbackResult = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required",
      });
    }

    // Check Redis availability for queue status
    const isRedisAvailable = await checkRedisConnection();

    if (isRedisAvailable) {
      // Check job status in queue first
      const job = await getQueue().getJob(jobId);

      if (job) {
        const state = await job.getState();

        if (state === "completed") {
          // Job completed, get result from MongoDB
          const db = await getMongoDb();
          const result = await db.collection("results").findOne({ jobId });

          if (result) {
            return res.json({
              success: true,
              status: "completed",
              result: {
                sentiment: result.sentiment,
                confidence: result.confidence,
                processedAt: result.processedAt,
              },
            });
          }
        } else if (state === "failed") {
          return res.json({
            success: true,
            status: "failed",
            message: "Analysis failed",
            failedReason: job.failedReason,
          });
        } else {
          // Still processing (waiting, active, delayed)
          return res.json({
            success: true,
            status: state,
            message: `Job is ${state}`,
          });
        }
      }
    }

    // Job not in queue or Redis unavailable, check MongoDB directly
    const db = await getMongoDb();
    const result = await db.collection("results").findOne({ jobId });

    if (result) {
      return res.json({
        success: true,
        status: "completed",
        result: {
          sentiment: result.sentiment,
          confidence: result.confidence,
          processedAt: result.processedAt,
        },
      });
    }

    res.status(404).json({
      success: false,
      message: "Job not found",
    });
  } catch (error) {
    console.error("Get feedback result error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback result",
    });
  }
};

/**
 * Get all feedback history for authenticated user
 * GET /api/feedback/history
 *
 * Returns complete feedback data with all metrics
 */
export const getFeedbackHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = Math.min(parseInt(limit), 50);

    const db = await getMongoDb();

    // Get feedback from feedback_results collection
    const results = await db
      .collection("feedback_results")
      .find({ userId })
      .sort({ processedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const total = await db
      .collection("feedback_results")
      .countDocuments({ userId });

    res.json({
      success: true,
      data: results.map((r) => ({
        jobId: r.jobId,
        text: r.text,
        sentiment: r.sentiment,
        confidence: r.confidence,
        confidencePercent: `${(r.confidence * 100).toFixed(1)}%`,
        allScores: r.allScores || [],
        intents: r.intents || [],
        aiProcessed: r.aiProcessed || false,
        submittedAt: r.submittedAt,
        processedAt: r.processedAt,
        metadata: {
          source: r.metadata?.source || "unknown",
          wordCount: r.metadata?.wordCount || 0,
          charCount: r.metadata?.charCount || 0,
        },
      })),
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get feedback history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback history",
    });
  }
};

/**
 * Get sentiment statistics for authenticated user
 * GET /api/feedback/stats
 */
export const getFeedbackStats = async (req, res) => {
  try {
    const userId = req.userId;

    const db = await getMongoDb();

    const stats = await db
      .collection("results")
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: "$sentiment",
            count: { $sum: 1 },
            avgConfidence: { $avg: "$confidence" },
          },
        },
      ])
      .toArray();

    const total = await db.collection("results").countDocuments({ userId });

    const sentimentBreakdown = {};
    stats.forEach((s) => {
      sentimentBreakdown[s._id] = {
        count: s.count,
        percentage: total > 0 ? ((s.count / total) * 100).toFixed(1) : 0,
        avgConfidence: s.avgConfidence?.toFixed(3) || 0,
      };
    });

    res.json({
      success: true,
      stats: {
        total,
        breakdown: sentimentBreakdown,
      },
    });
  } catch (error) {
    console.error("Get feedback stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get feedback statistics",
    });
  }
};

/**
 * Clear all feedback history for authenticated user
 * DELETE /api/feedback/clear
 */
export const clearFeedbackHistory = async (req, res) => {
  try {
    const userId = req.userId;

    const db = await getMongoDb();
    const result = await db
      .collection("feedback_results")
      .deleteMany({ userId });

    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} feedback entries`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear feedback history error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear feedback history",
    });
  }
};

/**
 * Get queue health status (admin only or authenticated users)
 * GET /api/feedback/health
 */
export const getQueueHealth = async (req, res) => {
  try {
    // Check Redis availability
    const isRedisAvailable = await checkRedisConnection();

    if (!isRedisAvailable) {
      return res.json({
        success: true,
        queue: {
          name: "feedback-processing",
          status: "disconnected",
          message:
            "Redis not available. Configure REDIS_HOST/REDIS_PORT in .env or use Upstash.",
          counts: null,
        },
      });
    }

    const queue = getQueue();
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    res.json({
      success: true,
      queue: {
        name: "feedback-processing",
        status: "connected",
        counts: {
          waiting,
          active,
          completed,
          failed,
          delayed,
        },
      },
    });
  } catch (error) {
    console.error("Get queue health error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get queue health",
      queue: { status: "disconnected" },
    });
  }
};
