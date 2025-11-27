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
} from "@mui/material";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 系统内置 goal（不依赖数据库）
const systemGoals = [
  {
    id: "system-1",
    title: "Stay hydrated",
    subtitle: "",
    streak: 5,
    progressText: "4/7",
    checkedInToday: false,
    lastNote: "",
    isSystem: true,
  },
];

// 排行榜每一行
function RankingRow({ rank, value, name, color, isCurrentUser }) {
  const isTop1 = rank === 1;

  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1}
      sx={{
        mb: 0.5,
        px: 0.8,
        py: 0.4,
        borderRadius: 999,
        bgcolor: isCurrentUser
          ? "rgba(0,0,0,0.18)"
          : "transparent",
      }}
    >
      <Typography
        variant="body2"
        sx={{
          width: 20,
          color: "rgba(255,255,255,0.9)",
          fontSize: 12,
        }}
      >
        {rank}
      </Typography>

      <Avatar
        sx={{
          width: 20,
          height: 20,
          mr: 0.5,
          bgcolor: isTop1 ? "#FACC15" : "rgba(0,0,0,0.25)",
          fontSize: 10,
          color: isTop1 ? "#78350F" : "#F9FAFB",
          border: isTop1 ? "2px solid #FDE68A" : "none",
        }}
      >
        {isTop1 ? (
          <EmojiEventsIcon sx={{ fontSize: 16 }} />
        ) : (
          (name && name[0]) || rank
        )}
      </Avatar>

      <Typography
        variant="body2"
        sx={{
          color: "rgba(255,255,255,0.95)",
          fontSize: 12,
          maxWidth: 90,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {name || "Anonymous"}
      </Typography>

      <Box
        sx={{
          flexGrow: 1,
          height: 6,
          borderRadius: 999,
          bgcolor: "rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${Math.min(value || 0, 100)}%`,
            height: "100%",
            bgcolor: color,
          }}
        />
      </Box>

      <Stack
        direction="row"
        spacing={0.4}
        alignItems="center"
        sx={{ ml: 0.5 }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: 12,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          {value}
        </Typography>
        <FlashOnIcon sx={{ fontSize: 14, color: "rgba(255,255,255,0.9)" }} />
      </Stack>
    </Stack>
  );
}

function GoalCard({
  title,
  subtitle,
  streak,
  progressText,
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

        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "4px solid #D4D4D4",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#4B5563",
            fontSize: 11,
            fontWeight: 600,
            bgcolor: "#F5F5F5",
          }}
        >
          {progressText}
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
              {streak}
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
  const [checkInImage, setCheckInImage] = useState(null); // 打卡图片
  const [posting, setPosting] = useState(false);

  // 总排行榜
  const [ranking, setRanking] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // 每次多展示 5 个

  const activeGoal = goals.find((g) => g.id === activeGoalId) || null;

  // 读取当前用户
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);

  const userId = currentUser?._id;

  // 从后端拉取用户加入的挑战 -> 转成 goals
  useEffect(() => {
    if (!userId) return;

    const loadJoined = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/challenges/joined/${userId}`
        );
        if (!res.ok) {
          console.error("Failed to load user challenges");
          return;
        }
        const data = await res.json(); // UserChallenge[]

        const challengeGoals = data.map((uc) => ({
          id: uc._id, // 用 UserChallenge id 作为 goal id
          challengeId: uc.challenge._id,
          title: uc.challenge.title,
          subtitle: "Challenge with your friends",
          streak: uc.streak,
          progressText: "4/7", // 先写死，之后可以算真实进度
          checkedInToday: uc.checkedInToday,
          lastNote: uc.lastNote,
          isSystem: false,
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

  // 拉取总排行榜
  useEffect(() => {
    const loadRanking = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/forum/ranking/total`);
        if (!res.ok) {
          console.error("Failed to load ranking");
          return;
        }
        const data = await res.json();
        const list = data.ranking || [];
        setRanking(list);
        setVisibleCount(5); // 每次加载时重置可见数量
      } catch (err) {
        console.error("Error loading ranking", err);
      }
    };

    loadRanking();
  }, []);

  const handleOpenCheckInDialog = (id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.checkedInToday) return;
    setActiveGoalId(id);
    setCheckInNote("");
    setCheckInImage(null);
  };

  const handleCloseDialog = () => {
    if (posting) return;
    setActiveGoalId(null);
    setCheckInNote("");
    setCheckInImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setCheckInImage(file);
  };

  // Check in：对系统 goal，用 Forum；对 challenge goal，调用 /challenges/:id/checkin（都支持图片）
  const handleConfirmCheckIn = async () => {
    if (!activeGoalId || !checkInNote.trim()) return;
    const goal = goals.find((g) => g.id === activeGoalId);
    if (!goal) return;

    try {
      setPosting(true);

      if (!goal.isSystem) {
        // challenge-based goal：走后端 /challenges/:id/checkin（multipart）
        if (!userId || !goal.challengeId) {
          alert("User or challenge missing.");
          setPosting(false);
          return;
        }

        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("note", checkInNote);
        if (checkInImage) {
          formData.append("image", checkInImage);
        }

        const res = await fetch(
          `${API_BASE_URL}/challenges/${goal.challengeId}/checkin`,
          {
            method: "POST",
            body: formData,
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
            };
          })
        );
      } else {
        // 系统 goal：用 Forum 发一条帖（multipart）
        if (!userId) {
          alert("User missing.");
          setPosting(false);
          return;
        }

        const formData = new FormData();
        formData.append("title", goal.title);
        formData.append("content", checkInNote);
        formData.append("userId", userId);
        formData.append("source", "checkin");
        if (checkInImage) {
          formData.append("image", checkInImage);
        }

        const res = await fetch(`${API_BASE_URL}/forum/posts`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error("Forum post failed:", res.status);
          alert("Failed to post progress. Please try again.");
          setPosting(false);
          return;
        }

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

  // 计算“我的位置”
  const myIndex = userId
    ? ranking.findIndex((r) => r.userId === userId)
    : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myPoints =
    myIndex >= 0 ? ranking[myIndex].totalPoints : null;

  const canShowMore = visibleCount < ranking.length;

  const handleShowMore = () => {
    if (!canShowMore) return;
    setVisibleCount((prev) =>
      Math.min(prev + 5, ranking.length)
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* 顶部绿色区域 + 总排行榜 */}
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
            mb: 1.2,
          }}
        >
          Hello, {displayName}!
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "rgba(255,255,255,0.9)",
            fontWeight: 500,
            mb: 0.5,
            fontSize: 13,
          }}
        >
          Total ranking
        </Typography>

        {/* 显示“我的位置” */}
        {myRank && myPoints != null && (
          <Typography
            variant="caption"
            sx={{
              display: "block",
              color: "rgba(255,255,255,0.85)",
              mb: 1,
            }}
          >
            You are{" "}
            <strong>
              #{myRank}
            </strong>{" "}
            with{" "}
            <strong>{myPoints}</strong> pts.
          </Typography>
        )}

        {/* 排行列表（点击“Show next 5” 展开更多） */}
        <Box
          sx={{
            borderRadius: 16,
            bgcolor: "rgba(0,0,0,0.12)",
            p: 0.8,
          }}
        >
          {ranking.slice(0, visibleCount).map((r, index) => (
            <RankingRow
              key={r.userId}
              rank={index + 1}
              name={r.name}
              value={r.totalPoints}
              color={index === 0 ? "#E7FF90" : "#AEB7FF"}
              isCurrentUser={r.userId === userId}
            />
          ))}

          {ranking.length === 0 && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.8)",
                px: 0.5,
                py: 0.3,
                display: "block",
              }}
            >
              No ranking data yet.
            </Typography>
          )}

          {canShowMore && (
            <Box
              onClick={handleShowMore}
              sx={{
                mt: 0.5,
                py: 0.4,
                borderRadius: 999,
                bgcolor: "rgba(0,0,0,0.16)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                "&:active": {
                  transform: "scale(0.99)",
                },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 500,
                }}
              >
                Show next 5
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* 中间白色内容区域 */}
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
            progressText={g.progressText}
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
          <Typography
            variant="body2"
            sx={{ mb: 1.5, color: "#6B7280" }}
          >
            Share your progress for today. What did you do for this
            challenge?
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="E.g. Drank 6 cups of water today..."
            value={checkInNote}
            onChange={(e) => setCheckInNote(e.target.value)}
            sx={{ mb: 2 }}
          />

          {/* 图片上传 & 预览 */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button variant="outlined" component="label" size="small">
              Upload image
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
              />
            </Button>

            {checkInImage && (
              <Box
                component="img"
                src={URL.createObjectURL(checkInImage)}
                alt="preview"
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  objectFit: "cover",
                  border: "1px solid #E5E7EB",
                }}
              />
            )}
          </Box>
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

      <BottomNavBar />
    </Box>
  );
}

export default HomePage;
