// backend/src/routes/challengeRoutes.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Challenge from "../models/Challenge.js";
import UserChallenge from "../models/UserChallenge.js";
import ForumPost from "../models/ForumPost.js";
import User from "../models/User.js";
const router = express.Router();

function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/** ---------- 上传配置（与 forumRoutes 一致） ---------- */

// 确保 uploads 目录存在
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

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
 * GET /api/challenges/friends
 * 获取“朋友之间的挑战”
 */
router.get("/friends", async (req, res) => {
  try {
    const challenges = await Challenge.find({ type: "friend" }).sort({
      createdAt: -1,
    });
    res.json(challenges);
  } catch (err) {
    console.error("Error fetching friend challenges", err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

/**
 * GET /api/challenges/joined/:userId
 * 获取用户加入的所有挑战
 */
router.get("/joined/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const joined = await UserChallenge.find({ user: userId })
      .populate("challenge")
      .exec();

    const today = new Date();

    const mapped = joined.map((uc) => {
      const obj = uc.toObject();

      const last = obj.lastCheckInAt ? new Date(obj.lastCheckInAt) : null;
      const checkedInToday = last && isSameDay(last, today);

      return {
        ...obj,
        checkedInToday,
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching user challenges", err);
    res.status(500).json({ error: "Failed to fetch user challenges" });
  }
});

/**
 * POST /api/challenges/:id/join
 * 用户加入某个 challenge
 *
 * - 对于已存在的 challenge（朋友创建的），按原逻辑 join。
 * - 对于前端写死 _id 的推荐 challenge：
 *    如果当前 id 在数据库里找不到，会自动用这个 id 创建一条 Challenge，
 *    type 默认 "recommended"，然后再为用户创建 UserChallenge。
 */
router.post("/:id/join", async (req, res) => {
  try {
    const { id } = req.params; // challengeId（前端 URL 里的那串 24 位 hex）
    const { userId, title, description, time, type } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 先尝试按 id 找 challenge
    let challenge = await Challenge.findById(id);

    // 如果找不到（典型场景：Recommended 那三个 _id 在 DB 里还没建）
    if (!challenge) {
      console.warn(
        `[join] Challenge not found by id=${id}, creating a new one automatically...`
      );

      // 自动创建一条 Challenge，_id 使用当前 URL 里的 id
      // 注意：id 必须是 24 位 hex 才能被转成 ObjectId；你现在写死的 "691beb..." 就是这种格式。
      const challengeData = {
        _id: id, // 使用这串 id 作为 Mongo 的 _id（Mongoose 会自动 cast）
        title: title || "New Challenge",
        description: description || "",
        time: time || "Daily",
        type: type || "recommended",
      };

      challenge = await Challenge.create(challengeData);
    }

    // 如果用户已经加入过这个 challenge，就直接返回那条记录
    let uc = await UserChallenge.findOne({
      user: userId,
      challenge: challenge._id,
    }).populate("challenge");

    if (!uc) {
      uc = await UserChallenge.create({
        user: userId,
        challenge: challenge._id,
        streak: 0,
        checkedInToday: false,
        lastNote: "",
        lastCheckInAt: null,
      });
      uc = await uc.populate("challenge");
    }

    // 保持和你原来的返回格式一致（前端当前只用状态码，不依赖结构）
    res.json(uc);
  } catch (err) {
    console.error("Error joining challenge", err);
    res.status(500).json({ error: "Failed to join challenge" });
  }
});

/**
 * POST /api/challenges/:id/checkin
 * 用户对某个 challenge 打卡（支持文字 + 可选图片）
 * 前端用 FormData: userId, note, image
 */
router.post("/:id/checkin", upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params; // challengeId

    // FormData 情况下，字段从 req.body 取
    const userId = req.body.userId;
    const note = req.body.note;

    if (!userId || !note?.trim()) {
      console.log("Invalid checkin body:", req.body);
      return res
        .status(400)
        .json({ error: "userId and note are required" });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    let uc = await UserChallenge.findOne({
      user: userId,
      challenge: id,
    });

    const now = new Date();

    if (!uc) {
      // 第一次加入+打卡
      uc = await UserChallenge.create({
        user: userId,
        challenge: id,
        streak: 1,
        checkedInToday: true,
        lastNote: note,
        lastCheckInAt: now,
      });
    } else {
      const last = uc.lastCheckInAt ? new Date(uc.lastCheckInAt) : null;

      if (last && isSameDay(last, now)) {
        // 今天已经打过卡了，不重复加 streak
        return res.json({
          userChallenge: await uc.populate("challenge"),
          forumPost: null,
        });
      }

      // 计算连续天数
      let newStreak = 1;
      if (last) {
        const diffMs = now - last;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          newStreak = uc.streak + 1;
        } else {
          newStreak = 1;
        }
      }

      uc.streak = newStreak;
      uc.checkedInToday = true;
      uc.lastNote = note;
      uc.lastCheckInAt = now;
      await uc.save();
    }

    uc = await uc.populate("challenge");

    // 处理图片：multer 已经把文件放在 req.file 里
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }

    // 在论坛中创建对应帖子
    const post = await ForumPost.create({
      title: challenge.title,
      content: note,
      hasMedia: !!imageUrl,
      imageUrl, // 注意字段名要和 ForumPost 模型一致
      source: "checkin",
      author: userId,
      challenge: challenge._id,
    });

    res.json({
      userChallenge: uc,
      forumPost: post,
    });
  } catch (err) {
    console.error("Error checking in challenge:", err);
    res.status(500).json({ error: "Failed to check in" });
  }
});

/**
 * POST /api/challenges/create
 * 创建 challenge
 */
router.post("/create", async (req, res) => {
  try {
    const { title, description, time, type } = req.body;

    if (!title || !description || !time) {
      return res
        .status(400)
        .json({ error: "title, description and time are required" });
    }

    const challenge = await Challenge.create({
      title,
      description,
      time,
      type: type || "recommended",
    });

    res.json({ success: true, challenge });
  } catch (err) {
    console.error("Error creating challenge", err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

// ⭐ 获取“好友正在参加的挑战”
router.get("/friends", async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    // 1. 获取我的好友列表
    const user = await User.findById(userId).populate("friends", "_id name");
    if (!user) return res.status(404).json({ error: "User not found" });

    const friendIds = user.friends.map(f => f._id);

    if (friendIds.length === 0) {
      return res.json([]); // 没好友就空列表
    }

    // 2. 找好友的 UserChallenge
    const friendChallenges = await UserChallenge.find({
      user: { $in: friendIds }
    }).populate("challenge");

    // 3. 去重（同一个 challenge 多个好友可以参加）
    const uniqueMap = new Map();
    friendChallenges.forEach(fc => {
      if (fc.challenge) {
        uniqueMap.set(fc.challenge._id.toString(), fc.challenge);
      }
    });

    const uniqueChallenges = Array.from(uniqueMap.values());

    res.json(uniqueChallenges);
  } catch (err) {
    console.error("Error fetching friends' challenges:", err);
    res.status(500).json({ error: "Failed to load challenges" });
  }
});

export default router;
