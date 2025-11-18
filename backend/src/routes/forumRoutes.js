// src/routes/forumRoutes.js
import express from "express";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();

/**
 * GET /api/forum/posts
 * 拿到所有帖子 + 作者名字 + 点赞/点踩/收藏计数
 */
router.get("/posts", async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .sort({ createdAt: -1 })
      .populate("author", "name"); // 只拿 author.name

    const mapped = posts.map((p) => {
      const obj = p.toObject();
      return {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
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
 * 简单版：每点一次 +1
 */
router.post("/posts/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.upvotes = (post.upvotes || 0) + 1;
    await post.save();
    await post.populate("author", "name");

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        authorName: post.author?.name || "Anonymous",
        upvotes: post.upvotes ?? 0,
        downvotes: post.downvotes ?? 0,
        bookmarks: post.bookmarks ?? 0,
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
    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.downvotes = (post.downvotes || 0) + 1;
    await post.save();
    await post.populate("author", "name");

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        authorName: post.author?.name || "Anonymous",
        upvotes: post.upvotes ?? 0,
        downvotes: post.downvotes ?? 0,
        bookmarks: post.bookmarks ?? 0,
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
    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    post.bookmarks = (post.bookmarks || 0) + 1;
    await post.save();
    await post.populate("author", "name");

    res.json({
      success: true,
      post: {
        ...post.toObject(),
        authorName: post.author?.name || "Anonymous",
        upvotes: post.upvotes ?? 0,
        downvotes: post.downvotes ?? 0,
        bookmarks: post.bookmarks ?? 0,
      },
    });
  } catch (err) {
    console.error("Error bookmarking post:", err);
    res.status(500).json({ error: "Failed to bookmark" });
  }
});

export default router;
