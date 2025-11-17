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

// 开发阶段后端地址，部署后可以抽到环境变量里
const API_BASE_URL = "http://localhost:3001/api";

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [interactions, setInteractions] = useState({}); // { [id]: { upvoted, downvoted, bookmarked } }
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  // 加载后端帖子
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setLoadingError("");
        const res = await fetch(`${API_BASE_URL}/forum/posts`);
        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`);
        }
        const data = await res.json();
        setPosts(data);

        // 初始化交互状态（默认都没点过）
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

  const handleCardClick = (post) => {
    setSelectedPost(post);
  };

  const handleCloseDialog = () => {
    setSelectedPost(null);
  };

  // 点赞
  const handleUpvote = async (id) => {
    setInteractions((prev) => {
      const prevState = prev[id] || {
        upvoted: false,
        downvoted: false,
        bookmarked: false,
      };
      const newUp = !prevState.upvoted;
      const newDown = newUp ? false : prevState.downvoted;
      return {
        ...prev,
        [id]: {
          ...prevState,
          upvoted: newUp,
          downvoted: newDown,
        },
      };
    });

    // 只有从“未点赞”变成“点赞”时才调后端接口（简单 +1）
    try {
      const current = interactions[id];
      if (!current || !current.upvoted) {
        await fetch(`${API_BASE_URL}/forum/posts/${id}/upvote`, {
          method: "POST",
        });
      }
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  };

  // 点踩
  const handleDownvote = async (id) => {
    setInteractions((prev) => {
      const prevState = prev[id] || {
        upvoted: false,
        downvoted: false,
        bookmarked: false,
      };
      const newDown = !prevState.downvoted;
      const newUp = newDown ? false : prevState.upvoted;
      return {
        ...prev,
        [id]: {
          ...prevState,
          upvoted: newUp,
          downvoted: newDown,
        },
      };
    });

    try {
      const current = interactions[id];
      if (!current || !current.downvoted) {
        await fetch(`${API_BASE_URL}/forum/posts/${id}/downvote`, {
          method: "POST",
        });
      }
    } catch (err) {
      console.error("Failed to downvote:", err);
    }
  };

  // 收藏
  const handleToggleBookmark = async (id) => {
    setInteractions((prev) => {
      const prevState = prev[id] || {
        upvoted: false,
        downvoted: false,
        bookmarked: false,
      };
      const newBookmark = !prevState.bookmarked;
      return {
        ...prev,
        [id]: {
          ...prevState,
          bookmarked: newBookmark,
        },
      };
    });

    try {
      const current = interactions[id];
      if (!current || !current.bookmarked) {
        await fetch(`${API_BASE_URL}/forum/posts/${id}/bookmark`, {
          method: "POST",
        });
      }
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  // 搜索过滤（在前端做）
  const filteredPosts = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
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
      {/* 顶部：搜索栏 */}
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

      {/* 列表内容区域 */}
      <Box
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          pb: 8, // 给底部导航留空间
        }}
      >
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 4,
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && loadingError && (
          <Typography
            variant="body2"
            sx={{ color: "#EF4444", mt: 2 }}
          >
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

        {!loading &&
          !loadingError &&
          filteredPosts.length === 0 && (
            <Typography
              variant="body2"
              sx={{
                color: "#6B7280",
                mt: 2,
              }}
            >
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
        <DialogTitle>
          {selectedPost?.title || "Post"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ color: "#4B5563" }}>
            {selectedPost?.content}
          </Typography>
          {selectedPost?.hasMedia && (
            <Box
              sx={{
                display: "flex",
                gap: 1.2,
                mt: 2,
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ForumPage;
