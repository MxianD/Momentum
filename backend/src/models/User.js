// src/models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // 同名用户只保存一条
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
