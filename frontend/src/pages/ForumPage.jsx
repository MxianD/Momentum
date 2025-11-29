// src/pages/ForumPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Fab,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbDownOffAltIcon from "@mui/icons-material/ThumbDownOffAlt";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

/** 把 categories 转成字符串数组，方便展示 chip */
function extractCategoryTags(post) {
  const c = post.categories;
  if (!c) return [];
  if (Array.isArray(c)) return c;
  if (typeof c === "string") {
    return c
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

/** 把用户输入的 category 文本解析成数组 */
function parseCategoryInput(input) {
  return (input || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function ForumPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 评论草稿：postId -> 文本
  const [commentDrafts, setCommentDrafts] = useState({});

  // 评论本地点赞/点踩状态：commentId -> 'up' | 'down' | null
  const [commentReactions, setCommentReactions] = useState({});

  // 新帖子弹窗
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategoriesInput, setNewCategoriesInput] = useState("");
  const [newImageFile, setNewImageFile] = useState(null);
  const [creatingPost, setCreatingPost] = useState(false);
  const [formError, setFormError] = useState("");

  // 帖子点赞/点踩时的“进行中”状态
  const [votingPostId, setVotingPostId] = useState(null);

  // 图片加载错误：postId -> true
  const [imageErrorMap, setImageErrorMap] = useState({});

  // 读当前用户
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  const userId = currentUser?._id;

  // 加载所有 forum posts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE_URL}/forum/posts`);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          console.error("Failed to fetch forum posts:", data);
          throw new Error("Request failed");
        }

        // 过滤掉所有 check-in 帖子
        setPosts(
          (Array.isArray(data) ? data : []).filter(
            (p) => p.category !== "checkin" && p.source !== "checkin"
          )
        );
      } catch (err) {
        console.error("Error loading forum posts:", err);
        setError("Failed to load posts.");
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, []);

  /** 打开发帖弹窗 */
  const handleOpenPostDialog = () => {
    if (!userId) {
      alert("Please login first.");
      return;
    }
    setFormError("");
    setNewTitle("");
    setNewBody("");
    setNewCategoriesInput("");
    setNewImageFile(null);
    setPostDialogOpen(true);
  };

  const handleClosePostDialog = () => {
    if (creatingPost) return;
    setPostDialogOpen(false);
  };

  /** 提交新帖子 */
  const handleCreatePost = async () => {
    if (!userId) {
      setFormError("Please login first.");
      return;
    }

    const cats = parseCategoryInput(newCategoriesInput);

    if (!newTitle.trim() || !newBody.trim() || cats.length === 0) {
      setFormError("Category, title and body are required.");
      return;
    }

    try {
      setCreatingPost(true);
      setFormError("");

      const formData = new FormData();
      formData.append("title", newTitle.trim());
      formData.append("content", newBody.trim());
      formData.append("userId", userId);
      formData.append("source", "manual"); // forum 知识贴
      formData.append("categories", JSON.stringify(cats));
      if (newImageFile) {
        // backend forumRoutes: upload.single("media")
        formData.append("media", newImageFile);
      }

      const res = await fetch(`${API_BASE_URL}/forum/posts`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        console.error("Failed to create post:", data);
        setFormError(data.error || "Failed to create post.");
        setCreatingPost(false);
        return;
      }

      const created = data.post;
      if (created) {
        // 新帖子插到列表顶部
        setPosts((prev) => [created, ...prev]);
      }

      setCreatingPost(false);
      setPostDialogOpen(false);
    } catch (err) {
      console.error("Error creating post:", err);
      setFormError("Network error, please try again.");
      setCreatingPost(false);
    }
  };

  /** 评论输入变化 */
  const handleCommentChange = (postId, value) => {
    setCommentDrafts((prev) => ({ ...prev, [postId]: value }));
  };

  /** 提交评论 */
  const handleSubmitComment = async (postId) => {
    const text = (commentDrafts[postId] || "").trim();
    if (!text || !userId) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, text }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        console.error("Failed to send comment:", data);
        alert("Failed to send comment.");
        return;
      }

      const updatedPost = data.post;
      if (updatedPost) {
        setPosts((prev) =>
          prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
      }
      setCommentDrafts((prev) => ({ ...prev, [postId]: "" }));
    } catch (err) {
      console.error("Error sending comment:", err);
      alert("Network error. Please try again.");
    }
  };

  /** 帖子点赞 / 点踩 */
  const handlePostVote = async (postId, type) => {
    if (!userId) {
      alert("Please login first.");
      return;
    }
    if (!postId || (type !== "up" && type !== "down")) return;

    try {
      setVotingPostId(postId);
      const endpoint = type === "up" ? "upvote" : "downvote";

      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        console.error("Failed to vote post:", data);
        alert("Failed to vote.");
        setVotingPostId(null);
        return;
      }

      const updatedPost = data.post;
      if (updatedPost) {
        setPosts((prev) =>
          prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
        );
      }
      setVotingPostId(null);
    } catch (err) {
      console.error("Error voting post:", err);
      alert("Network error. Please try again.");
      setVotingPostId(null);
    }
  };

  /** 评论本地点赞 / 点踩（只前端 UI，不调用后端） */
  const handleCommentReact = (commentId, type) => {
    setCommentReactions((prev) => {
      const current = prev[commentId] || null;
      let next = type;
      if (current === type) {
        // 再点一次同一个 -> 取消
        next = null;
      }
      return { ...prev, [commentId]: next };
    });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F2F2F2",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* 顶部绿色标题条 */}
      <Box
        sx={{
          bgcolor: "#516E1F",
          color: "#FFFFFF",
          px: { xs: 2, md: 4 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 2, md: 3 },
          borderBottomLeftRadius: { xs: 24, md: 32 },
          borderBottomRightRadius: { xs: 24, md: 32 },
          boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: 22, mb: 0.5 }}
        >
          Forum
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}
        >
          Share tips, ideas, and updates with everyone
        </Typography>
      </Box>

      {/* 内容区域：帖子列表 */}
      <Box
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          pt: 2,
          pb: 8,
        }}
      >
        {loading && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading posts...
          </Typography>
        )}

        {!loading && error && (
          <Typography variant="body2" sx={{ mt: 2, color: "#EF4444" }}>
            {error}
          </Typography>
        )}

        {!loading && !error && posts.length === 0 && (
          <Typography variant="body2" sx={{ mt: 2, color: "#6B7280" }}>
            No posts yet. Tap the + button to share something!
          </Typography>
        )}

        {!loading &&
          !error &&
          posts.map((p) => {
            const postId = p._id;
            const d = p.createdAt ? new Date(p.createdAt) : null;
            const timeLabel = d
              ? d.toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "";
            const authorName =
              p.authorName ||
              (typeof p.author === "object" && p.author?.name) ||
              "Anonymous";

            const rawMediaSrc = p.imageUrl
              ? p.imageUrl.startsWith("http")
                ? p.imageUrl
                : `${API_ORIGIN}${p.imageUrl}`
              : null;

            const hideMedia = !rawMediaSrc || imageErrorMap[postId];

            const tags = extractCategoryTags(p);
            const comments = (p.comments || []).map((c) => ({
              id: c.id,
              authorName: c.userName || "Anonymous",
              text: c.text,
            }));

            const commentValue = commentDrafts[postId] || "";

            return (
              <Paper
                key={postId}
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 3,
                  overflow: "hidden",
                  bgcolor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                }}
              >
                {/* 只在有图片且没出错时渲染图片区域 */}
                {!hideMedia && (
                  <Box
                    sx={{
                      height: 180,
                      bgcolor: "#E5E5E5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      component="img"
                      src={rawMediaSrc}
                      alt="post media"
                      onError={() =>
                        setImageErrorMap((prev) => ({
                          ...prev,
                          [postId]: true,
                        }))
                      }
                      sx={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </Box>
                )}

                {/* 文本 + 作者 + 分类 tag */}
                <Box sx={{ px: 2, py: 1.4 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 0.5 }}
                  >
                    <Box sx={{ pr: 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: "#111827",
                          mb: 0.2,
                        }}
                      >
                        {p.title || "Post"}
                      </Typography>
                      {timeLabel && (
                        <Typography
                          variant="caption"
                          sx={{ color: "#9CA3AF", display: "block" }}
                        >
                          {timeLabel}
                        </Typography>
                      )}
                      {/* 显示完整作者姓名 */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#6B7280",
                          display: "block",
                          mt: 0.2,
                        }}
                      >
                        Posted by {authorName}
                      </Typography>
                    </Box>

                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "#111827",
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {authorName?.[0] || "A"}
                    </Avatar>
                  </Stack>

                  {/* 分类标签 */}
                  {tags.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.5}
                      sx={{ mb: 0.8, flexWrap: "wrap" }}
                    >
                      {tags.slice(0, 6).map((tag) => (
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
                  )}

                  <Typography
                    variant="body2"
                    sx={{ color: "#4B5563", mb: 0.8 }}
                  >
                    {p.content}
                  </Typography>

                  {/* 帖子点赞/点踩 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 0.8,
                      gap: 0.5,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handlePostVote(postId, "up")}
                      disabled={votingPostId === postId}
                    >
                      <ThumbUpOffAltIcon
                        sx={{ fontSize: 18, color: "#6B7280" }}
                      />
                    </IconButton>
                    <Typography
                      variant="caption"
                      sx={{ color: "#6B7280", mr: 1 }}
                    >
                      {p.upvotes ?? 0}
                    </Typography>

                    <IconButton
                      size="small"
                      onClick={() => handlePostVote(postId, "down")}
                      disabled={votingPostId === postId}
                    >
                      <ThumbDownOffAltIcon
                        sx={{ fontSize: 18, color: "#6B7280" }}
                      />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: "#6B7280" }}>
                      {p.downvotes ?? 0}
                    </Typography>
                  </Box>

                  {/* 评论输入区 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.5,
                    }}
                  >
                    <TextField
                      size="small"
                      placeholder="Add a comment..."
                      value={commentValue}
                      onChange={(e) =>
                        handleCommentChange(postId, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment(postId);
                        }
                      }}
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
                      onClick={() => handleSubmitComment(postId)}
                      sx={{ ml: 0.5 }}
                    >
                      <SendIcon sx={{ fontSize: 18, color: "#7E9B3C" }} />
                    </IconButton>
                  </Box>

                  {/* 已有评论：显示评论用户名字 + 本地点赞/点踩 */}
                  {comments.length > 0 && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Box>
                        {comments.map((c) => {
                          const reaction = commentReactions[c.id] || null;
                          return (
                            <Box
                              key={c.id}
                              sx={{
                                mb: 0.4,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <Box sx={{ mr: 1, flex: 1 }}>
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

                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleCommentReact(c.id, "up")
                                  }
                                >
                                  <ThumbUpOffAltIcon
                                    sx={{
                                      fontSize: 16,
                                      color:
                                        reaction === "up"
                                          ? "#16A34A"
                                          : "#9CA3AF",
                                    }}
                                  />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    handleCommentReact(c.id, "down")
                                  }
                                >
                                  <ThumbDownOffAltIcon
                                    sx={{
                                      fontSize: 16,
                                      color:
                                        reaction === "down"
                                          ? "#DC2626"
                                          : "#9CA3AF",
                                    }}
                                  />
                                </IconButton>
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            );
          })}
      </Box>

      {/* 右下角绿色圆形 + 按钮 */}
      <Fab
        onClick={handleOpenPostDialog}
        sx={{
          position: "fixed",
          right: 24,
          bottom: 80, // 避开 BottomNavBar
          bgcolor: "#7E9B3C",
          color: "#FFFFFF",
          "&:hover": {
            bgcolor: "#647630",
          },
          zIndex: 1200,
        }}
      >
        <AddIcon />
      </Fab>

      <BottomNavBar />

      {/* 发布新帖弹窗 */}
      <Dialog
        open={postDialogOpen}
        onClose={handleClosePostDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>New forum post</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1, color: "#6B7280" }}>
            Category, title and body are required. You can also add an image.
          </Typography>

          <TextField
            label="Categories (comma separated)"
            fullWidth
            margin="dense"
            value={newCategoriesInput}
            onChange={(e) => setNewCategoriesInput(e.target.value)}
          />

          <TextField
            label="Title"
            fullWidth
            margin="dense"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <TextField
            label="Body"
            fullWidth
            margin="dense"
            multiline
            minRows={3}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />

          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              component="label"
              sx={{ textTransform: "none", borderRadius: 999 }}
            >
              {newImageFile ? "Change image" : "Upload image"}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setNewImageFile(file);
                }}
              />
            </Button>
            {newImageFile && (
              <Typography variant="caption" sx={{ ml: 1, color: "#6B7280" }}>
                {newImageFile.name}
              </Typography>
            )}
          </Box>

          {formError && (
            <Typography variant="body2" sx={{ mt: 1.5, color: "#EF4444" }}>
              {formError}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePostDialog} disabled={creatingPost}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreatePost}
            disabled={creatingPost}
            sx={{ textTransform: "none", borderRadius: 999 }}
          >
            {creatingPost ? "Posting..." : "Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForumPage;
