// backend/src/index.js
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import forumRoutes from "./routes/forumRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";

// ⭐ 新增：引入 ForumPost，用于计算积分
import ForumPost from "./models/ForumPost.js";

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

// ⭐⭐ 这里直接在 index.js 再暴露一个总排名接口：GET /api/forum/ranking/total
/**
 * 总积分排名：GET /api/forum/ranking/total
 *
 * 规则（简化版实现）：
 * - 每条打卡（source === "checkin"）基础分：
 *    Stay hydrated       +5
 *    Everyday Meditation +6
 *    Morning Stretch     +3
 * - 每条“知识贴”（source === "manual"）  +5
 * - 每个 upvote          +1
 * - “好贴”：upvotes ≥ 5 或 bookmarks ≥ 3 再 +10
 *
 * 返回：[{ userId, name, points, rank }, ...]
 */
app.get("/api/forum/ranking/total", async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate("author", "name")
      .exec();

    const scoreMap = new Map(); // authorId -> { userId, name, points }

    const addScore = (authorId, authorName, pts) => {
      if (!authorId || !pts) return;
      const key = authorId.toString();
      const existing = scoreMap.get(key) || {
        userId: key,
        name: authorName || "Anonymous",
        points: 0,
      };
      existing.points += pts;
      scoreMap.set(key, existing);
    };

    posts.forEach((p) => {
      const obj = p.toObject();
      const authorId = obj.author?._id || obj.author;
      const authorName = obj.author?.name || "Anonymous";
      if (!authorId) return;

      let base = 0;

      // 基础分：checkin
      if (obj.source === "checkin") {
        const title = (obj.title || "").trim();
        if (title === "Stay hydrated") base += 5;
        else if (title === "Everyday Meditation") base += 6;
        else if (title === "Morning Stretch") base += 3;
      }

      // 基础分：知识贴
      if (obj.source === "manual") {
        base += 5;
      }

      // upvote 分
      const likeCount = (obj.upvotedBy || []).length;
      base += likeCount;

      // 好贴奖励
      const bookmarkCount = (obj.bookmarkedBy || []).length;
      const isGoodPost = likeCount >= 5 || bookmarkCount >= 3;
      if (isGoodPost) {
        base += 10;
      }

      addScore(authorId, authorName, base);
    });

    // 转成数组并排序
    const rankingArray = Array.from(scoreMap.values()).sort(
      (a, b) => b.points - a.points
    );

    // 加 rank 字段
    rankingArray.forEach((item, idx) => {
      item.rank = idx + 1;
    });

    res.json(rankingArray);
  } catch (err) {
    console.error("Error computing total ranking:", err);
    res.status(500).json({ error: "Failed to compute ranking" });
  }
});

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
