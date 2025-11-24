import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url"; // <-- FIX: Import from 'url'
// import path from "path";      // <-- FIX: Import from 'path'
import authRoutes from "./routes/authRoutes.js";
import userRouter from "./routes/userRoutes.js";

// Correct path resolution for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });
const app = express();
// Note: If you have configured startServer using async/await, ensure that logic is retained.
const port = process.env.PORT || 4000;
// const path = require('path');
app.use(express.static(path.join(__dirname, 'frontend/build')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});


// --- FLEXIBLE CORS CONFIGURATION ---
// This allows connections from any port on localhost or 127.0.0.1, 
// including our necessary testing port of 8080.
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
  // Regex allows dynamic ports (like 8080, 5173, etc.) on localhost and 127.0.0.1
  /^http:\/\/(localhost|127\.0\.0\.1):\d+$/, 
];
// -----------------------------------

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      const isAllowed = allowedOrigins.some(pattern => {
          if (typeof pattern === 'string') {
              return pattern === origin;
          }
          // The regex check
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

connectDB();
//API endpoints
// app.get("/", (req, res) => {
//   res.json({ message: "MERN Auth API Server" });
// });
app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);
app.listen(port, () => {
  console.log(`Server run successfully!! Port Number ${port}`);
});