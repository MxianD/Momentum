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

function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);
  const [joinedIds, setJoinedIds] = useState([]);

  // 当前用户（用和其他页面一样的 localStorage）
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

        setChallenges(data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load challenges from your friends.");
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsChallenges();
  }, []);

  const handleJoin = async (challengeId) => {
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

      // 本地标记为已加入
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
          {/* 以后如果要做创建 friend challenge 的表单，可以用这个按钮 */}
          {/* <Button
            variant="contained"
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            Create challenge
          </Button> */}
        </Box>

        {loading && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading friend challenges...
          </Typography>
        )}

        {!loading && error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}

        {!loading && !error && challenges.length === 0 && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            No challenges from your friends yet. Maybe create one together!
          </Typography>
        )}

        {!loading &&
          !error &&
          challenges.map((c) => {
            const joined = joinedIds.includes(c._id);
            // 如果有 time 字段，这里简单当成“天数”
            const totalDays = c.time || 7;

            return (
              <Paper
                key={c._id}
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
                    {c.title}
                  </Typography>
                  <Chip label="Friend challenge" size="small" />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={1}>
                  {c.description}
                </Typography>

                {/* 简单的进度条：这里只是示意，真正进度在 HomePage 用 UserChallenge 算 */}
                <Stack spacing={0.5} sx={{ mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={0}
                    sx={{ borderRadius: 999, height: 6 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Duration: {totalDays} days
                  </Typography>
                </Stack>

                <Button
                  size="small"
                  variant={joined ? "outlined" : "contained"}
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                  }}
                  onClick={() => handleJoin(c._id)}
                  disabled={joiningId === c._id || joined}
                >
                  {joined
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
