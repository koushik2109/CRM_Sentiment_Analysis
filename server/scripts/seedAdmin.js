/**
 * Admin Seed Script
 * Creates or updates the admin user with specified credentials
 *
 * Run with: node scripts/seedAdmin.js
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from parent directory (c:\CRM_Sentiment_Analysis\.env)
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Admin credentials
const ADMIN_EMAIL = "team.808.test@gmail.com";
const ADMIN_PASSWORD = "team@808";
const ADMIN_NAME = "Admin";

// User schema (inline to avoid import issues)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member",
    },
    verifyOtp: { type: String, default: "" },
    verifyOtpExpireAt: { type: Number, default: 0 },
    isAccountVerified: { type: Boolean, default: false },
    resetOtp: { type: String, default: "" },
    resetOtpExpireAt: { type: Number, default: 0 },
    notifications: {
      emailNotifications: { type: Boolean, default: true },
      feedbackAlerts: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: false },
      marketingEmails: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("user", userSchema);

async function seedAdmin() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      // Update existing user to admin role
      console.log("Admin user exists, updating role and password...");
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 8);

      await User.findByIdAndUpdate(existingAdmin._id, {
        role: "admin",
        password: hashedPassword,
        isAccountVerified: true,
        name: ADMIN_NAME,
      });

      console.log("✅ Admin user updated successfully!");
    } else {
      // Create new admin user
      console.log("Creating new admin user...");
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 8);

      const admin = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
        isAccountVerified: true,
      });

      await admin.save();
      console.log("✅ Admin user created successfully!");
    }

    console.log("\n📧 Admin Email:", ADMIN_EMAIL);
    console.log("🔑 Admin Password:", ADMIN_PASSWORD);
    console.log("\nYou can now login to the admin dashboard!");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
    process.exit(0);
  }
}

seedAdmin();
