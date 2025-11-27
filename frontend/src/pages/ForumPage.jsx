// src/pages/ForumPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Stack,
  Fab,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";

import BottomNavBar from "../components/BottomNavBar.jsx";
import ForumPostCard from "../components/ForumPostCard.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 判断某个 userId 是否在一个 ObjectId 数组中
const isUserInArray = (arr, userId) => {
  if (!Array.isArray(arr) || !userId) return false;
  return arr.some((u) => {
    if (typeof u === "string") return u === userId;
    if (u && typeof u === "object") return u._id === userId;
    return false;
  });
};

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  // 当前用户
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);
  const userId = currentUser?._id;

  // 发帖对话框相关
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newCategories, setNewCategories] = useState("");
  const [newFile, setNewFile] = useState(null);
  const [posting, setPosting] = useState(false);

  // 封装加载帖子，方便发帖后刷新
  const fetchPosts = async () => {
    try {
      setLoading(true);
      setLoadingError("");

      const res = await fetch(`${API_BASE_URL}/forum/posts`);
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        console.error("Load posts failed:", data);
        throw new Error(`Request failed: ${res.status}`);
      }

      // 只保留非 checkin 的知识帖
      const knowledgeOnly = (data || [])
        .filter((p) => p.source !== "checkin")
        .sort((a, b) => {
          const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return db - da; // 最新在最上面
        });

      setPosts(knowledgeOnly);
    } catch (err) {
      console.error("Failed to load posts:", err);
      setLoadingError("Failed to load posts from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 根据 posts + currentUser 计算交互状态
  useEffect(() => {
    const init = {};
    posts.forEach((p) => {
      init[p._id] = {
        upvoted: isUserInArray(p.upvotedBy, userId),
        downvoted: isUserInArray(p.downvotedBy, userId),
        bookmarked: isUserInArray(p.bookmarkedBy, userId),
      };
    });
    setInteractions(init);
  }, [posts, userId]);

  const handleCardClick = (post) => setSelectedPost(post);
  const handleCloseDialog = () => setSelectedPost(null);

  const applyPostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  // 👍 点赞
  const handleUpvote = async (id) => {
    if (!userId) {
      alert("请先登录再点赞");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upvote failed");

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);
        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };
          return {
            ...prev,
            [id]: {
              ...prevState,
              upvoted: isUserInArray(updatedPost.upvotedBy, userId),
              downvoted: isUserInArray(updatedPost.downvotedBy, userId),
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to upvote:", err);
      alert(err.message || "Failed to upvote");
    }
  };

  // 👎 点踩
  const handleDownvote = async (id) => {
    if (!userId) {
      alert("请先登录再点踩");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/downvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Downvote failed");

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);
        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };
          return {
            ...prev,
            [id]: {
              ...prevState,
              upvoted: isUserInArray(updatedPost.upvotedBy, userId),
              downvoted: isUserInArray(updatedPost.downvotedBy, userId),
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to downvote:", err);
      alert(err.message || "Failed to downvote");
    }
  };

  // ⭐ 收藏
  const handleToggleBookmark = async (id) => {
    if (!userId) {
      alert("请先登录再收藏");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${id}/bookmark`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bookmark failed");

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);
        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };
          return {
            ...prev,
            [id]: {
              ...prevState,
              bookmarked: isUserInArray(
                updatedPost.bookmarkedBy,
                userId
              ),
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to bookmark:", err);
      alert(err.message || "Failed to bookmark");
    }
  };

  // 搜索过滤
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.content || "").toLowerCase().includes(q)
    );
  }, [posts, search]);

  // 选择图片
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setNewFile(file);
  };

  // 发布知识贴
  const handleCreatePost = async () => {
    if (!userId) {
      alert("请先登录再发帖");
      return;
    }
    if (!newBody.trim()) {
      alert("Body text is required");
      return;
    }

    try {
      setPosting(true);

      const formData = new FormData();
      const safeTitle = newTitle.trim() || "Untitled post";
      formData.append("title", safeTitle);
      formData.append("content", newBody.trim());
      formData.append("userId", userId);
      formData.append("source", "manual"); // 区分 checkin
      if (newCategories.trim()) {
        formData.append("categories", newCategories.trim());
      }
      if (newFile) {
        formData.append("image", newFile); // 对应后端 multer 字段名
      }

      const res = await fetch(`${API_BASE_URL}/forum/posts`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("Create post failed:", data);
        alert("Failed to create post. Please try again.");
        setPosting(false);
        return;
      }

      // 重新拉取帖子列表
      await fetchPosts();

      setPosting(false);
      setCreateOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewCategories("");
      setNewFile(null);
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Network error. Please try again.");
      setPosting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#F2F2F2",
      }}
    >
      {/* 顶部搜索栏 */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          pt: { xs: 2.5, md: 3 },
          pb: 1.5,
          bgcolor: "#F2F2F2",
        }}
      >
        <TextField
          fullWidth
          placeholder="Search for the post..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon sx={{ color: "#ffffff" }} />
              </InputAdornment>
            ),
            sx: {
              bgcolor: "#5E7D28",
              borderRadius: 999,
              color: "#FFFFFF",
              px: 2,
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& input::placeholder": {
                color: "rgba(255,255,255,0.85)",
              },
            },
          }}
        />
      </Box>

      {/* 列表区域 */}
      <Box
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          pb: 8,
        }}
      >
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress
              size={28}
              sx={{ color: "#5E7D28" }}
            />
          </Box>
        )}

        {!loading && loadingError && (
          <Typography variant="body2" sx={{ color: "#EF4444", mt: 2 }}>
            {loadingError}
          </Typography>
        )}

        {!loading &&
          !loadingError &&
          filteredPosts.map((p) => {
            const state = interactions[p._id] || {
              upvoted: false,
              downvoted: false,
              bookmarked: false,
            };

            const isGoodPost =
              (p.upvotes ?? 0) >= 5 ||
              (p.bookmarks ?? 0) >= 3 ||
              (p.comments?.length ?? 0) >= 3;

            return (
              <ForumPostCard
                key={p._id}
                title={p.title}
                content={p.content}
                hasMedia={p.hasMedia}
                imageUrl={p.imageUrl}
                authorName={p.authorName || "Anonymous"}
                upvotesCount={p.upvotes ?? 0}
                downvotesCount={p.downvotes ?? 0}
                bookmarksCount={p.bookmarks ?? 0}
                isGoodPost={isGoodPost}
                upvoted={state.upvoted}
                downvoted={state.downvoted}
                bookmarked={state.bookmarked}
                onUpvote={() => handleUpvote(p._id)}
                onDownvote={() => handleDownvote(p._id)}
                onToggleBookmark={() => handleToggleBookmark(p._id)}
                onCardClick={() => handleCardClick(p)}
              />
            );
          })}

        {!loading && !loadingError && filteredPosts.length === 0 && (
          <Typography variant="body2" sx={{ color: "#6B7280", mt: 2 }}>
            No knowledge posts yet. Be the first to share your experience!
          </Typography>
        )}
      </Box>

      {/* 右下角悬浮发帖按钮 */}
      <Fab
        color="primary"
        onClick={() => setCreateOpen(true)}
        sx={{
          position: "fixed",
          right: 24,
          bottom: 80, // 底部导航上方一点
          bgcolor: "#5E7D28",
          "&:hover": { bgcolor: "#46611F" },
        }}
      >
        <AddIcon />
      </Fab>

      <BottomNavBar />

      {/* 帖子详情弹窗 */}
      <Dialog
        open={!!selectedPost}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>{selectedPost?.title || "Post"}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "#4B5563" }}>
            {selectedPost?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* 发表知识贴弹窗 */}
      <Dialog
        open={createOpen}
        onClose={() => !posting && setCreateOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Share your life skill</DialogTitle>
        <DialogContent dividers>
          <Typography
            variant="body2"
            sx={{ color: "#6B7280", mb: 1.5 }}
          >
            Tell others what worked for you. Steps, tips, or even what
            failed.
          </Typography>

          <TextField
            label="Title (optional)"
            fullWidth
            margin="dense"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />

          <TextField
            label="Body *"
            fullWidth
            margin="dense"
            multiline
            minRows={4}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
            helperText="Share your experience, steps, what worked/failed."
          />

          <TextField
            label="Categories (optional)"
            fullWidth
            margin="dense"
            placeholder="e.g. cooking, cleaning, budgeting"
            value={newCategories}
            onChange={(e) => setNewCategories(e.target.value)}
          />

          <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<PhotoCameraIcon />}
              component="label"
              size="small"
            >
              Add photo / video
              <input
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleFileChange}
              />
            </Button>

            {newFile && (
              <Typography variant="caption" sx={{ color: "#4B5563" }}>
                {newFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCreateOpen(false)}
            disabled={posting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={posting || !newBody.trim()}
          >
            {posting ? "Posting..." : "Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForumPage;
