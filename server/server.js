import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import checkinRoutes from "./routes/checkinRoutes.js";
import judgeRoutes from "./routes/judgeRoutes.js";
import participantRoutes from "./routes/participantRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import { getUploadsDir } from "./utils/uploadPaths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", env.TRUST_PROXY);

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(compression());
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("dev"));

const allowedOrigins = new Set(
  [
    env.CLIENT_ORIGIN,
    ...(env.CLIENT_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      if (env.NODE_ENV !== "production" && /^http:\/\/localhost:\d+$/.test(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-7"
  })
);

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-7"
  })
);

app.use(
  "/api/payments",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-7",
    skip: (req) => req.path === "/webhook"
  })
);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// ============================================================================
// STATIC FILE SERVING FOR UPLOADS (payment proofs, etc.)
// ============================================================================

// Determine upload directory path (support both Render disk and local)
const uploadsDir = getUploadsDir();
console.log(`[Server] Using uploads directory: ${uploadsDir}`);

// Verify uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  console.warn(`[Server] ⚠️ Uploads directory does not exist: ${uploadsDir}`);
  console.warn(`[Server] ⚠️ Creating directory...`);
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`[Server] ✓ Created uploads directory`);
  } catch (err) {
    console.error(`[Server] ✗ Failed to create uploads directory:`, err.message);
  }
} else {
  console.log(`[Server] ✓ Uploads directory exists`);
}

// Middleware to add CORS headers for static files
app.use((req, res, next) => {
  if (req.path.startsWith("/uploads")) {
    // Allow images to be loaded from any origin
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  }
  next();
});

// Serve uploaded files with CORS headers
app.use("/uploads", express.static(uploadsDir, {
  maxAge: "1d",  // Cache files for 1 day
  setHeaders: (res, filePath) => {
    // Set CORS headers for all static files
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Cache-Control", "public, max-age=86400");  // 1 day cache
  }
}));

app.use("/api/auth", authRoutes);
app.use("/api", paymentRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/participant", participantRoutes);
app.use("/api/judge", judgeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/checkin", checkinRoutes);

app.use(notFound);
app.use(errorHandler);

connectDB(env.MONGODB_URI)
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect DB", error);
    process.exit(1);
  });
