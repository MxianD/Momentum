// src/routes/challengeRoutes.js
import express from "express";
import Challenge from "../models/Challenge.js";
import UserChallenge from "../models/UserChallenge.js";
import ForumPost from "../models/ForumPost.js";

const router = express.Router();

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

// GET /api/challenges/joined/:userId   获取某个用户加入的挑战（和他的状态）
router.get("/joined/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const joined = await UserChallenge.find({ user: userId })
      .populate("challenge")
      .exec();

    res.json(joined);
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

    // 找到或创建 UserChallenge
    let uc = await UserChallenge.findOne({
      user: userId,
      challenge: id,
    });

    if (!uc) {
      uc = await UserChallenge.create({
        user: userId,
        challenge: id,
      });
    }

    // 简化版 streak 逻辑：每次 check in streak +1
    uc.streak += 1;
    uc.checkedInToday = true;
    uc.lastNote = note;
    uc.lastCheckInAt = new Date();
    await uc.save();
    uc = await uc.populate("challenge");

    // 顺便在 Forum 创建一条帖子，source=checkin
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

export default router;
