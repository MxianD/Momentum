// src/routes/userRoutes.js
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

    // 只返回必要字段（可以以后再扩展）
    res.json({
      _id: user._id,
      name: user.name,
    });
  } catch (err) {
    console.error("Error in /api/users/login:", err);
    res.status(500).json({ error: "Failed to login or create user" });
  }
});

export default router;
