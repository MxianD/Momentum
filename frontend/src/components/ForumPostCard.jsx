// src/components/ForumPostCard.jsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
  Chip,
  TextField,
  Divider,
} from "@mui/material";

import ThumbUpAltOutlinedIcon from "@mui/icons-material/ThumbUpAltOutlined";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import ThumbDownAltOutlinedIcon from "@mui/icons-material/ThumbDownAltOutlined";
import ThumbDownAltIcon from "@mui/icons-material/ThumbDownAlt";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import SendIcon from "@mui/icons-material/Send";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

function ForumPostCard({
  // 内容
  title,
  content,
  hasMedia,
  imageUrl,
  authorName,

  // 计数
  upvotesCount = 0,
  downvotesCount = 0,
  bookmarksCount = 0,

  // 标签
  isGoodPost = false,
  categories = [],

  // 评论相关
  comments = [],
  commentValue = "",
  onCommentChange,
  onSubmitComment,

  // 点赞/点踩/收藏状态 + 回调
  upvoted = false,
  downvoted = false,
  bookmarked = false,
  onUpvote,
  onDownvote,
  onToggleBookmark,

  // 点击卡片（可选）
  onCardClick,
}) {
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmitComment && onSubmitComment();
    }
  };

  const mediaSrc = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${API_ORIGIN}${imageUrl}`
    : null;

  return (
    <Paper
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
      }}
    >
      {/* 上半部分：作者 + 标题 + 正文 + 图片（点击查看详情） */}
      <Box
        onClick={onCardClick}
        sx={{
          px: 1.8,
          pt: 1.4,
          pb: 1.2,
          cursor: onCardClick ? "pointer" : "default",
        }}
      >
        {/* 作者 + 标签行 */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 0.8 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              sx={{
                width: 26,
                height: 26,
                bgcolor: "#111827",
                fontSize: 13,
              }}
            >
              {authorName?.[0] || "A"}
            </Avatar>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#111827" }}
            >
              {authorName || "Anonymous"}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            {isGoodPost && (
              <Chip
                label="Good post"
                size="small"
                sx={{
                  bgcolor: "#F59E0B",
                  color: "#111827",
                  fontSize: 11,
                  height: 22,
                }}
              />
            )}
            {categories?.slice(0, 3).map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  bgcolor: "#E5F2C0",
                  color: "#4B5563",
                  fontSize: 11,
                  height: 22,
                }}
              />
            ))}
          </Stack>
        </Stack>

        {/* 标题 + 正文 */}
        {title && (
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: "#111827",
              mb: 0.5,
            }}
          >
            {title}
          </Typography>
        )}
        <Typography
          variant="body2"
          sx={{
            color: "#4B5563",
            mb: hasMedia || mediaSrc ? 1.0 : 0.4,
          }}
        >
          {content}
        </Typography>

        {/* 图片 */}
        {(hasMedia || mediaSrc) && (
          <Box
            sx={{
              mt: 0.5,
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "#E5E5E5",
              height: 150,
            }}
          >
            {mediaSrc && (
              <Box
                component="img"
                src={mediaSrc}
                alt="post media"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
          </Box>
        )}
      </Box>

      <Divider />

      {/* 下半部分：点赞/点踩/收藏 + 评论区 */}
      <Box sx={{ px: 1.8, pt: 1, pb: 1.2 }}>
        {/* 点赞 / 点踩 / 收藏 一行 */}
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ mb: comments?.length ? 1 : 0.8 }}
        >
          {/* 👍 */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={onUpvote} sx={{ p: 0.2 }}>
              {upvoted ? (
                <ThumbUpAltIcon sx={{ fontSize: 20, color: "#4CAF50" }} />
              ) : (
                <ThumbUpAltOutlinedIcon
                  sx={{ fontSize: 20, color: "#4B5563" }}
                />
              )}
            </IconButton>
            <Typography
              variant="caption"
              sx={{ color: "#4B5563", minWidth: 12 }}
            >
              {upvotesCount}
            </Typography>
          </Stack>

          {/* 👎 */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton size="small" onClick={onDownvote} sx={{ p: 0.2 }}>
              {downvoted ? (
                <ThumbDownAltIcon
                  sx={{ fontSize: 20, color: "#EF4444" }}
                />
              ) : (
                <ThumbDownAltOutlinedIcon
                  sx={{ fontSize: 20, color: "#4B5563" }}
                />
              )}
            </IconButton>
            <Typography
              variant="caption"
              sx={{ color: "#4B5563", minWidth: 12 }}
            >
              {downvotesCount}
            </Typography>
          </Stack>

          {/* 🔖 */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <IconButton
              size="small"
              onClick={onToggleBookmark}
              sx={{ p: 0.2 }}
            >
              {bookmarked ? (
                <BookmarkIcon sx={{ fontSize: 20, color: "#F59E0B" }} />
              ) : (
                <BookmarkBorderIcon
                  sx={{ fontSize: 20, color: "#4B5563" }}
                />
              )}
            </IconButton>
            <Typography
              variant="caption"
              sx={{ color: "#4B5563", minWidth: 12 }}
            >
              {bookmarksCount}
            </Typography>
          </Stack>
        </Stack>

        {/* 已有评论列表 */}
        {comments && comments.length > 0 && (
          <Box sx={{ mb: 1 }}>
            {comments.map((c) => (
              <Box key={c.id} sx={{ mb: 0.35 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "#111827",
                    mr: 0.5,
                  }}
                >
                  {c.authorName}:
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#4B5563" }}
                >
                  {c.text}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* 评论输入框 */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TextField
            size="small"
            placeholder="Leave a supportive comment..."
            value={commentValue}
            onChange={(e) =>
              onCommentChange && onCommentChange(e.target.value)
            }
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
      </Box>
    </Paper>
  );
}

export default ForumPostCard;
