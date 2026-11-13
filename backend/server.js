
import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { initSocket } from "./src/socket.js";
import { router as authRoutes } from "./src/routes/authRoutes.js";
import { connectDb } from "./src/config/db.js";
import { router as collectionRoutes } from "./src/routes/collectionRoute.js";
import { router as notificationRoutes} from "./src/routes/notificationRoutes.js";
import { router as postRoutes} from "./src/routes/postRoutes.js";
import { router as savedPostRoutes} from "./src/routes/savedPostRoutes.js";
import { router as userRoutes} from "./src/routes/userRoutes.js";
import { router as storiesRoutes } from "./src/routes/storyRoutes.js";
import { Story } from "./src/model/Story.js";
import { router as moderationRoutes } from "./src/routes/moderationRoutes.js";
import { router as analyticsRoutes } from "./src/routes/analyticsRoutes.js";


dotenv.config();

const app = express();

const allowedOrigins = new Set([
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
].filter(Boolean));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("This frontend origin is not allowed by CORS."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "Connectly API is running!" });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use('/api/users', userRoutes);
app.use("/api/saved-posts", savedPostRoutes);
app.use("/api/collections", collectionRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.name === "MulterError" || error.message === "Only JPEG, PNG, and WebP images are allowed.") {
    res.status(400).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Images must be 5 MB or smaller."
        : error.message,
    });
    return;
  }

  console.error("Unhandled API error:", error);
  res.status(500).json({
    success: false,
    message: req.file
      ? "Image upload failed. Check the image format and server image-storage configuration."
      : "The request could not be completed.",
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDb();
  const httpServer = http.createServer(app);
  initSocket(httpServer, allowedOrigins);

  const server = httpServer.listen(PORT, () => {
    console.log(`Connectly API running on http://localhost:${PORT}`);
  });

  // Recurring automatic deletion of stories older than 24 hours (every 10 mins)
  setInterval(async () => {
    try {
      const now = new Date();
      const result = await Story.deleteMany({ expiresAt: { $lte: now } });
      if (result.deletedCount > 0) {
        console.log(`[Stories] Auto-deleted ${result.deletedCount} expired story/stories older than 24 hours.`);
      }
    } catch (err) {
      console.warn("[Stories] Auto-delete expired error:", err.message);
    }
  }, 10 * 60 * 1000);

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${PORT} is already in use by another process.`);
    } else {
      console.error("Server error:", error.message);
    }
  });
};

startServer().catch((error) => {
  console.error("Could not start Connectly API:", error.message);
  process.exitCode = 1;
});