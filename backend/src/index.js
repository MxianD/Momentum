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
const allowedOrigins = [
  "http://localhost:5173",              // Vite 本地开发
  "http://localhost:3000",              // 如果你曾用过 3000
  "https://momentumfrontend.netlify.app" // 你的前端线上地址
];

app.use(
  cors({
    origin(origin, callback) {
      // Postman / curl / 同源请求时 origin 可能为 undefined，所以也放行
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

// 处理预检请求（OPTIONS）
app.options("*", cors());

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
