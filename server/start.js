/**
 * Unified Startup Script
 * Starts both the main server and feedback worker together
 * Handles: Express Server, MongoDB, Redis, AI Client
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

console.log("\n🚀 CRM Sentiment Analysis - Starting All Services\n");
console.log("=".repeat(50));

// Track processes for cleanup
const processes = [];

// Color codes for terminal output
const colors = {
  server: "\x1b[36m", // Cyan
  worker: "\x1b[33m", // Yellow
  reset: "\x1b[0m",
  error: "\x1b[31m", // Red
  success: "\x1b[32m", // Green
};

function startProcess(name, command, args, cwd, color) {
  console.log(`${color}[${name}]${colors.reset} Starting...`);

  const proc = spawn(command, args, {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  processes.push({ name, proc });

  proc.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim() && !line.includes("ExperimentalWarning")) {
        console.log(`${colors.error}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  proc.on("error", (err) => {
    console.log(
      `${colors.error}[${name}] Failed to start: ${err.message}${colors.reset}`
    );
  });

  proc.on("exit", (code) => {
    if (code !== null && code !== 0) {
      console.log(
        `${colors.error}[${name}] Exited with code ${code}${colors.reset}`
      );
    }
  });

  return proc;
}

// Graceful shutdown
function shutdown() {
  console.log("\n\n🛑 Shutting down all services...\n");
  processes.forEach(({ name, proc }) => {
    console.log(`   Stopping ${name}...`);
    proc.kill("SIGTERM");
  });
  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Start Main Server
const serverProc = startProcess(
  "SERVER",
  "node",
  ["server.js"],
  path.join(rootDir, "server"),
  colors.server
);

// Wait a bit then start Worker (so server connects first)
setTimeout(() => {
  const workerProc = startProcess(
    "WORKER",
    "node",
    ["worker.js"],
    path.join(rootDir, "feedback-pipeline"),
    colors.worker
  );
}, 2000);

console.log("\n" + "=".repeat(50));
console.log(`${colors.success}✅ Services starting...${colors.reset}`);
console.log(`   📡 Server: http://localhost:4000`);
console.log(`   📊 Metrics: http://localhost:4000/metrics`);
console.log(`   🔧 Worker Metrics: http://localhost:3006/metrics`);
console.log("\n   Press Ctrl+C to stop all services\n");
console.log("=".repeat(50) + "\n");
