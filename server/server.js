import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";
import feedbackRouter from "./routes/feedbackRoutes.js";
import adminRouter from "./routes/adminRoutes.js";
import { metricsMiddleware, getMetrics } from "./config/metrics.js";

// Correct path resolution for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
const app = express();
const port = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, "frontend/build")));

// --- FLEXIBLE CORS CONFIGURATION ---
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowed = allowedOrigins.some((pattern) => {
        if (typeof pattern === "string") {
          return pattern === origin;
        }
        return pattern.test(origin);
      });

      if (!origin || isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());

// Prometheus metrics middleware
app.use(metricsMiddleware);

// Prometheus metrics endpoint (for Grafana)
app.get("/metrics", getMetrics);

connectDB();

// API endpoints
app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/admin", adminRouter);

// Serve frontend
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
});

app.listen(port, () => {
  console.log(`Server run successfully!! Port Number ${port}`);
  console.log(
    `Prometheus metrics available at http://localhost:${port}/metrics`
  );
});
