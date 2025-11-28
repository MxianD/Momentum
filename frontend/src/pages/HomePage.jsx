// src/pages/HomePage.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Avatar,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 现在不再使用内置默认 challenge，留空即可
const systemGoals = [];

// 根据 challenge 标题返回每次打卡的加分
function getPointsForChallengeTitle(title) {
  if (!title) return 0;
  if (title === "Everyday Meditation") return 6;
  if (title === "Stay Hydrated") return 5;
  if (title === "Morning Stretch") return 3;
  return 0;
}

function GoalCard({
  title,
  subtitle,
  streak,
  points,
  checkedInToday,
  onCheckIn,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 1.4,
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "#F5F5F5",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.6,
          py: 1.2,
          bgcolor: "#E3E3E3",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 12,
              bgcolor: "#F8F8F8",
            }}
          />
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "#111827" }}
          >
            {title}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 1.6,
          py: 0.9,
          bgcolor: "#F5F5F5",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Stack direction="row" spacing={-0.8}>
            {[0, 1, 2].map((i) => (
              <Avatar
                key={i}
                sx={{
                  width: 18,
                  height: 18,
                  border: "1px solid #E5E5E5",
                  bgcolor: "#B3B3B3",
                }}
              />
            ))}
          </Stack>
          <Typography
            variant="caption"
            sx={{ color: "#6B7280", whiteSpace: "nowrap" }}
          >
            {subtitle}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.3 }}>
            <Typography
              variant="caption"
              sx={{ color: "#111827", fontWeight: 500 }}
            >
              {/* 显示每次打卡加分，若不存在则退回 streak 或 0 */}
              {points ?? streak ?? 0}
            </Typography>
            <FlashOnIcon sx={{ fontSize: 14 }} />
          </Box>

          <Button
            size="small"
            onClick={onCheckIn}
            disabled={checkedInToday}
            sx={{
              textTransform: "none",
              borderRadius: "999px",
              bgcolor: checkedInToday ? "#9CA3AF" : "#000000",
              color: "#FFFFFF",
              px: 2.2,
              py: 0.3,
              fontSize: 11,
              fontWeight: 600,
              minWidth: 0,
              cursor: checkedInToday ? "default" : "pointer",
              opacity: checkedInToday ? 0.8 : 1,
              "&:hover": {
                bgcolor: checkedInToday ? "#9CA3AF" : "#111111",
              },
            }}
          >
            {checkedInToday ? "Checked" : "Check in"}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}

function HomePage() {
  const [goals, setGoals] = useState(systemGoals);
  const [currentUser, setCurrentUser] = useState(null);

  const [activeGoalId, setActiveGoalId] = useState(null);
  const [checkInNote, setCheckInNote] = useState("");
  const [posting, setPosting] = useState(false);

  // 排行榜相关
  const [ranking, setRanking] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [rankingError, setRankingError] = useState("");
  const [showCount, setShowCount] = useState(5); // 显示前 N 名

  // 好友相关
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState("");

  // “添加好友”弹窗 & 所有用户列表
  const [friendsDialogOpen, setFriendsDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [allUsersError, setAllUsersError] = useState("");
  const [addingId, setAddingId] = useState(null); // 正在添加的 userId

  const activeGoal = goals.find((g) => g.id === activeGoalId) || null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);

  const userId = currentUser?._id;

  // 拉取用户加入的挑战 -> 转成 goals
  useEffect(() => {
    if (!userId) return;

    const loadJoined = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/challenges/joined/${userId}`);
        if (!res.ok) {
          console.error("Failed to load user challenges");
          return;
        }
        const data = await res.json(); // UserChallenge[]

        const challengeGoals = data.map((uc) => ({
          id: uc._id,
          challengeId: uc.challenge._id,
          title: uc.challenge.title,
          subtitle: "Challenge with your friends",
          streak: uc.streak,
          checkedInToday: uc.checkedInToday,
          lastNote: uc.lastNote,
          isSystem: false,
          // 每次打卡加分（6 / 5 / 3）
          pointsPerCheckin: getPointsForChallengeTitle(uc.challenge.title),
        }));

        setGoals((prev) => {
          const system = prev.filter((g) => g.isSystem);
          return [...system, ...challengeGoals];
        });
      } catch (err) {
        console.error("Error loading joined challenges", err);
      }
    };

    loadJoined();
  }, [userId]);

  // 加载总排行
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setRankingError("");
        const res = await fetch(`${API_BASE_URL}/forum/ranking/total`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const data = await res.json(); // [{ userId, name, points, rank }, ...]

        setRanking(data || []);

        if (userId && Array.isArray(data)) {
          const mine = data.find((r) => r.userId === userId);
          setMyRank(mine || null);
        }
      } catch (err) {
        console.error("Failed to load total ranking:", err);
        setRankingError("Failed to load ranking.");
      }
    };

    if (userId) {
      fetchRanking();
    }
  }, [userId]);

  // 加载好友列表
  useEffect(() => {
    if (!userId) return;

    const loadFriends = async () => {
      try {
        setFriendsLoading(true);
        setFriendsError("");
        const res = await fetch(`${API_BASE_URL}/users/${userId}/friends`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          console.error("Failed to fetch friends:", data);
          setFriendsError("Failed to load friends.");
          setFriends([]);
          return;
        }

        const list = Array.isArray(data.friends)
          ? data.friends
          : Array.isArray(data)
          ? data
          : [];
        setFriends(list);
      } catch (err) {
        console.error("Error loading friends:", err);
        setFriendsError("Failed to load friends.");
      } finally {
        setFriendsLoading(false);
      }
    };

    loadFriends();
  }, [userId]);

  const friendsCount = friends.length;
  const friendIdSet = new Set(friends.map((f) => f._id));

  // 打开“Add friends” 弹窗时，加载所有用户列表
  const handleOpenFriendsDialog = async () => {
    setFriendsDialogOpen(true);

    if (allUsers.length > 0 || !userId) return; // 已经加载过就不再请求

    try {
      setAllUsersLoading(true);
      setAllUsersError("");

      // GET /api/users/all
      const res = await fetch(`${API_BASE_URL}/users/all`);
      const data = await res.json().catch(() => []);

      if (!res.ok) {
        console.error("Failed to fetch all users:", data);
        setAllUsersError("Failed to load users.");
        setAllUsers([]);
        return;
      }

      setAllUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading all users:", err);
      setAllUsersError("Failed to load users.");
      setAllUsers([]);
    } finally {
      setAllUsersLoading(false);
    }
  };

  const handleCloseFriendsDialog = () => {
    setFriendsDialogOpen(false);
  };

  // 点击某个用户的「Add」按钮
  const handleAddFriend = async (targetId) => {
    if (!userId || !targetId || targetId === userId) return;

    try {
      setAddingId(targetId);
      // POST /api/users/:userId/friends
      const res = await fetch(`${API_BASE_URL}/users/${userId}/friends`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: targetId }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Failed to add friend:", data);
        alert("Failed to add friend.");
        return;
      }

      // 成功后更新 friends 列表（兼容两种返回格式）
      const list = Array.isArray(data.friends)
        ? data.friends
        : Array.isArray(data)
        ? data
        : [];
      if (list.length > 0) {
        setFriends(list);
      } else {
        // 如果后端没返回完整列表，就手动在前端追加一个
        const newUser = allUsers.find((u) => u._id === targetId) || null;
        if (newUser) {
          setFriends((prev) => [...prev, newUser]);
        }
      }
    } catch (err) {
      console.error("Error adding friend:", err);
      alert("Network error when adding friend.");
    } finally {
      setAddingId(null);
    }
  };

  const handleOpenCheckInDialog = (id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.checkedInToday) return;
    setActiveGoalId(id);
    setCheckInNote("");
  };

  const handleCloseDialog = () => {
    if (posting) return;
    setActiveGoalId(null);
    setCheckInNote("");
  };

  // Check in：对系统 goal，用 /forum/posts 发“checkin”帖；对 challenge goal，调用 /challenges/:id/checkin
  const handleConfirmCheckIn = async () => {
    if (!activeGoalId || !checkInNote.trim()) return;
    const goal = goals.find((g) => g.id === activeGoalId);
    if (!goal) return;

    try {
      setPosting(true);

      if (!goal.isSystem) {
        if (!userId || !goal.challengeId) {
          alert("User or challenge missing.");
          setPosting(false);
          return;
        }

        const res = await fetch(
          `${API_BASE_URL}/challenges/${goal.challengeId}/checkin`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, note: checkInNote }),
          }
        );

        if (!res.ok) {
          console.error("Checkin failed:", res.status);
          alert("Failed to post progress. Please try again.");
          setPosting(false);
          return;
        }

        const { userChallenge } = await res.json();

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== activeGoalId) return g;
            return {
              ...g,
              streak: userChallenge.streak,
              checkedInToday: userChallenge.checkedInToday,
              lastNote: userChallenge.lastNote,
              // pointsPerCheckin 保持不变
            };
          })
        );
      } else {
        // 系统 goal：发一条 check-in 帖子
        await fetch(`${API_BASE_URL}/forum/posts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: goal.title,
            content: checkInNote,
            hasMedia: false,
            userId,
            source: "checkin",
          }),
        });

        setGoals((prev) =>
          prev.map((g) => {
            if (g.id !== activeGoalId) return g;
            return {
              ...g,
              checkedInToday: true,
              streak: g.streak + 1,
              lastNote: checkInNote,
            };
          })
        );
      }

      setPosting(false);
      handleCloseDialog();
    } catch (err) {
      console.error("Error when posting progress:", err);
      alert("Network error. Please try again.");
      setPosting(false);
    }
  };

  const goalsLeft = goals.filter((g) => !g.checkedInToday).length;
  const displayName = currentUser?.name || "Amy";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 顶部绿色区域 + 总排行 + Add friends */}
      <Box
        sx={{
          bgcolor: "#516E1F",
          color: "#FFFFFF",
          px: { xs: 2, md: 4 },
          pt: { xs: 3, md: 4 },
          pb: { xs: 3, md: 4 },
          borderBottomLeftRadius: { xs: 24, md: 32 },
          borderBottomRightRadius: { xs: 24, md: 32 },
          boxShadow: "0 12px 25px rgba(0,0,0,0.25)",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            fontSize: 22,
            mb: 1,
          }}
        >
          Hello, {displayName}!
        </Typography>

        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Total ranking
        </Typography>

        {rankingError && (
          <Typography variant="caption" sx={{ color: "#FCA5A5" }}>
            {rankingError}
          </Typography>
        )}

        {!rankingError && ranking.length > 0 && (
          <>
            {myRank ? (
              <Typography variant="body2" sx={{ mb: 1 }}>
                You are #{myRank.rank} with{" "}
                <strong>{myRank.points}</strong> pts.
              </Typography>
            ) : (
              <Typography variant="body2" sx={{ mb: 1 }}>
                Join challenges and share posts to earn points!
              </Typography>
            )}

            <Box
              sx={{
                mt: 0.5,
                borderRadius: 999,
                bgcolor: "rgba(0,0,0,0.15)",
                p: 1,
              }}
            >
              {ranking.slice(0, showCount).map((r, index) => {
                const isTop1 = r.rank === 1;
                const isMe = userId && r.userId === userId;

                return (
                  <Box
                    key={r.userId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: index === showCount - 1 ? 0 : 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        textAlign: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        mr: 1,
                      }}
                    >
                      {isTop1 ? "👑" : r.rank}
                    </Box>

                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        mr: 1,
                        bgcolor: isMe ? "#FBBF24" : "rgba(0,0,0,0.35)",
                        fontSize: 11,
                      }}
                    >
                      {(r.name || "A")[0]}
                    </Avatar>

                    <Box sx={{ flexGrow: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 0.3,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: isMe ? "#FEF9C3" : "rgba(255,255,255,0.9)",
                            fontWeight: isMe ? 700 : 500,
                          }}
                        >
                          {isMe ? "You" : r.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.3,
                            color: "rgba(255,255,255,0.9)",
                          }}
                        >
                          {r.points}
                          <span style={{ fontSize: 10 }}>⚡</span>
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          height: 6,
                          borderRadius: 999,
                          bgcolor: "rgba(0,0,0,0.35)",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            height: "100%",
                            width: `${
                              ranking[0]
                                ? Math.round(
                                    (r.points / ranking[0].points) * 100
                                  )
                                : 0
                            }%`,
                            bgcolor: isTop1
                              ? "#FACC15"
                              : isMe
                              ? "#A5B4FC"
                              : "#E5F2C0",
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>

            {showCount < ranking.length && (
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  onClick={() =>
                    setShowCount((prev) => Math.min(prev + 5, ranking.length))
                  }
                  sx={{
                    textTransform: "none",
                    fontSize: 12,
                    color: "#EEF2FF",
                    px: 1.5,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.4)",
                  }}
                >
                  Show next 5
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Add friends 概览条 */}
        <Box
          sx={{
            mt: 2,
            p: 1.1,
            borderRadius: 999,
            bgcolor: "rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <GroupAddIcon sx={{ fontSize: 18, color: "#E5F2C0" }} />
            <Box>
              <Typography
                variant="caption"
                sx={{ color: "#E5E7EB", display: "block" }}
              >
                Friends
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: "#F9FAFB", fontWeight: 600 }}
              >
                {friendsLoading
                  ? "Loading..."
                  : friendsCount > 0
                  ? `${friendsCount} friends`
                  : "No friends yet"}
              </Typography>
              {friendsError && (
                <Typography
                  variant="caption"
                  sx={{ color: "#FCA5A5", display: "block" }}
                >
                  {friendsError}
                </Typography>
              )}
            </Box>
          </Stack>

          <Button
            size="small"
            onClick={handleOpenFriendsDialog}
            sx={{
              textTransform: "none",
              borderRadius: 999,
              px: 1.8,
              py: 0.3,
              fontSize: 11,
              fontWeight: 600,
              bgcolor: "#F9FAFB",
              color: "#111827",
              "&:hover": {
                bgcolor: "#E5E7EB",
              },
            }}
          >
            Add friends
          </Button>
        </Box>
      </Box>

      {/* 中间白色内容区域：goals */}
      <Box
        sx={{
          flexGrow: 1,
          bgcolor: "#F2F2F2",
          px: { xs: 2, md: 4 },
          pt: 2,
          pb: 8,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.2,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthOutlinedIcon
              sx={{ fontSize: 18, color: "#4B5563" }}
            />
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "#111827" }}
            >
              {goalsLeft} Goals left for today
            </Typography>
          </Stack>

          <IconButton size="small">
            <EditOutlinedIcon sx={{ fontSize: 18, color: "#4B5563" }} />
          </IconButton>
        </Box>

        {goals.map((g) => (
          <GoalCard
            key={g.id}
            title={g.title}
            subtitle={g.subtitle}
            streak={g.streak}
            points={
              g.pointsPerCheckin ?? getPointsForChallengeTitle(g.title)
            }
            checkedInToday={g.checkedInToday}
            onCheckIn={() => handleOpenCheckInDialog(g.id)}
          />
        ))}
      </Box>

      {/* 打卡弹窗 */}
      <Dialog open={!!activeGoal} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>
          {activeGoal ? `Check in - ${activeGoal.title}` : "Check in"}
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" sx={{ mb: 1.5, color: "#6B7280" }}>
            Share your progress for today. What did you do for this challenge?
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="E.g. Drank 6 cups of water today..."
            value={checkInNote}
            onChange={(e) => setCheckInNote(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={posting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmCheckIn}
            variant="contained"
            disabled={!checkInNote.trim() || posting}
          >
            {posting ? "Posting..." : "Post progress"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add friends 弹窗 */}
      <Dialog
        open={friendsDialogOpen}
        onClose={handleCloseFriendsDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Select friends</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 400 }}>
          {allUsersLoading && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}

          {!allUsersLoading && allUsersError && (
            <Typography variant="body2" sx={{ color: "#EF4444", mt: 1 }}>
              {allUsersError}
            </Typography>
          )}

          {!allUsersLoading &&
            !allUsersError &&
            allUsers.map((u) => {
              const isMe = u._id === userId;
              const isFriend = friendIdSet.has(u._id);
              const disabled = isMe || isFriend || addingId === u._id;

              let label = "Add";
              if (isMe) label = "You";
              else if (isFriend) label = "Added";
              else if (addingId === u._id) label = "Adding...";

              return (
                <Box
                  key={u._id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: 1,
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: "#111827",
                        fontSize: 14,
                      }}
                    >
                      {(u.name || "A")[0]}
                    </Avatar>
                    <Typography variant="body2">{u.name}</Typography>
                  </Stack>

                  <Button
                    size="small"
                    disabled={disabled}
                    onClick={() => handleAddFriend(u._id)}
                    sx={{
                      textTransform: "none",
                      borderRadius: 999,
                      px: 1.6,
                      fontSize: 12,
                      bgcolor: disabled ? "#E5E7EB" : "#516E1F",
                      color: disabled ? "#6B7280" : "#FFFFFF",
                      "&:hover": {
                        bgcolor: disabled ? "#E5E7EB" : "#3F5A16",
                      },
                    }}
                  >
                    {label}
                  </Button>
                </Box>
              );
            })}

          {!allUsersLoading && !allUsersError && allUsers.length === 0 && (
            <Typography variant="body2" sx={{ mt: 1, color: "#6B7280" }}>
              No other users yet.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFriendsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <BottomNavBar />
    </Box>
  );
}

export default HomePage;
