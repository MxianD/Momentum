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

// 小工具：从帖子对象中“尽可能”找出作者名字
function getAuthorName(post) {
  if (post.author && typeof post.author === "object" && post.author.name) {
    // 后端 populate 出来的 { _id, name }
    return post.author.name;
  }
  if (typeof post.authorName === "string") return post.authorName;
  if (post.user && post.user.name) return post.user.name;
  if (typeof post.userName === "string") return post.userName;

  // 如果 author 是一个字符串而且不是很短（大概率是 ObjectId），就不要展示
  if (typeof post.author === "string" && post.author.length < 20) {
    return post.author;
  }

  return "Anonymous";
}

// 小工具：从帖子对象中读点赞数量
function getLikesCount(post) {
  if (typeof post.likesCount === "number") return post.likesCount;
  if (Array.isArray(post.likes)) return post.likes.length;
  if (typeof post.upvotes === "number") return post.upvotes;
  return 0;
}

function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [interactions, setInteractions] = useState({});
  const [search, setSearch] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState("");

  // 加载帖子
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

        // 初始化交互状态
        const init = {};
        data.forEach((p) => {
          init[p._id] = {
            upvoted: false,
            downvoted: false,
            bookmarked: false,
          };
        });
        setInteractions(init);
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

// 点赞：从后端拿“最新的 post”，然后用它更新本地 posts
const handleUpvote = async (id) => {
  // 先更新交互状态（高亮按钮）
  setInteractions((prev) => {
    const prevState =
      prev[id] || {
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

  try {
    const res = await fetch(`${API_BASE_URL}/forum/posts/${id}/upvote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.error("Upvote failed:", res.status);
      return;
    }

    // ✅ 关键：后端返回的是“更新后的这一条帖子”
    // 例如：{ _id, title, content, likesCount, author: {...}, ... }
    const updatedPost = await res.json();

    // 用后端返回的这条 post 覆盖掉本地 posts 里面对应的那一条
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  } catch (err) {
    console.error("Failed to upvote:", err);
  }
};


  // 点踩：这里只控制 UI 状态，不动点赞数量
  const handleDownvote = async (id) => {
    setInteractions((prev) => {
      const prevState =
        prev[id] || {
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
      await fetch(`${API_BASE_URL}/forum/posts/${id}/downvote`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to downvote:", err);
    }
  };

  // 收藏
  const handleToggleBookmark = async (id) => {
    setInteractions((prev) => {
      const prevState =
        prev[id] || {
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
      await fetch(`${API_BASE_URL}/forum/posts/${id}/bookmark`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to bookmark:", err);
    }
  };

  // 搜索过滤
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

      {/* 列表内容 */}
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

            const authorName = getAuthorName(p);
            const likesCount = getLikesCount(p);

            return (
              <ForumPostCard
                key={p._id}
                title={p.title}
                content={p.content}
                hasMedia={p.hasMedia}
                authorName={authorName}
                likesCount={likesCount}
                upvoted={state.upvoted}
                downvoted={state.downvoted}
                bookmarked={state.bookmarked}
                onLike={() => handleUpvote(p._id)}
                onDislike={() => handleDownvote(p._id)}
                onToggleFavorite={() => handleToggleBookmark(p._id)}
                onCardClick={() => handleCardClick(p)}
              />
            );
          })}

        {!loading && !loadingError && filteredPosts.length === 0 && (
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
        <DialogTitle>{selectedPost?.title || "Post"}</DialogTitle>
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
