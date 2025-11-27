import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();

/** ---------- 上传配置 ---------- */

// 把图片存在项目根目录的 uploads/ 里
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

/**
 * POST /api/forum/posts
 * 创建一条帖子（可带图片）
 * form-data:
 *  - title
 *  - content
 *  - userId
 *  - source (optional, 默认 manual/checkin 都可)
 *  - image (file, optional)
 */
router.post("/posts", upload.single("image"), async (req, res) => {
  try {
    const { title, content, userId, source } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "title and content are required" });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const post = await ForumPost.create({
      title,
      content,
      author: userId || null,
      source: source || "manual",
      hasMedia: !!imageUrl,
      imageUrl,
    });

    const populated = await ForumPost.findById(post._id)
      .populate("author", "name")
      .populate("comments.user", "name");

    const obj = populated.toObject();

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
    console.error("Error creating post:", err);
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
      post.upvotedBy = post.upvotedBy.filter((u) => u.toString() !== uid);
    } else {
      post.upvotedBy.push(uid);
      post.downvotedBy = post.downvotedBy.filter((u) => u.toString() !== uid);
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

    const hasDownvoted = post.downvotedBy.some((u) => u.toString() === uid);

    if (hasDownvoted) {
      post.downvotedBy = post.downvotedBy.filter((u) => u.toString() !== uid);
    } else {
      post.downvotedBy.push(uid);
      post.upvotedBy = post.upvotedBy.filter((u) => u.toString() !== uid);
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

    const hasBookmarked = post.bookmarkedBy.some((u) => u.toString() === uid);

    if (hasBookmarked) {
      post.bookmarkedBy = post.bookmarkedBy.filter(
        (u) => u.toString() !== uid
      );
    } else {
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
