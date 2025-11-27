import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import forumRoutes from "./routes/forumRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// 处理 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 中间件
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://momentumfrontend.netlify.app",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// ⭐ 暴露上传目录：访问 /uploads/xxx.png
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 路由
app.use("/api/forum", forumRoutes);
app.use("/api/users", userRoutes);
app.use("/api/challenges", challengeRoutes);

app.get("/", (req, res) => {
  res.send("Momentum backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
