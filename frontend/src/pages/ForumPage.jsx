// src/pages/ForumPage.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Divider,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";
import SendIcon from "@mui/icons-material/Send";
import AddIcon from "@mui/icons-material/Add";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

const ForumPage = () => {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 当前登录用户（从 localStorage 拿）
  const [currentUser, setCurrentUser] = useState(null);

  // comment 输入框（按 postId 存）
  const [commentTexts, setCommentTexts] = useState({});

  // 创建帖子弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImage, setNewImage] = useState(null);
  const [errors, setErrors] = useState({});

  // 读取当前用户
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage", err);
    }
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/forum/posts`);
      const data = await res.json();
      setPosts(data || []);
    } catch (err) {
      console.error("Failed to fetch forum posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCommentChange = (postId, value) => {
    setCommentTexts((prev) => ({ ...prev, [postId]: value }));
  };

  const handleSubmitComment = async (postId) => {
    const text = (commentTexts[postId] || "").trim();
    if (!text) return;

    if (!currentUser?._id) {
      alert("Please log in first.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${postId}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            userId: currentUser._id, // ✅ 后端需要 userId
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to submit comment");
      }

      setCommentTexts((prev) => ({ ...prev, [postId]: "" }));
      await fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const validatePost = () => {
    const newErrors = {};
    if (!newCategory.trim()) newErrors.category = "Category is required";
    if (!newTitle.trim()) newErrors.title = "Title is required";
    if (!newBody.trim()) newErrors.body = "Post body is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreatePost = async () => {
    if (!validatePost()) return;

    if (!currentUser?._id) {
      alert("Please log in first.");
      return;
    }

    try {
      const formData = new FormData();

      // ✅ 和后端字段对齐
      formData.append("userId", currentUser._id);
      formData.append("title", newTitle.trim());
      formData.append("content", newBody.trim()); // 后端要 content
      formData.append("source", "manual");
      formData.append("categories", newCategory.trim()); // 后端 parseCategories 会处理
      if (newImage) {
        formData.append("media", newImage); // 文件字段名要叫 media
      }

      const res = await fetch(`${API_BASE_URL}/forum/posts`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("Create post error:", data);
        alert(data?.error || "Failed to create post");
        return;
      }

      setCreateOpen(false);
      setNewCategory("");
      setNewTitle("");
      setNewBody("");
      setNewImage(null);
      setErrors({});
      await fetchPosts();
    } catch (err) {
      console.error(err);
      alert("Unexpected error when creating post");
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setNewImage(file);
  };

  const filteredPosts = posts.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q) ||
      (Array.isArray(p.categories)
        ? p.categories.join(", ").toLowerCase().includes(q)
        : false)
    );
  });

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getCommenterName = (comment) => {
    return (
      comment.userName ||
      comment.username ||
      comment.user?.name ||
      comment.user?.username ||
      "Anonymous"
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        pb: 9,
      }}
    >
      {/* 顶部搜索栏 */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "#f5f5f5",
          px: 2,
          pt: 2,
          pb: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "#5f8c2f",
            borderRadius: "999px",
            px: 2,
            py: 1,
          }}
        >
          <SearchIcon sx={{ color: "white", mr: 1 }} />
          <TextField
            variant="standard"
            placeholder="Search for the post..."
            InputProps={{
              disableUnderline: true,
              sx: { color: "white" },
            }}
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>
      </Box>

      {/* 帖子列表 */}
      <Box sx={{ px: 2, pb: 2 }}>
        {loading && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading posts...
          </Typography>
        )}

        {!loading && filteredPosts.length === 0 && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            No posts yet.
          </Typography>
        )}

        <Stack spacing={2}>
          {filteredPosts.map((post) => (
            <Paper
              key={post._id}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
              }}
              elevation={1}
            >
              <Box sx={{ p: 2 }}>
                {/* 用户信息 + 分类 */}
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: "#5f8c2f" }}>
                    {getInitials(post.authorName || post.userName)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={600}>
                      {post.authorName || post.userName || "User"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary" }}
                    >
                      {Array.isArray(post.categories) && post.categories.length
                        ? post.categories.join(", ")
                        : "Uncategorized"}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ mt: 1.5 }}>
                  <Typography fontWeight={600}>{post.title}</Typography>
                  <Typography
                    variant="body2"
                    sx={{ mt: 0.5, whiteSpace: "pre-line" }}
                  >
                    {post.content}
                  </Typography>
                </Box>

                {post.imageUrl && (
                  <Box
                    sx={{
                      mt: 1.5,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <img
                      src={post.imageUrl}
                      style={{ width: "100%", display: "block" }}
                    />
                  </Box>
                )}

                {/* 操作栏：赞 / 评论数 / 收藏 */}
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  sx={{ mt: 1.5 }}
                >
                  <IconButton size="small">
                    <ThumbUpOffAltIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2">
                    {post.upvotes ?? 0}
                  </Typography>

                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <ChatBubbleOutlineIcon fontSize="small" />
                    <Typography variant="body2">
                      {post.comments?.length ?? 0}
                    </Typography>
                  </Stack>

                  <IconButton size="small" sx={{ marginLeft: "auto" }}>
                    <BookmarkBorderIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>

              {/* 评论区 */}
              <Divider />
              <Box sx={{ p: 2, pt: 1.5 }}>
                {/* 已有评论（用户名要显示） */}
                <Stack spacing={1} sx={{ mb: 1.5 }}>
                  {post.comments?.map((c) => (
                    <Typography
                      key={c.id || c._id}
                      variant="body2"
                      sx={{ fontSize: 13 }}
                    >
                      <strong>{getCommenterName(c)}</strong>: {c.text}
                    </Typography>
                  ))}
                </Stack>

                {/* 评论输入框 */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "999px",
                    border: "1px solid #c2d7a0",
                    px: 1.5,
                  }}
                >
                  <TextField
                    variant="standard"
                    placeholder="Leave a supportive comment..."
                    InputProps={{ disableUnderline: true }}
                    fullWidth
                    value={commentTexts[post._id] || ""}
                    onChange={(e) =>
                      handleCommentChange(post._id, e.target.value)
                    }
                  />
                  <IconButton
                    onClick={() => handleSubmitComment(post._id)}
                    size="small"
                  >
                    <SendIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Paper>
          ))}
        </Stack>
      </Box>

      {/* 右下角绿色 + 按钮 */}
      <Fab
        color="primary"
        sx={{
          position: "fixed",
          right: 24,
          bottom: 90, // 腾出 BottomNavBar 空间
          bgcolor: "#5f8c2f",
          "&:hover": { bgcolor: "#4d7226" },
        }}
        onClick={() => setCreateOpen(true)}
      >
        <AddIcon />
      </Fab>

      {/* 发布帖子弹窗 */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Share your knowledge</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Category (required)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              error={!!errors.category}
              helperText={errors.category}
              fullWidth
            />
            <TextField
              label="Title (required)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              fullWidth
            />
            <TextField
              label="What did you learn or what worked for you? (required)"
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              error={!!errors.body}
              helperText={errors.body}
              fullWidth
              multiline
              minRows={4}
            />

            <Box>
              <Button variant="outlined" component="label">
                {newImage ? "Change image" : "Upload image"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
              {newImage && (
                <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                  Selected: {newImage.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePost}>
            Post
          </Button>
        </DialogActions>
      </Dialog>

      <BottomNavBar />
    </Box>
  );
};

export default ForumPage;
