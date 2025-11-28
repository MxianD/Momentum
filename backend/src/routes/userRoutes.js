import express from "express";
import User from "../models/User.js";

const router = express.Router();

// POST /api/users/login
// 不用密码：只要给一个 name，就返回一个用户（不存在则创建）
router.post("/login", async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name || "").trim();

    if (!trimmed) {
      return res.status(400).json({ error: "Name is required" });
    }

    // 尝试找到已有用户
    let user = await User.findOne({ name: trimmed });

    // 没有就创建
    if (!user) {
      user = await User.create({ name: trimmed });
    }

    // 只返回必要字段
    res.json({
      _id: user._id,
      name: user.name,
    });
  } catch (err) {
    console.error("Error in /api/users/login:", err);
    res.status(500).json({ error: "Failed to login or create user" });
  }
});

/**
 * GET /api/users/all
 * 返回所有用户（用于 Add friends 列表）
 */
router.get("/all", async (req, res) => {
  try {
    const users = await User.find({}, "_id name").sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * GET /api/users/:id/friends
 * 获取某个用户的好友列表
 */
router.get("/:id/friends", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).populate("friends", "name");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      userId: user._id,
      friends: user.friends || [],
    });
  } catch (err) {
    console.error("Error fetching friends:", err);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

/**
 * POST /api/users/:id/friends
 * 添加好友（互相加）
 * body: { friendId }
 */
router.post("/:id/friends", async (req, res) => {
  try {
    const { id } = req.params; // 当前用户
    const { friendId } = req.body;

    if (!friendId || id === friendId) {
      return res.status(400).json({ error: "Invalid friendId" });
    }

    const user = await User.findById(id);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ error: "User or friend not found" });
    }

    const uid = user._id.toString();
    const fid = friend._id.toString();

    // 当前用户添加 friend
    if (!user.friends.some((f) => f.toString() === fid)) {
      user.friends.push(friend._id);
    }

    // 对方也添加当前用户 => 互为好友
    if (!friend.friends.some((f) => f.toString() === uid)) {
      friend.friends.push(user._id);
    }

    await user.save();
    await friend.save();

    const populated = await user.populate("friends", "name");

    res.json({
      userId: populated._id,
      friends: populated.friends,
    });
  } catch (err) {
    console.error("Error adding friend:", err);
    res.status(500).json({ error: "Failed to add friend" });
  }
});
// ⭐ 获取所有用户
router.get("/", async (req, res) => {
  try {
    const users = await User.find().select("_id name email");
    res.json(users);
  } catch (err) {
    console.error("Error fetching all users:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
