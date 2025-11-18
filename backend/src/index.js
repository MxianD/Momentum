// src/index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";

import forumRoutes from "./routes/forumRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(
  cors({
    origin: "*", // 开发阶段先全部放行，之后可以改成你的前端域名
  })
);
app.use(express.json());

// 健康检查
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Forum 路由
app.use("/api/forum", forumRoutes);
// User 路由
app.use("/api/users", userRoutes);
app.use("/api/challenges", challengeRoutes);
// 很简单的根路径，防止看到 Cannot GET /
app.get("/", (req, res) => {
  res.send("Momentum backend is running 🚀");
});

// 健康检查接口
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
// 连接数据库并启动服务器
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
