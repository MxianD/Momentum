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

import BottomNavBar from "../components/BottomNavBar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 从 API_BASE_URL 推出后端根地址（去掉 /api）
const API_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

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

function GoalCard({
  title,
  subtitle,
  streak,
  progressText,
  checkedInToday,
  onCheckIn,
}) {
  // ... 原代码保持不变
  // 为了省篇幅，我就不重复粘贴了，你可以保留你现有的 GoalCard 实现
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
      {/* ... 你原来的内容 ... */}
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
        {/* 左侧略 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          {/* streak + 按钮 */}
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
  const [checkInImage, setCheckInImage] = useState(null); // ⭐ 新增
  const [posting, setPosting] = useState(false);

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

  // ... 你原来从 /challenges/joined 拉 goals 的 useEffect 保持不变 ...

  const handleOpenCheckInDialog = (id) => {
    const goal = goals.find((g) => g.id === id);
    if (!goal || goal.checkedInToday) return;
    setActiveGoalId(id);
    setCheckInNote("");
    setCheckInImage(null); // 打开时清空图片
  };

  const handleCloseDialog = () => {
    if (posting) return;
    setActiveGoalId(null);
    setCheckInNote("");
    setCheckInImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCheckInImage(file);
    }
  };

  // Check in
  const handleConfirmCheckIn = async () => {
    if (!activeGoalId || !checkInNote.trim()) return;
    const goal = goals.find((g) => g.id === activeGoalId);
    if (!goal) return;

    try {
      setPosting(true);

      if (!goal.isSystem) {
        // challenge-based goal：走 /challenges/:id/checkin (multipart)
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
        // 系统 goal：用 /forum/posts (multipart)
        const formData = new FormData();
        formData.append("title", goal.title);
        formData.append("content", checkInNote);
        formData.append("userId", userId);
        formData.append("source", "checkin");
        if (checkInImage) {
          formData.append("image", checkInImage);
        }

        await fetch(`${API_BASE_URL}/forum/posts`, {
          method: "POST",
          body: formData,
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
      {/* 顶部绿色区域略，保持你原来的代码 */}

      {/* 中间区域略 */}

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

          {/* ⭐ 图片上传 */}
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
