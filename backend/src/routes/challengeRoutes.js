import express from "express";
import multer from "multer";
import path from "path";
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

/** ---------- 上传配置（和 forumRoutes 一样） ---------- */

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

// GET /api/challenges/friends
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

// POST /api/challenges/:id/join
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

// POST /api/challenges/:id/checkin   用户对某个 challenge 打卡（可带图片）
router.post("/:id/checkin", upload.single("image"), async (req, res) => {
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

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    let uc = await UserChallenge.findOne({
      user: userId,
      challenge: id,
    });

    const now = new Date();

    if (!uc) {
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
        return res.json({
          userChallenge: await uc.populate("challenge"),
          forumPost: null,
        });
      }

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

    const post = await ForumPost.create({
      title: challenge.title,
      content: note,
      hasMedia: !!imageUrl,
      imageUrl,
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

// 创建 challenge
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

export default router;
