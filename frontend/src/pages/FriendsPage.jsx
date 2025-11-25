// src/pages/FriendsPage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
  TextField,
  Divider,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SendIcon from "@mui/icons-material/Send";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 临时 mock 数据
const mockFeed = [
  {
    id: "p1",
    dateLabel: "Oct. 17",
    content: "Bla bla bla bla bla bla",
    authorName: "Amy",
    liked: false,
    likeCount: 3,
    hasMedia: true,
  },
  {
    id: "p2",
    dateLabel: "Oct. 17",
    content: "Bla bla bla bla bla bla",
    authorName: "Bob",
    liked: true,
    likeCount: 5,
    hasMedia: false,
  },
  {
    id: "p3",
    dateLabel: "Oct. 16",
    content: "Bla bla bla bla bla bla",
    authorName: "Cathy",
    liked: false,
    likeCount: 1,
    hasMedia: true,
  },
];

// 单个帖子卡片
function FriendPostCard({
  content,
  authorName,
  hasMedia,
  liked,
  likeCount,
  commentValue,
  comments,
  onChangeComment,
  onLike,
  onSubmitComment,
}) {
  // 回车发送（不换行）
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmitComment();
    }
  };
  useEffect(() => {
    const loadPosts = async () => {
      const res = await fetch(`${API_BASE_URL}/forum/posts`);
      const data = await res.json();
      setFeed(data); // 包含 comments
    };

    loadPosts();
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        mb: 2,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* 图片区域 */}
      {hasMedia && (
        <Box
          sx={{
            height: 130,
            bgcolor: "#E5E5E5",
          }}
        />
      )}

      {/* 文本 + 底部区域 */}
      <Box sx={{ px: 1.8, pt: 1.2, pb: 1.4 }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, color: "#111827" }}
          >
            {content}
          </Typography>
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: "#111827",
              fontSize: 12,
            }}
          >
            {authorName?.[0] || "A"}
          </Avatar>
        </Stack>

        {/* 已有评论列表 */}
        {comments && comments.length > 0 && (
          <>
            <Divider sx={{ mb: 1, mt: 0.5 }} />
            <Stack spacing={0.5} sx={{ mb: 1 }}>
              {comments.map((c) => (
                <Box key={c.id}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, color: "#111827", mr: 0.5 }}
                  >
                    {c.authorName || "You"}:
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ color: "#4B5563" }}
                  >
                    {c.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}

        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* 点赞 */}
          <IconButton
            size="small"
            onClick={onLike}
            sx={{
              p: 0,
            }}
          >
            {liked ? (
              <FavoriteIcon sx={{ fontSize: 20, color: "#EC4899" }} />
            ) : (
              <FavoriteBorderIcon sx={{ fontSize: 20, color: "#EC4899" }} />
            )}
          </IconButton>
          <Typography variant="caption" sx={{ color: "#6B7280", width: 20 }}>
            {likeCount}
          </Typography>

          {/* 评论输入框 + 发送按钮 */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Comment..."
              value={commentValue}
              onChange={(e) => onChangeComment(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 999,
                  fontSize: 12,
                  bgcolor: "#FFFFFF",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#7E9B3C",
                  },
                  pr: 0, // 给右侧按钮留空间
                },
              }}
            />
            <IconButton size="small" onClick={onSubmitComment} sx={{ ml: 0.5 }}>
              <SendIcon sx={{ fontSize: 18, color: "#7E9B3C" }} />
            </IconButton>
          </Box>
        </Stack>
      </Box>
    </Paper>
  );
}

function FriendsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [feed, setFeed] = useState(mockFeed);

  // 每个帖子当前输入中的评论内容
  const [commentDrafts, setCommentDrafts] = useState({});
  // 每个帖子已经发送的评论
  const [commentsByPost, setCommentsByPost] = useState({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);

  const displayName = currentUser?.name || "Friends";
  const userName = currentUser?.name || "You";

  // 点赞本地切换
  const handleToggleLike = (postId) => {
    setFeed((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !p.liked,
              likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1,
            }
          : p
      )
    );
  };

  const handleChangeComment = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text || !currentUser?._id) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser._id,
            text,
          }),
        }
      );

      const data = await res.json();
      if (data.success) {
        // 用后端返回的最新 post 覆盖本地的那一个
        setFeed((prev) => prev.map((p) => (p.id === postId ? data.post : p)));

        // 清空输入框
        setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
      }
    } catch (err) {
      console.error("Failed to send comment", err);
    }
  };

  // 根据 dateLabel 分组
  const grouped = feed.reduce((acc, post) => {
    const key = post.dateLabel || "Recent";
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});

  const dateSections = Object.entries(grouped); // [ [date, posts], ... ]

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 顶部绿色区域 */}
      <Box
        sx={{
          bgcolor: "#516E1F",
          color: "#FFFFFF",
          px: { xs: 2, md: 4 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 2.5, md: 3 },
          borderBottomLeftRadius: { xs: 24, md: 32 },
          borderBottomRightRadius: { xs: 24, md: 32 },
          boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          Friends
        </Typography>

        <IconButton
          size="small"
          sx={{
            color: "#FFFFFF",
          }}
        >
          <MenuRoundedIcon />
        </IconButton>
      </Box>

      {/* 中间内容：时间线 + 卡片 */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "#F2F2F2",
          px: { xs: 2, md: 4 },
          pt: 2,
          pb: 8,
        }}
      >
        {dateSections.map(([dateLabel, posts]) => (
          <Box key={dateLabel} sx={{ mb: 2.5 }}>
            {/* 日期标题 */}
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "#111827",
                mb: 1.2,
              }}
            >
              {dateLabel}
            </Typography>

            {/* 每个帖子一行：左边时间轴，右边卡片 */}
            {posts.map((post, index) => {
              const isLast = index === posts.length - 1;
              const comments = commentsByPost[post.id] || [];

              return (
                <Box
                  key={post.id}
                  sx={{
                    display: "flex",
                    alignItems: "stretch",
                  }}
                >
                  {/* 时间轴 */}
                  <Box
                    sx={{
                      width: 32,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      mr: 1,
                    }}
                  >
                    {/* 圆点 */}
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        border: "2px solid #4B5563",
                        bgcolor: "#FFFFFF",
                        mb: 0.5,
                      }}
                    />
                    {/* 虚线 */}
                    {!isLast && (
                      <Box
                        sx={{
                          flexGrow: 1,
                          borderLeft: "2px dashed #D1D5DB",
                          mt: 0.2,
                        }}
                      />
                    )}
                  </Box>

                  {/* 帖子卡片 */}
                  <FriendPostCard
                    content={post.content}
                    authorName={post.authorName}
                    hasMedia={post.hasMedia}
                    liked={post.liked}
                    likeCount={post.likeCount}
                    commentValue={commentDrafts[post.id] || ""}
                    comments={comments}
                    onChangeComment={(v) => handleChangeComment(post.id, v)}
                    onLike={() => handleToggleLike(post.id)}
                    onSubmitComment={() => handleSubmitComment(post.id)}
                  />
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      <BottomNavBar />
    </Box>
  );
}

export default FriendsPage;
