import mongoose from "mongoose";

const ForumPostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    hasMedia: { type: Boolean, default: false },

    // 上传的图片地址（单张）
    imageUrl: {
      type: String,
      default: null,
    },

    // 发帖人
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // 来源：普通发帖 / check-in
    source: {
      type: String,
      enum: ["manual", "checkin"],
      default: "manual",
    },

    // 关联的 challenge（如果这是某个挑战的 check-in）
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Challenge",
      default: null,
    },

    // 按用户存储点赞 / 点踩 / 收藏
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 评论
    comments: [
      {
        _id: false,
        id: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// virtual 计数
ForumPostSchema.virtual("upvotes").get(function () {
  return this.upvotedBy?.length || 0;
});
ForumPostSchema.virtual("downvotes").get(function () {
  return this.downvotedBy?.length || 0;
});
ForumPostSchema.virtual("bookmarks").get(function () {
  return this.bookmarkedBy?.length || 0;
});

ForumPostSchema.set("toJSON", { virtuals: true });
ForumPostSchema.set("toObject", { virtuals: true });

const ForumPost = mongoose.model("ForumPost", ForumPostSchema);

export default ForumPost;
