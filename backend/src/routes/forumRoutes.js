// src/routes/forumRoutes.js
import express from "express";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();

// GET /api/forum/posts  获取所有帖子
router.get("/posts", async (req, res) => {
  try {
    const posts = await ForumPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching posts", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// POST /api/forum/posts  新建一个帖子
router.post("/posts", async (req, res) => {
  try {
    const { title, content, hasMedia } = req.body;
    const post = await ForumPost.create({ title, content, hasMedia });
    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

// POST /api/forum/posts/:id/upvote  点赞 +1
router.post("/posts/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;

    // 示例 1：如果你用的是数字 likesCount
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { $inc: { likesCount: 1 } },   // 点赞数 +1（你也可以根据用户状态来 +1 / -1）
      { new: true }                  // ✅ 返回更新后的文档
    ).populate("author", "name");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json(post);                  // ✅ 把更新后的 post 返回给前端
  } catch (err) {
    console.error("Upvote error:", err);
    res.status(500).json({ error: "Failed to upvote" });
  }
});

// POST /api/forum/posts/:id/downvote  点踩 +1
router.post("/posts/:id/downvote", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { $inc: { downvotes: 1 } },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.error("Error downvoting", err);
    res.status(500).json({ error: "Failed to downvote" });
  }
});

// POST /api/forum/posts/:id/bookmark  收藏 +1
router.post("/posts/:id/bookmark", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { $inc: { bookmarks: 1 } },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.error("Error bookmarking", err);
    res.status(500).json({ error: "Failed to bookmark" });
  }
});
// src/routes/forumRoutes.js 里面 GET /api/forum/posts 的地方
router.get("/posts", async (req, res) => {
  try {
    const posts = await ForumPost.find({})
      .sort({ createdAt: -1 })
      .populate("author", "name"); // ✅ 把作者的 name 一起查出来

    res.json(posts);
  } catch (err) {
    console.error("Error fetching forum posts:", err);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

// POST /api/forum/posts  新建一个帖子
router.post("/posts", async (req, res) => {
  try {
    const { title, content, hasMedia, userId, challengeId, source } =
      req.body;

    const post = await ForumPost.create({
      title,
      content,
      hasMedia: !!hasMedia,
      source: source || "manual",
      author: userId || null,
      challenge: challengeId || null,
    });

    res.status(201).json(post);
  } catch (err) {
    console.error("Error creating post", err);
    res.status(500).json({ error: "Failed to create post" });
  }
});

export default router;
