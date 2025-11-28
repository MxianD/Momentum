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
  Paper,
  Stack,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import BottomNavBar from "../components/BottomNavBar.jsx";
import ForumPostCard from "../components/ForumPostCard.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 判断某个 userId 是否在一个 ObjectId 数组中
const isUserInArray = (arr, userId) => {
  if (!Array.isArray(arr)) return false;
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

  // ✨ 新增：发帖相关状态
  const [createTitle, setCreateTitle] = useState("");
  const [createContent, setCreateContent] = useState("");
  const [createCategory, setCreateCategory] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

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

  // 加载帖子
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setLoadingError("");
        const res = await fetch(`${API_BASE_URL}/forum/posts`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const data = await res.json();
        setPosts(data);

        const initInteractions = {};
        data.forEach((p) => {
          initInteractions[p._id] = {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };
        });
        setInteractions(initInteractions);
      } catch (err) {
        console.error("Failed to load posts:", err);
        setLoadingError("Failed to load posts from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleCardClick = (post) => setSelectedPost(post);
  const handleCloseDialog = () => setSelectedPost(null);

  // 统一一个小工具函数，用后端返回的 post 更新到本地 posts 里面
  const applyPostUpdate = (updatedPost) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  // 👍 点赞
  const handleUpvote = async (id) => {
    if (!currentUser?._id) {
      alert("请先登录再点赞");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/upvote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser._id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Upvote failed: ${res.status}`);
      }

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);

        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };

          const upvoted = isUserInArray(
            updatedPost.upvotedBy,
            currentUser._id
          );
          const downvoted = isUserInArray(
            updatedPost.downvotedBy,
            currentUser._id
          );

          return {
            ...prev,
            [id]: {
              ...prevState,
              upvoted,
              downvoted,
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
    if (!currentUser?._id) {
      alert("请先登录再点踩");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${id}/downvote`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Downvote failed: ${res.status}`);
      }

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);

        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };

          const upvoted = isUserInArray(
            updatedPost.upvotedBy,
            currentUser._id
          );
          const downvoted = isUserInArray(
            updatedPost.downvotedBy,
            currentUser._id
          );

          return {
            ...prev,
            [id]: {
              ...prevState,
              upvoted,
              downvoted,
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
    if (!currentUser?._id) {
      alert("请先登录再收藏");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/forum/posts/${id}/bookmark`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Bookmark failed: ${res.status}`);
      }

      const updatedPost = data.post;
      if (updatedPost) {
        applyPostUpdate(updatedPost);

        setInteractions((prev) => {
          const prevState = prev[id] || {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };

          const bookmarked = isUserInArray(
            updatedPost.bookmarkedBy,
            currentUser._id
          );

          return {
            ...prev,
            [id]: {
              ...prevState,
              bookmarked,
            },
          };
        });
      }
    } catch (err) {
      console.error("Failed to bookmark:", err);
      alert(err.message || "Failed to bookmark");
    }
  };

  /**
   * ✨ 发帖：只在前端限制 category 必填
   * 这里用 JSON 发送，如果你后端已经支持 categories，会存进去；
   * 即使后端不处理这个字段，也不会报错。
   */
  const canSubmitPost =
    createContent.trim().length > 0 &&
    createCategory.trim().length > 0 &&
    !posting;

  const handleCreatePost = async () => {
    if (!currentUser?._id) {
      alert("请先登录再发帖");
      return;
    }
    if (!createContent.trim()) {
      setPostError("Content is required.");
      return;
    }
    if (!createCategory.trim()) {
      setPostError("Category is required.");
      return;
    }

    setPostError("");
    setPosting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/forum/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: createTitle.trim(),
          content: createContent.trim(),
          userId: currentUser._id,
          hasMedia: false,
          source: "manual",
          categories: createCategory.trim(), // 前端保证必填
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.post) {
        console.error("Create post failed:", data);
        setPostError(
          data.error || "Failed to publish post. Please try again."
        );
        setPosting(false);
        return;
      }

      // 新帖子加到列表最前面
      setPosts((prev) => [data.post, ...prev]);

      // 清空表单
      setCreateTitle("");
      setCreateContent("");
      setCreateCategory("");
      setPosting(false);
    } catch (err) {
      console.error("Error creating post:", err);
      setPostError("Network error. Please try again.");
      setPosting(false);
    }
  };

  // 搜索 + 过滤：只展示非 checkin 的帖子（知识贴）
  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => p.source !== "checkin");
    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.content?.toLowerCase().includes(q)
    );
  }, [posts, search]);

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

      {/* ➕ 发帖区域 */}
      <Box sx={{ px: { xs: 2, md: 4 }, mb: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ fontWeight: 600, mb: 1 }}
          >
            Share your knowledge
          </Typography>

          <Stack spacing={1.2}>
            <TextField
              size="small"
              label="Title (optional)"
              fullWidth
              value={createTitle}
              onChange={(e) => setCreateTitle(e.target.value)}
            />

            <TextField
              label="What did you learn or what worked for you?"
              multiline
              minRows={3}
              fullWidth
              value={createContent}
              onChange={(e) => setCreateContent(e.target.value)}
            />

            <TextField
              size="small"
              label="Category (required, e.g. cooking, cleaning)"
              placeholder="cooking, cleaning, budgeting..."
              fullWidth
              value={createCategory}
              onChange={(e) => setCreateCategory(e.target.value)}
            />

            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={1}
            >
              {postError && (
                <Typography
                  variant="caption"
                  sx={{ color: "#EF4444", mr: 1 }}
                >
                  {postError}
                </Typography>
              )}
              <Button
                variant="contained"
                onClick={handleCreatePost}
                disabled={!canSubmitPost}
                sx={{ textTransform: "none", borderRadius: 999 }}
              >
                {posting ? "Posting..." : "Post"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
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
            <CircularProgress size={28} />
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

            // 解析 categories 传给卡片（如果你新版 ForumPostCard 支持的话）
            let categories = [];
            if (Array.isArray(p.categories)) {
              categories = p.categories;
            } else if (typeof p.categories === "string") {
              categories = p.categories
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean);
            }

            return (
              <ForumPostCard
                key={p._id}
                title={p.title}
                content={p.content}
                hasMedia={p.hasMedia}
                authorName={p.authorName || "Anonymous"}
                upvotesCount={p.upvotes ?? 0}
                downvotesCount={p.downvotes ?? 0}
                bookmarksCount={p.bookmarks ?? 0}
                upvoted={state.upvoted}
                downvoted={state.downvoted}
                bookmarked={state.bookmarked}
                onUpvote={() => handleUpvote(p._id)}
                onDownvote={() => handleDownvote(p._id)}
                onToggleBookmark={() => handleToggleBookmark(p._id)}
                onCardClick={() => handleCardClick(p)}
                categories={categories}
                isGoodPost={p.isGoodPost} // 如果你后端有这个字段的话
                comments={p.comments || []} // 如果 ForumPostCard 用得到
              />
            );
          })}

        {!loading && !loadingError && filteredPosts.length === 0 && (
          <Typography variant="body2" sx={{ color: "#6B7280", mt: 2 }}>
            No posts found. Try a different keyword.
          </Typography>
        )}
      </Box>

      <BottomNavBar />

      {/* 帖子详情弹窗（保持你原来的样式） */}
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
          {selectedPost?.hasMedia && (
            <Box sx={{ display: "flex", gap: 1.2, mt: 2 }}>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForumPage;
