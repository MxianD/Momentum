// src/models/UserChallenge.js
import mongoose from "mongoose";

const UserChallengeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      required: true,
    },

    // 打卡相关
    streak: { type: Number, default: 0 },
    checkedInToday: { type: Boolean, default: false },
    lastNote: { type: String, default: "" },
    lastCheckInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });

const UserChallenge = mongoose.model(
  "UserChallenge",
  UserChallengeSchema
);

export default UserChallenge;
