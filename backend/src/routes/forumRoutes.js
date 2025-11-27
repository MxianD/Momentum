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
/**
 * GET /api/forum/ranking/today
 * 计算“今天”的积分排行
 */
router.get("/ranking/today", async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    // 找出今天创建的所有帖子
    const posts = await ForumPost.find({
      createdAt: { $gte: start, $lte: end },
    }).populate("author", "name");

    const taskPoints = {
      "Stay hydrated": 5,
      "Everyday Meditation": 6,
      "Morning Stretch": 3,
    };

    // 每个用户的中间状态
    const scoreMap = new Map();
    const ensureUser = (post) => {
      const author = post.author;
      if (!author) return null;
      const uid = author._id.toString();
      if (!scoreMap.has(uid)) {
        scoreMap.set(uid, {
          userId: uid,
          name: author.name || "Anonymous",
          checkinPoints: 0,
          likeEvents: 0,
          knowledgePosts: 0,
          bonusPoints: 0,
        });
      }
      return scoreMap.get(uid);
    };

    for (const p of posts) {
      const userScore = ensureUser(p);
      if (!userScore) continue;
      const uid = userScore.userId;

      // 1) 打卡积分（按 title）
      if (p.source === "checkin") {
        const pts = taskPoints[p.title] || 0;
        userScore.checkinPoints += pts;
      }

      // 2) 点赞事件：来自其他人的点赞
      const othersLikes = (p.upvotedBy || []).filter(
        (u) => u.toString() !== uid
      ).length;
      userScore.likeEvents += othersLikes;

      // 3) 知识贴
      if (p.isKnowledge) {
        userScore.knowledgePosts += 1;
      }

      // 4) good post bonus
      const upCount =
        typeof p.upvotes === "number"
          ? p.upvotes
          : (p.upvotedBy || []).length;
      const bookmarkCount =
        typeof p.bookmarks === "number"
          ? p.bookmarks
          : (p.bookmarkedBy || []).length;

      if (upCount >= 5 || bookmarkCount >= 3) {
        userScore.bonusPoints += 10;
      }
    }

    // 把中间状态映射到最终得分
    const ranking = Array.from(scoreMap.values())
      .map((s) => {
        const likePts = Math.min(s.likeEvents, 5); // cap 5/day
        const knowledgePts = Math.min(s.knowledgePosts * 5, 20); // cap 20/day
        const total =
          s.checkinPoints + likePts + knowledgePts + s.bonusPoints;

        return {
          userId: s.userId,
          name: s.name,
          totalPoints: total,
          breakdown: {
            checkins: s.checkinPoints,
            likes: likePts,
            knowledge: knowledgePts,
            bonus: s.bonusPoints,
          },
        };
      })
      // 按总分从高到低排序
      .sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({
      generatedAt: new Date(),
      ranking,
    });
  } catch (err) {
    console.error("Error generating today ranking:", err);
    res.status(500).json({ error: "Failed to generate ranking" });
  }
});
/**
 * GET /api/forum/ranking/total
 * 计算“总积分榜”：基于所有历史帖子
 */
router.get("/ranking/total", async (req, res) => {
  try {
    const posts = await ForumPost.find().populate("author", "name");

    const taskPoints = {
      "Stay hydrated": 5,
      "Everyday Meditation": 6,
      "Morning Stretch": 3,
    };

    const scoreMap = new Map();

    const ensureUser = (post) => {
      if (!post.author) return null;
      const uid = post.author._id.toString();
      if (!scoreMap.has(uid)) {
        scoreMap.set(uid, {
          userId: uid,
          name: post.author.name || "Anonymous",
          checkinPoints: 0,
          likeEvents: 0,
          knowledgePosts: 0,
          bonusPoints: 0,
        });
      }
      return scoreMap.get(uid);
    };

    for (const p of posts) {
      const userScore = ensureUser(p);
      if (!userScore) continue;
      const uid = userScore.userId;

      // 1) 打卡积分
      if (p.source === "checkin") {
        userScore.checkinPoints += taskPoints[p.title] || 0;
      }

      // 2) 点赞积分（不限天数）
      const othersLikes = (p.upvotedBy || []).filter(
        (u) => u.toString() !== uid
      ).length;
      userScore.likeEvents += othersLikes;

      // 3) 知识贴
      if (p.isKnowledge) {
        userScore.knowledgePosts += 1;
      }

      // 4) good post bonus
      const upCount = (p.upvotedBy || []).length;
      const bookmarkCount = (p.bookmarkedBy || []).length;

      if (upCount >= 5 || bookmarkCount >= 3) {
        userScore.bonusPoints += 10;
      }
    }

    const ranking = Array.from(scoreMap.values())
      .map((s) => {
        // total ranking 不需要每日 cap，所以直接累积
        const likePts = s.likeEvents;
        const knowledgePts = s.knowledgePosts * 5;
        const total = s.checkinPoints + likePts + knowledgePts + s.bonusPoints;

        return {
          userId: s.userId,
          name: s.name,
          totalPoints: total,
          breakdown: {
            checkins: s.checkinPoints,
            likes: likePts,
            knowledge: knowledgePts,
            bonus: s.bonusPoints,
          },
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints);

    res.json({ ranking });
  } catch (err) {
    console.error("Error generating total ranking:", err);
    res.status(500).json({ error: "Failed to generate total ranking" });
  }
});

export default router;
