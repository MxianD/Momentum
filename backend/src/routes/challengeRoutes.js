// src/routes/challengeRoutes.js
import express from "express";
import Challenge from "../models/Challenge.js";
import UserChallenge from "../models/UserChallenge.js";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();
function isSameDay(d1, d2) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// GET /api/challenges/friends   获取“朋友之间的挑战”
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
      const checkedInToday =
        last && isSameDay(last, today);  // 用 lastCheckInAt 判断今天是否已打卡

      return {
        ...obj,
        checkedInToday,  // 覆盖掉数据库里的布尔值，用“计算出来的今天状态”
      };
    });

    res.json(mapped);
  } catch (err) {
    console.error("Error fetching user challenges", err);
    res.status(500).json({ error: "Failed to fetch user challenges" });
  }
});


// POST /api/challenges/:id/join   用户加入某个 challenge
router.post("/:id/join", async (req, res) => {
  try {
    const { id } = req.params; // challengeId
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const challenge = await Challenge.findById(id);
    if (!challenge) {
      return res.status(404).json({ error: "Challenge not found" });
    }

    // 如果已存在则直接返回
    let uc = await UserChallenge.findOne({
      user: userId,
      challenge: id,
    }).populate("challenge");

    if (!uc) {
      uc = await UserChallenge.create({
        user: userId,
        challenge: id,
      });
      uc = await uc.populate("challenge");
    }

    res.json(uc);
  } catch (err) {
    console.error("Error joining challenge", err);
    res.status(500).json({ error: "Failed to join challenge" });
  }
});

// POST /api/challenges/:id/checkin   用户对某个 challenge 打卡
router.post("/:id/checkin", async (req, res) => {
  try {
    const { id } = req.params; // challengeId
    const { userId, note } = req.body;

    if (!userId || !note?.trim()) {
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
        // 已经是今天打过卡了 → 不重复加 streak
        // 你可以选择直接返回当前数据
        return res.json({
          userChallenge: await uc.populate("challenge"),
          forumPost: null, // 或者不再发新帖子
        });
      }

      // 计算 last 到现在相差几天
      let newStreak = 1;
      if (last) {
        const diffMs = now - last;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // 昨天也打卡了 → 连续
          newStreak = uc.streak + 1;
        } else {
          // 中间断了（diffDays >= 2）或者别的情况 → streak 重新从 1 开始
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

    // Forum 发帖逻辑保持不变
    const post = await ForumPost.create({
      title: challenge.title,
      content: note,
      hasMedia: false,
      source: "checkin",
      author: userId,
      challenge: challenge._id,
    });

    res.json({
      userChallenge: uc,
      forumPost: post,
    });
  } catch (err) {
    console.error("Error checking in challenge", err);
    res.status(500).json({ error: "Failed to check in" });
  }
});

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
      type: type || "recommended", // 默认标记为 recommended
    });

    res.json({ success: true, challenge });
  } catch (err) {
    console.error("Error creating challenge", err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});
export default router;
