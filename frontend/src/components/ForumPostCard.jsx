// src/components/ForumPostCard.jsx
import React from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
} from "@mui/material";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import BookmarkIcon from "@mui/icons-material/Bookmark";

function AvatarGroupMini() {
  return (
    <Stack direction="row" spacing={-0.8}>
      {[0, 1, 2].map((i) => (
        <Avatar
          key={i}
          sx={{
            width: 20,
            height: 20,
            border: "2px solid #FFFFFF",
            bgcolor: "#111827",
          }}
        />
      ))}
    </Stack>
  );
}

export default function ForumPostCard({
  title,
  content,
  hasMedia = false,

  // 新增：作者名字 & 点赞数
  authorName = "Anonymous",
  upvotesCount = 0,

  // 交互状态
  upvoted = false,
  downvoted = false,
  bookmarked = false,

  // 回调
  onUpvote,
  onDownvote,
  onToggleBookmark,
  onCardClick,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        bgcolor: "#FFFFFF",
        p: 1.6,
        mb: 1.4,
      }}
    >
      {/* 标题 + 右上作者 & 点赞信息 */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1,
          cursor: onCardClick ? "pointer" : "default",
        }}
        onClick={onCardClick}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: "#111827" }}
        >
          {title}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography
            variant="caption"
            sx={{ color: "#4B5563", whiteSpace: "nowrap" }}
          >
            {/* {authorName} · {upvotesCount} likes */}
          </Typography>
          <AvatarGroupMini />
        </Stack>
      </Box>

      {/* 文本内容 */}
      <Typography
        variant="body2"
        sx={{ color: "#4B5563", mb: hasMedia ? 1.4 : 1 }}
      >
        {content}
      </Typography>

      {/* 图片占位区域（仅 hasMedia 时显示） */}
      {hasMedia && (
        <Box
          sx={{
            display: "flex",
            gap: 1.2,
            mb: 1.2,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                height: 80,
                borderRadius: 2,
                bgcolor: "#DDDDDD",
              }}
            />
          ))}
        </Box>
      )}

      {/* 底部操作栏 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: 0.5,
        }}
      >
        {/* 左侧：黑色 pill，里面两个图标 */}
        {/* <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            borderRadius: 999,
            bgcolor: "#000000",
            px: 1,
            py: 0.25,
          }}
        >
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation(); // 不触发卡片点击
              onUpvote && onUpvote();
            }}
            sx={{
              color: upvoted ? "#A7F3D0" : "#FFFFFF",
              p: 0.4,
            }}
          >
            <ThumbUpOffAltIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <Box
            sx={{
              width: 1,
              alignSelf: "stretch",
              bgcolor: "rgba(255,255,255,0.2)",
            }}
          />

          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDownvote && onDownvote();
            }}
            sx={{
              color: downvoted ? "#FCA5A5" : "#FFFFFF",
              p: 0.4,
            }}
          >
            <ThumbDownOffAltIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box> */}

        {/* 右侧：收藏按钮 */}
        {/* <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark && onToggleBookmark();
          }}
          sx={{
            bgcolor: "#000000",
            color: "#FFFFFF",
            width: 32,
            height: 32,
            "&:hover": { bgcolor: "#111111" },
          }}
        >
          {bookmarked ? (
            <BookmarkIcon sx={{ fontSize: 18 }} />
          ) : (
            <BookmarkBorderIcon sx={{ fontSize: 18 }} />
          )}
        </IconButton> */}
      </Box>
    </Paper>
  );
}
