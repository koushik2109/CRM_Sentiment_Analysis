import userModel from "../models/userModel.js";
import { MongoClient } from "mongodb";

// MongoDB connection for feedback stats
let mongoClient = null;
let feedbackDb = null;

async function getMongoDb() {
  if (!feedbackDb) {
    mongoClient = new MongoClient(process.env.MONGO_URI);
    await mongoClient.connect();
    feedbackDb = mongoClient.db(process.env.MONGO_DB || "feedback_pipeline");
  }
  return feedbackDb;
}

/**
 * Get admin dashboard overview stats
 * GET /api/admin/stats
 */
export const getAdminStats = async (req, res) => {
  try {
    // Get user statistics
    const [
      totalUsers,
      verifiedUsers,
      unverifiedUsers,
      onlineUsers,
      usersByRole,
    ] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ isAccountVerified: true }),
      userModel.countDocuments({ isAccountVerified: false }),
      userModel.countDocuments({ isOnline: true }),
      userModel.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);

    // Get recent users
    const recentUsers = await userModel
      .find({})
      .select("-password -verifyOtp -resetOtp")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get feedback statistics
    let feedbackStats = {
      total: 0,
      bySentiment: {},
      avgConfidence: 0,
      topIntents: [],
    };
    try {
      const db = await getMongoDb();

      // Get total feedback from feedback_results collection
      const totalFeedback = await db
        .collection("feedback_results")
        .countDocuments({});

      // Get sentiment breakdown
      const sentimentBreakdown = await db
        .collection("feedback_results")
        .aggregate([{ $group: { _id: "$sentiment", count: { $sum: 1 } } }])
        .toArray();

      // Get average confidence
      const avgConfidenceResult = await db
        .collection("feedback_results")
        .aggregate([
          { $group: { _id: null, avgConfidence: { $avg: "$confidence" } } },
        ])
        .toArray();

      // Get top intents
      const topIntents = await db
        .collection("feedback_results")
        .aggregate([
          { $unwind: "$intents" },
          { $group: { _id: "$intents", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ])
        .toArray();

      feedbackStats = {
        total: totalFeedback,
        bySentiment: sentimentBreakdown.reduce((acc, item) => {
          if (item._id) acc[item._id] = item.count;
          return acc;
        }, {}),
        avgConfidence: avgConfidenceResult[0]?.avgConfidence || 0,
        topIntents,
      };
    } catch (err) {
      console.log("Feedback DB not available:", err.message);
    }

    // User registration trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const registrationTrend = await userModel.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          unverified: unverifiedUsers,
          online: onlineUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item._id || "member"] = item.count;
            return acc;
          }, {}),
        },
        feedback: feedbackStats,
        registrationTrend,
        recentUsers: recentUsers.map((u) => ({
          _id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isAccountVerified: u.isAccountVerified,
          isOnline: u.isOnline || false,
          lastActive: u.lastActive,
          createdAt: u.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all users with detailed info (admin only)
 * GET /api/admin/users
 */
export const getAllUsersAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", role = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (role) {
      query.role = role;
    }

    const [users, total] = await Promise.all([
      userModel
        .find(query)
        .select(
          "-password -verifyOtp -resetOtp -verifyOtpExpireAt -resetOtpExpireAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all feedback across all users (admin only)
 * GET /api/admin/feedback
 *
 * Returns complete feedback data with user info, intents, and metrics
 */
export const getAllFeedbackAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, sentiment = "", userId = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const db = await getMongoDb();

    const query = {};
    if (sentiment) {
      query.sentiment = sentiment;
    }
    if (userId) {
      query.userId = userId;
    }

    const [results, total] = await Promise.all([
      db
        .collection("feedback_results")
        .find(query)
        .sort({ processedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection("feedback_results").countDocuments(query),
    ]);

    // Get user details for each feedback
    const userIds = [...new Set(results.map((r) => r.userId))];
    const users = await userModel
      .find({ _id: { $in: userIds } })
      .select("name email role isOnline lastActive")
      .lean();
    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    // Calculate intent statistics
    const intentStats = {};
    results.forEach((r) => {
      (r.intents || []).forEach((intent) => {
        intentStats[intent] = (intentStats[intent] || 0) + 1;
      });
    });

    res.json({
      success: true,
      feedback: results.map((r) => ({
        jobId: r.jobId,
        text: r.text,
        sentiment: r.sentiment,
        confidence: r.confidence,
        confidencePercent: `${((r.confidence || 0) * 100).toFixed(1)}%`,
        allScores: r.allScores || [],
        intents: r.intents || [],
        aiProcessed: r.aiProcessed || false,
        submittedAt: r.submittedAt,
        processedAt: r.processedAt,
        metadata: r.metadata || {},
        user: userMap[r.userId] || { name: "Unknown", email: "N/A" },
      })),
      intentStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a user (admin only)
 * DELETE /api/admin/users/:userId
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.userId;

    if (userId === adminId) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete yourself" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user.role === "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete another admin" });
    }

    await userModel.findByIdAndDelete(userId);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get system health status
 * GET /api/admin/health
 */
export const getSystemHealth = async (req, res) => {
  try {
    const health = {
      server: "healthy",
      database: "unknown",
      redis: "unknown",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    };

    // Check MongoDB
    try {
      await userModel.findOne({}).lean();
      health.database = "healthy";
    } catch (err) {
      health.database = "unhealthy";
    }

    // Check Redis (if available)
    try {
      const { Queue } = await import("bullmq");
      const IORedis = (await import("ioredis")).default;
      const testConn = new IORedis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT) || 6379,
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null,
      });
      await testConn.ping();
      await testConn.quit();
      health.redis = "healthy";
    } catch (err) {
      health.redis = "unavailable";
    }

    res.json({ success: true, health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
