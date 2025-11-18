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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import BottomNavBar from "../components/BottomNavBar.jsx";
import ForumPostCard from "../components/ForumPostCard.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");
  // 判断某个 userId 是否在一个 ObjectId 数组中
  const isUserInArray = (arr, userId) => {
    if (!Array.isArray(arr)) return false;
    return arr.some((u) => {
      // 可能是 string，也可能是 {_id: "..."}
      if (typeof u === "string") return u === userId;
      if (u && typeof u === "object") return u._id === userId;
      return false;
    });
  };

  // 当前用户（点赞只用于前端状态，不做防刷）
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

  // ✅ 统一一个小工具函数，用后端返回的 post 更新到本地 posts 里面
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
      // 更新 posts 里的那条数据（点赞数、数组等）
      applyPostUpdate(updatedPost);

      // 根据后端返回的 upvotedBy / downvotedBy 来更新交互状态
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
    const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/downvote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: currentUser._id }),
    });

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
    const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/bookmark`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: currentUser._id }),
    });

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


  // 搜索过滤
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
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
            return (
              <ForumPostCard
                key={p._id}
                title={p.title}
                content={p.content}
                hasMedia={p.hasMedia}
                // 新增：把作者和点赞数传给卡片
                authorName={p.authorName || "Anonymous"}
                upvotesCount={p.upvotes ?? 0}
                // 交互状态
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
            No posts found. Try a different keyword.
          </Typography>
        )}
      </Box>

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
