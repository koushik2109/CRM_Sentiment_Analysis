/**
 * ai-client.js - AI Inference API Client
 *
 * Key decisions:
 * - Uses axios with timeout for HTTP calls
 * - Normalizes AI response to consistent format: {sentiment, score, intents, raw}
 * - Handles various AI API response formats (Hugging Face style)
 * - Timeout prevents hanging on slow/unresponsive endpoints
 */

import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Default Hugging Face sentiment model - only API key needed
const HUGGINGFACE_MODEL = "cardiffnlp/twitter-roberta-base-sentiment-latest";
const AI_API_URL = `https://router.huggingface.co/hf-inference/models/${HUGGINGFACE_MODEL}`;
const AI_API_KEY = process.env.AI_API_KEY;
const TIMEOUT_MS = parseInt(process.env.JOB_TIMEOUT_MS) || 30000;

// Create axios instance with defaults
const aiClient = axios.create({
  baseURL: AI_API_URL,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    ...(AI_API_KEY && { Authorization: `Bearer ${AI_API_KEY}` }),
  },
});

/**
 * Normalize AI response to standard format
 * Hugging Face sentiment models return: [[{label, score}, ...]]
 * We normalize to: {sentiment, score, intents, raw}
 */
function normalizeResponse(raw, text) {
  // Handle Hugging Face format: [[{label: "POSITIVE", score: 0.95}, ...]]
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    const results = raw[0];
    // Find highest scoring sentiment
    const top = results.reduce(
      (a, b) => (a.score > b.score ? a : b),
      results[0]
    );

    // Map labels to standard sentiment values
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
      score: Math.round(top.score * 100) / 100, // Round to 2 decimals
      intents: extractIntents(text), // Simple intent extraction
      raw, // Keep raw response for debugging
    };
  }

  // Fallback for unknown formats
  return {
    sentiment: "unknown",
    score: 0,
    intents: [],
    raw,
  };
}

/**
 * Simple intent extraction based on keywords
 * Production would use NER/intent classification model
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

  return intents.length ? intents : ["general_feedback"];
}

/**
 * Analyze text sentiment via AI API
 * @param {string} text - Text to analyze
 * @returns {Promise<{sentiment, score, intents, raw}>}
 */
export async function analyzeSentiment(text) {
  try {
    const response = await aiClient.post("", {
      inputs: text,
      options: { wait_for_model: true }, // Wait if model is loading
    });

    return normalizeResponse(response.data, text);
  } catch (error) {
    // Rethrow with more context for retry logic
    const message = error.response?.data?.error || error.message;
    const err = new Error(`AI API error: ${message}`);
    err.statusCode = error.response?.status;
    err.retryable =
      error.response?.status >= 500 || error.code === "ECONNABORTED";
    throw err;
  }
}

export default { analyzeSentiment };
