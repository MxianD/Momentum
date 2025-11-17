// src/models/Challenge.js
import mongoose from "mongoose";

const ChallengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    time: { type: String, required: true }, // e.g. "10 Min / day"
    description: { type: String, default: "" },

    // 类型：系统推荐 / 朋友挑战 / 其他
    type: {
      type: String,
      enum: ["system", "friend", "recommended"],
      default: "friend",
    },
  },
  { timestamps: true }
);

const Challenge = mongoose.model("Challenge", ChallengeSchema);

export default Challenge;
