// src/pages/FriendsPage.jsx
import React, { useEffect, useState, useMemo } from "react";
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
} from "@mui/material";

import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SendIcon from "@mui/icons-material/Send";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

/**
 * 判断 post 是否有有效的 category：
 * - categories 为数组，长度 > 0
 * - 或为字符串，拆分后有至少一个非空 tag
 */
function hasValidCategory(post) {
  const c = post.categories;
  if (!c) return false;
  if (Array.isArray(c)) return c.length > 0;
  if (typeof c === "string") {
    const tags = c
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return tags.length > 0;
  }
  return false;
}

/**
 * 从 post 上提取 category tags（字符串数组），用于展示 chip
 */
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

/**
 * 把帖子按日期分组，posts 已经是按时间升序排序
 * 返回形如 [{ dateLabel: 'Nov 27', posts: [] }, ...]
 */
function groupPostsByDay(posts) {
  const map = new Map();

  posts.forEach((p) => {
    const d = p.createdAt ? new Date(p.createdAt) : new Date();
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }); // e.g. "Nov 27"

    if (!map.has(label)) map.set(label, []);
    map.get(label).push(p);
  });

  const result = Array.from(map.entries()).map(([dateLabel, list]) => ({
    dateLabel,
    posts: list,
  }));

  // 根据每组第一条 post 的时间，从早到晚排序
  result.sort((a, b) => {
    const t1 = a.posts[0].createdAt
      ? new Date(a.posts[0].createdAt).getTime()
      : 0;
    const t2 = b.posts[0].createdAt
      ? new Date(b.posts[0].createdAt).getTime()
      : 0;
    return t1 - t2; // earliest first
  });

  return result;
}

function FriendsPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [posts, setPosts] = useState([]);
  const [commentDrafts, setCommentDrafts] = useState({}); // 每个 postId → 当前输入的评论
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  // 加载好友列表 + 所有帖子，然后在前端过滤
  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [friendsRes, postsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${userId}/friends`),
          fetch(`${API_BASE_URL}/forum/posts`),
        ]);

        const friendsData = await friendsRes.json().catch(() => ({}));
        const postsData = await postsRes.json().catch(() => []);

        if (!friendsRes.ok) {
          console.error("Failed to fetch friends:", friendsData);
        }
        if (!postsRes.ok) {
          console.error("Failed to fetch posts:", postsData);
          throw new Error("Posts request failed");
        }

        // 好友列表（格式可能是 {friends: []} 或直接数组，这里都兼容一下）
        const friendsList = Array.isArray(friendsData.friends)
          ? friendsData.friends
          : Array.isArray(friendsData)
          ? friendsData
          : [];
        setFriends(friendsList);

        const friendIds = new Set(friendsList.map((f) => f._id));

        // 过滤规则：
        // 1. 只要 checkin 帖子：p.source === "checkin"
        // 2. 作者必须是自己或好友
        // 3. 必须有 category
        const visiblePosts = (postsData || [])
          .filter((p) => p.source === "checkin") // ⭐ 只要 checkin
          // .filter(hasValidCategory) // ⭐ 有 category 才展示
          .filter((p) => {
            const a = p.author;
            const authorId =
              typeof a === "string" ? a : a?._id || a?.id || null;
            if (!authorId) return false;
            return authorId === userId || friendIds.has(authorId);
          })
          // 时间从早到晚
          .sort((a, b) => {
            const t1 = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const t2 = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return t1 - t2;
          });

        setPosts(visiblePosts);
      } catch (err) {
        console.error("Error loading friends/posts for FriendsPage:", err);
        setError("Failed to load posts from you and your friends.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // 分组：按日期
  const grouped = useMemo(() => groupPostsByDay(posts), [posts]);

  const handleCommentChange = (postId, value) => {
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F2F2F2",
        display: "flex",
        flexDirection: "column",
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
          Friends
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}
        >
          See check-ins from you and your friends
        </Typography>
      </Box>

      {/* 时间线 + 卡片 */}
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
            Loading check-ins...
          </Typography>
        )}

        {!loading && error && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: "#EF4444" }}
          >
            {error}
          </Typography>
        )}

        {!loading && !error && grouped.length === 0 && (
          <Typography
            variant="body2"
            sx={{ mt: 2, color: "#6B7280" }}
          >
            No check-ins with categories yet. Start a challenge and tag
            your posts!
          </Typography>
        )}

        {!loading &&
          !error &&
          grouped.map((group, groupIdx) => (
            <Box
              key={group.dateLabel}
              sx={{ display: "flex", alignItems: "flex-start", mb: 3 }}
            >
              {/* 左侧时间线 */}
              <Box
                sx={{
                  width: 40,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* 日期 */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: "#111827",
                    mb: 1,
                  }}
                >
                  {group.dateLabel}
                </Typography>

                {/* 圆点 */}
                <Box
                  sx={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid #4B5563",
                    bgcolor: "#F2F2F2",
                  }}
                />

                {/* 竖虚线 */}
                {groupIdx < grouped.length - 1 && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      width: 2,
                      mt: 0.5,
                      borderRight: "2px dashed #D1D5DB",
                    }}
                  />
                )}
              </Box>

              {/* 右侧当天所有卡片 */}
              <Box sx={{ flexGrow: 1 }}>
                {group.posts.map((p) => {
                  const postId = p._id;
                  const d = p.createdAt ? new Date(p.createdAt) : null;
                  const timeLabel = d
                    ? d.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "";
                  const authorName =
                    p.authorName ||
                    (typeof p.author === "object" && p.author?.name) ||
                    "Anonymous";

                  const mediaSrc = p.imageUrl
                    ? p.imageUrl.startsWith("http")
                      ? p.imageUrl
                      : `${API_ORIGIN}${p.imageUrl}`
                    : null;

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
                      {/* media */}
                      <Box
                        sx={{
                          height: 160,
                          bgcolor: "#E5E5E5",
                          ...(mediaSrc && {
                            p: 0,
                          }),
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

                      {/* 文本 + 作者 + 分类 tag */}
                      <Box sx={{ px: 2, py: 1.4 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              {p.title || "Check-in"}
                            </Typography>
                            {timeLabel && (
                              <Typography
                                variant="caption"
                                sx={{ color: "#9CA3AF" }}
                              >
                                {timeLabel}
                              </Typography>
                            )}
                          </Stack>

                          <Avatar
                            sx={{
                              width: 28,
                              height: 28,
                              bgcolor: "#111827",
                              fontSize: 13,
                            }}
                          >
                            {authorName?.[0] || "A"}
                          </Avatar>
                        </Stack>

                        <Typography
                          variant="body2"
                          sx={{ color: "#4B5563", mb: 0.8 }}
                        >
                          {p.content}
                        </Typography>

                        {/* 分类标签 */}
                        {tags.length > 0 && (
                          <Stack direction="row" spacing={0.5} sx={{ mb: 0.8 }}>
                            {tags.slice(0, 4).map((tag) => (
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

                        {/* 点赞 + 评论输入区 */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mt: 0.5,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                            sx={{ mr: 1.5 }}
                          >
                            <FavoriteBorderIcon
                              sx={{ fontSize: 20, color: "#EC4899" }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ color: "#6B7280" }}
                            >
                              {p.upvotes ?? 0}
                            </Typography>
                          </Stack>

                          <TextField
                            size="small"
                            placeholder="Comment..."
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
                            <SendIcon
                              sx={{ fontSize: 18, color: "#7E9B3C" }}
                            />
                          </IconButton>
                        </Box>

                        {/* 已有评论 */}
                        {comments.length > 0 && (
                          <>
                            <Divider sx={{ my: 1 }} />
                            <Box>
                              {comments.map((c) => (
                                <Box key={c.id} sx={{ mb: 0.4 }}>
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
                          </>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            </Box>
          ))}
      </Box>

      <BottomNavBar />
    </Box>
  );
}

export default FriendsPage;
