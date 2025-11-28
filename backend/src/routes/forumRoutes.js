// backend/src/routes/forumRoutes.js
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();

/**
 * ========= Multer 配置：用于上传图片 =========
 */
const uploadDir = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/**
 * 一个小工具：把 categories 字段解析成 string[]
 * - 前端可能传 JSON 数组或逗号分隔字符串
 */
function parseCategories(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((t) => `${t}`.trim())
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    // 可能是 JSON，也可能是逗号分隔
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((t) => `${t}`.trim())
          .filter(Boolean);
      }
    } catch {
      // 不是 JSON，当成逗号分隔
    }
    return raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * ========= 创建帖子：POST /api/forum/posts =========
 * - 支持两种来源：
 *   1) source: "manual"  → Forum 知识贴（强制要求有 category）
 *   2) source: "checkin" → HomePage & 挑战打卡（不要求 category）
 *
 * - body (JSON 或 multipart/form-data):
 *   title       (string, optional)
 *   content     (string, required)
 *   userId      (string, required)
 *   source      ("manual" | "checkin"，默认 "manual")
 *   hasMedia    (可选，布尔)
 *   categories  (JSON 数组或逗号分隔字符串，source="manual" 必填)
 *
 * - 文件字段：
 *   media       (单文件上传，图片)
 */
router.post("/posts", upload.single("media"), async (req, res) => {
  try {
    const { title, content, userId } = req.body;
    let { source = "manual", hasMedia } = req.body;

    if (!content || !userId) {
      return res
        .status(400)
        .json({ error: "content and userId are required" });
    }

    // 规范 source
    if (source !== "checkin") {
      source = "manual";
    }

    // 解析 categories
    const categories = parseCategories(req.body.categories);

    // ⭐ 对“知识贴”强制要求 category
    if (source === "manual" && categories.length === 0) {
      return res.status(400).json({ error: "Category is required" });
    }

    // 图片 / 媒体路径
    let imageUrl = null;
    if (req.file) {
      // 会被 index.js 暴露成 /uploads/xxx
      imageUrl = `/uploads/${req.file.filename}`;
      hasMedia = true;
    } else {
      hasMedia =
        typeof hasMedia === "string"
          ? hasMedia === "true"
          : !!hasMedia;
    }

    const finalTitle =
      (title && title.trim()) ||
      (source === "checkin" ? "Check-in" : "Untitled post");

    const newPost = await ForumPost.create({
      title: finalTitle,
      content: content.trim(),
      hasMedia: !!hasMedia,
      author: userId,
      source,
      imageUrl,
      categories, // 需要在 ForumPost Schema 中加上 categories 字段: [String]
    });

    await newPost.populate("author", "name");
    await newPost.populate("comments.user", "name");

    const obj = newPost.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      },
    });
  } catch (err) {
    console.error("Error creating forum post:", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

/**
 * GET /api/forum/posts
 * 拿到所有帖子 + 作者名字 + 点赞/点踩/收藏计数 + 评论（带评论人名字）
 */
router.get("/posts", async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .populate("author", "name")
      .populate("comments.user", "name");

    const mapped = posts.map((p) => {
      const obj = p.toObject(); // 已包含 virtuals

      return {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        // 给每条评论加 userName，前端好用
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching forum posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

/**
 * POST /api/forum/posts/:id/upvote
 * 按用户切换点赞（再次点击则取消赞），并清除对同一帖子的点踩
 */
router.post("/posts/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await ForumPost.findById(id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const uid = userId.toString();
    const hasUpvoted = post.upvotedBy.some((u) => u.toString() === uid);

    if (hasUpvoted) {
      // 再点一次 -> 取消点赞
      post.upvotedBy = post.upvotedBy.filter((u) => u.toString() !== uid);
    } else {
      // 点赞
      post.upvotedBy.push(uid);
      // 顺便取消点踩
      post.downvotedBy = post.downvotedBy.filter(
        (u) => u.toString() !== uid
      );
    }

    await post.save();
    await post.populate("author", "name");
    await post.populate("comments.user", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      },
    });
  } catch (err) {
    console.error("Error upvoting post:", err);
    res.status(500).json({ error: "Failed to upvote" });
  }
});

/**
 * POST /api/forum/posts/:id/downvote
 * 按用户切换点踩（再次点击取消），并清除该用户的点赞
 */
router.post("/posts/:id/downvote", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const uid = userId.toString();

    const hasDownvoted = post.downvotedBy.some(
      (u) => u.toString() === uid
    );

    if (hasDownvoted) {
      // 已点踩 -> 取消
      post.downvotedBy = post.downvotedBy.filter(
        (u) => u.toString() !== uid
      );
    } else {
      // 未点踩 -> 添加
      post.downvotedBy.push(uid);
      // 取消点赞
      post.upvotedBy = post.upvotedBy.filter(
        (u) => u.toString() !== uid
      );
    }

    await post.save();
    await post.populate("author", "name");
    await post.populate("comments.user", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      },
    });
  } catch (err) {
    console.error("Error downvoting post:", err);
    res.status(500).json({ error: "Failed to downvote" });
  }
});

/**
 * POST /api/forum/posts/:id/bookmark
 * 按用户切换收藏
 */
router.post("/posts/:id/bookmark", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const uid = userId.toString();

    const hasBookmarked = post.bookmarkedBy.some(
      (u) => u.toString() === uid
    );

    if (hasBookmarked) {
      // 已收藏 -> 取消
      post.bookmarkedBy = post.bookmarkedBy.filter(
        (u) => u.toString() !== uid
      );
    } else {
      // 未收藏 -> 收藏
      post.bookmarkedBy.push(uid);
    }

    await post.save();
    await post.populate("author", "name");
    await post.populate("comments.user", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      },
    });
  } catch (err) {
    console.error("Error bookmarking post:", err);
    res.status(500).json({ error: "Failed to bookmark" });
  }
});

/**
 * POST /api/forum/posts/:id/comments
 * 添加一条评论并返回更新后的帖子
 * body: { userId, text }
 */
router.post("/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text } = req.body;

    if (!userId || !text?.trim()) {
      return res
        .status(400)
        .json({ error: "userId and non-empty text required" });
    }
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid post id" });
    }

    const post = await ForumPost.findById(id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const newComment = {
      id: `${Date.now()}`,
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    await post.populate("author", "name");
    await post.populate("comments.user", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
        comments: (obj.comments || []).map((c) => ({
          ...c,
          userName: c.user?.name || "Anonymous",
        })),
      },
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
