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
      .populate("author", "name");

    const mapped = posts.map((p) => {
      const obj = p.toObject(); // 已包含 virtuals

      return {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0, // 来自 virtual
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
 * 按用户切换点赞（再次点击则取消赞），并清除对同一帖子的点踩
 *
 * body: { userId: "xxxx" }
 */
// POST /api/forum/posts/:id/upvote
router.post("/posts/:id/upvote", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    console.log("BODY in /upvote:", req.body);
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
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
      post.downvotedBy = post.downvotedBy.filter((u) => u.toString() !== uid);
    }

    await post.save();
    await post.populate("author", "name");
    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
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

    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const uid = userId.toString();

    const hasDownvoted = post.downvotedBy.some((u) => u.toString() === uid);

    if (hasDownvoted) {
      // 已点踩 -> 取消
      post.downvotedBy = post.downvotedBy.filter((u) => u.toString() !== uid);
    } else {
      // 未点踩 -> 添加
      post.downvotedBy.push(uid);
      // 取消点赞
      post.upvotedBy = post.upvotedBy.filter((u) => u.toString() !== uid);
    }

    await post.save();
    await post.populate("author", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
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

    const post = await ForumPost.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const uid = userId.toString();

    const hasBookmarked = post.bookmarkedBy.some((u) => u.toString() === uid);

    if (hasBookmarked) {
      // 已收藏 -> 取消
      post.bookmarkedBy = post.bookmarkedBy.filter((u) => u.toString() !== uid);
    } else {
      // 未收藏 -> 收藏
      post.bookmarkedBy.push(uid);
    }

    await post.save();
    await post.populate("author", "name");

    const obj = post.toObject();

    res.json({
      success: true,
      post: {
        ...obj,
        authorName: obj.author?.name || "Anonymous",
        upvotes: obj.upvotes ?? 0,
        downvotes: obj.downvotes ?? 0,
        bookmarks: obj.bookmarks ?? 0,
      },
    });
  } catch (err) {
    console.error("Error bookmarking post:", err);
    res.status(500).json({ error: "Failed to bookmark" });
  }
});

export default router;
