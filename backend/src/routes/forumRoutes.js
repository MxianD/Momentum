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
    const post = await ForumPost.findByIdAndUpdate(
      id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    res.json(post);
  } catch (err) {
    console.error("Error upvoting", err);
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
// 只贴 /posts 这一段，其他点赞/收藏逻辑保留你现在的版本即可

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
