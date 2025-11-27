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

// 把 /api 去掉，得到后端根域名，用来拼接图片 URL
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

// 单个帖子卡片
function FriendPostCard({
  content,
  authorName,
  imageUrl,
  hasMedia,
  liked,
  likeCount,
  commentValue,
  comments,
  onChangeComment,
  onLike,
  onSubmitComment,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmitComment();
    }
  };

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
      {/* 图片区域：有 imageUrl 就显示真实图片，否则按 hasMedia 显示灰框 */}
      {imageUrl ? (
        <Box
          component="img"
          src={`${API_ORIGIN}${imageUrl}`}
          alt="post media"
          sx={{
            width: "100%",
            height: 130,
            objectFit: "cover",
            display: "block",
            bgcolor: "#E5E5E5",
          }}
        />
      ) : hasMedia ? (
        <Box
          sx={{
            height: 130,
            bgcolor: "#E5E5E5",
          }}
        />
      ) : null}

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
                  pr: 0,
                },
              }}
            />
            <IconButton
              size="small"
              onClick={onSubmitComment}
              sx={{ ml: 0.5 }}
            >
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
  const [feed, setFeed] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({});

  // 读取当前用户
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);

  const userId = currentUser?._id;

  // 拉取【自己 + 好友】的帖子，按时间从早到晚
  useEffect(() => {
    if (!userId) return;

    const loadPosts = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/forum/posts/friends/${userId}`
        );
        if (!res.ok) {
          console.error("Failed to load friends posts");
          return;
        }
        const data = await res.json();

        // 按 createdAt 降序（最早在上面）
        const sorted = [...data].sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da;
        });

        const normalized = sorted.map((p) => {
          const created = p.createdAt ? new Date(p.createdAt) : new Date();
          const dateLabel = created.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

          return {
            ...p,
            id: p._id,
            dateLabel,
            likeCount: p.upvotes ?? 0,
          };
        });

        setFeed(normalized);
      } catch (err) {
        console.error("Failed to load friends posts", err);
      }
    };

    loadPosts();
  }, [userId]);

  const handleToggleLike = async (postId) => {
    if (!userId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/upvote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to upvote:", data);
        return;
      }

      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...data.post,
                id: data.post._id,
                dateLabel: p.dateLabel,
                likeCount: data.post.upvotes ?? 0,
              }
            : p
        )
      );
    } catch (err) {
      console.error("Failed to toggle like", err);
    }
  };

  const handleChangeComment = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text || !userId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            text,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to send comment:", data);
        return;
      }

      setFeed((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...data.post,
                id: data.post._id,
                dateLabel: p.dateLabel,
                likeCount: data.post.upvotes ?? 0,
              }
            : p
        )
      );

      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Failed to send comment", err);
    }
  };

  // 根据 dateLabel 分组（顺序保持 sorted 后的顺序：最早日期在上）
  const grouped = feed.reduce((acc, post) => {
    const key = post.dateLabel || "Recent";
    if (!acc[key]) acc[key] = [];
    acc[key].push(post);
    return acc;
  }, {});
  const dateSections = Object.entries(grouped);

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
        {dateSections.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: "#6B7280", mt: 2, textAlign: "center" }}
          >
            No activity from you or your friends yet.
          </Typography>
        ) : (
          dateSections.map(([dateLabel, posts]) => (
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

              {posts.map((post, index) => {
                const isLast = index === posts.length - 1;

                const comments = (post.comments || []).map((c) => ({
                  id: c.id,
                  authorName: c.userName || "Anonymous",
                  text: c.text,
                }));

                const liked =
                  !!userId &&
                  (post.upvotedBy || []).some((u) => {
                    const val = u?._id || u;
                    return val.toString() === userId;
                  });

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
                      imageUrl={post.imageUrl}
                      hasMedia={post.hasMedia}
                      liked={liked}
                      likeCount={post.likeCount}
                      commentValue={commentDrafts[post.id] || ""}
                      comments={comments}
                      onChangeComment={(v) =>
                        handleChangeComment(post.id, v)
                      }
                      onLike={() => handleToggleLike(post.id)}
                      onSubmitComment={() =>
                        handleSubmitComment(post.id)
                      }
                    />
                  </Box>
                );
              })}
            </Box>
          ))
        )}
      </Box>

      <BottomNavBar />
    </Box>
  );
}

export default FriendsPage;
