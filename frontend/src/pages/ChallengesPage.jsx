// src/pages/ChallengesPage.jsx
import React, { useEffect, useState } from "react";
import {
  Grid,
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Button,
  Chip,
} from "@mui/material";

import SideNav from "../components/SideNav.jsx";
import RightSidebar from "../components/RightSidebar.jsx";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 原来那 3 条本地示例挑战，当作 fallback
const fallbackChallenges = [
  {
    id: 1,
    title: "7-day focus challenge",
    description: "Commit to 2 hours of distraction-free work every day.",
    progress: 40,
    daysLeft: 3,
    tag: "Productivity",
  },
  {
    id: 2,
    title: "Daily UI sketch",
    description: "Create a tiny UI sketch every day for 14 days.",
    progress: 70,
    daysLeft: 5,
    tag: "Design",
  },
  {
    id: 3,
    title: "Morning writing sprint",
    description: "Write 200 words before 9 AM, for 10 days in a row.",
    progress: 10,
    daysLeft: 9,
    tag: "Writing",
  },
];

function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);

  // 当前用户（跟其他页面一样从 localStorage 取）
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user", e);
    }
  }, []);
  const userId = currentUser?._id;

  // 加载 friends 类型的挑战
  useEffect(() => {
    const fetchFriendsChallenges = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/challenges/friends`);
        const data = await res.json().catch(() => []);

        if (!res.ok) {
          console.error("Error fetching challenges:", data);
          throw new Error("Failed to fetch challenges");
        }

        if (Array.isArray(data) && data.length > 0) {
          // 有真实数据：用真实数据
          setChallenges(data);
        } else {
          // 没有任何 friend challenge：用本地示例
          setChallenges(fallbackChallenges);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load challenges from your friends.");
        // 出错也展示本地示例，至少页面不会空白
        setChallenges(fallbackChallenges);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsChallenges();
  }, []);

  const handleJoin = async (challenge) => {
    const challengeId = challenge._id; 

    if (!challengeId) {
      alert("This is just a demo challenge. Real friend challenges will appear here once created in backend.");
      return;
    }

    if (!userId) {
      alert("请先登录再加入挑战");
      return;
    }
    if (joinedIds.includes(challengeId)) return;

    try {
      setJoiningId(challengeId);

      const res = await fetch(`${API_BASE_URL}/challenges/${challengeId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error("Join challenge failed:", data);
        alert("Failed to join this challenge.");
        setJoiningId(null);
        return;
      }

      setJoinedIds((prev) =>
        prev.includes(challengeId) ? prev : [...prev, challengeId]
      );
      setJoiningId(null);
    } catch (err) {
      console.error("Error joining challenge:", err);
      alert("Network error. Please try again.");
      setJoiningId(null);
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3} lg={3}>
        <SideNav activeIndex={2} />
      </Grid>

      <Grid item xs={12} md={6} lg={6}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Challenges from your friends
          </Typography>
        </Box>

        {loading && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading friend challenges...
          </Typography>
        )}

        {!loading && error && (
          <Typography variant="body2" color="error" sx={{ mt: 1, mb: 1 }}>
            {error}
          </Typography>
        )}

        {!loading &&
          challenges.map((c) => {
            const id = c._id || c.id;
            const title = c.title;
            const description = c.description;
            const isReal = !!c._id; // 真实数据 or 示例数据

            // 真实挑战：用 time 字段表示总天数
            // 示例挑战：用 progress/daysLeft 渲染一个虚拟进度
            let progress = 0;
            let daysLeftText = "";

            if (isReal) {
              const totalDays = c.time || 7;
              progress = 0;
              daysLeftText = `Duration: ${totalDays} days`;
            } else {
              // 示例数据
              progress = c.progress;
              daysLeftText = `${c.progress}% · ${c.daysLeft} days left`;
            }

            const joined = isReal && joinedIds.includes(c._id);

            return (
              <Paper
                key={id}
                elevation={0}
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: 3,
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                  </Typography>
                  <Chip
                    label={isReal ? "Friend challenge" : c.tag || "Demo"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={1}>
                  {description}
                </Typography>

                <Stack spacing={0.5} sx={{ mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{ borderRadius: 999, height: 6 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {daysLeftText}
                  </Typography>
                </Stack>

                <Button
                  size="small"
                  variant={isReal ? (joined ? "outlined" : "contained") : "outlined"}
                  sx={{ textTransform: "none", borderRadius: 999 }}
                  onClick={() => handleJoin(c)}
                  disabled={isReal && (joiningId === c._id || joined)}
                >
                  {!isReal
                    ? "Demo challenge"
                    : joined
                    ? "Joined"
                    : joiningId === c._id
                    ? "Joining..."
                    : "Join challenge"}
                </Button>
              </Paper>
            );
          })}
      </Grid>

      <Grid
        item
        xs={12}
        md={3}
        lg={3}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        <RightSidebar />
      </Grid>
    </Grid>
  );
}

export default ChallengesPage;
