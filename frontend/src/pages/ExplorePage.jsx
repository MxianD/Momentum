// src/pages/ExplorePage.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import BottomNavBar from "../components/BottomNavBar.jsx";
import meditationImg from "../assets/challenges/meditation.svg";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

// 推荐挑战（走马灯，系统默认）
// ⚠️ 这三个 _id 必须在数据库里真的有对应的 Challenge 记录（_id 一样）,
//    不然 POST /api/challenges/:id/join 会 404。
const recommended = [
  {
    _id: "691beb60bcfe398e75f30542",
    title: "Everyday Meditation",
    leader: "Challenge Leader",
    time: "10 Min / day - 1 week",
    description:
      "Build a daily meditation habit with short 10-minute sessions you can do anytime.",
    image: meditationImg,
  },
  {
    _id: "691beb74bcfe398e75f30544",
    title: "Stay Hydrated",
    leader: "Challenge Leader",
    time: "Daily - 1 week",
    description:
      "Drink enough water every day and keep track of your hydration goal together.",
    image: meditationImg,
  },
  {
    _id: "691beb94bcfe398e75f30548",
    title: "Morning Stretch",
    leader: "Challenge Leader",
    time: "5 Min / day - 1 week",
    description:
      "Loosen up with a quick morning stretch to energize your body and mind.",
    image: meditationImg,
  },
];

function ExplorePage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendChallenges, setFriendChallenges] = useState([]);
  const [joinedChallengeIds, setJoinedChallengeIds] = useState([]);

  const carouselRef = useRef(null);

  // 当前用户
  const [currentUser, setCurrentUser] = useState(null);
  const userId = currentUser?._id;

  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  // 从后端加载「好友参加的挑战」+ 「我已加入的挑战」
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 没登录就不请求，直接空
        if (!userId) {
          setFriendChallenges([]);
          setJoinedChallengeIds([]);
          setLoading(false);
          return;
        }

        const [friendsRes, joinedRes] = await Promise.all([
          // ⭐ 带上 userId，后端用它找好友
          fetch(
            `${API_BASE_URL}/challenges/friends?userId=${encodeURIComponent(
              userId
            )}`
          ),
          fetch(`${API_BASE_URL}/challenges/joined/${userId}`),
        ]);

        if (!friendsRes.ok) throw new Error("Failed to load challenges");

        const friends = await friendsRes.json();
        setFriendChallenges(Array.isArray(friends) ? friends : []);

        if (joinedRes.ok) {
          const joinedData = await joinedRes.json(); // UserChallenge[]
          const ids = joinedData.map((uc) => uc.challenge._id);
          setJoinedChallengeIds(ids);
        } else {
          setJoinedChallengeIds([]);
        }
      } catch (err) {
        console.error("Error loading explore data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleOpenDetail = (challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseDetail = () => {
    setSelectedChallenge(null);
  };

  const isJoined = (challengeId) => joinedChallengeIds.includes(challengeId);

  // 好友 challenge 的加入
  const handleJoinFriendChallenge = async (challenge) => {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    if (!challenge?._id) {
      console.error("Challenge _id missing:", challenge);
      alert("Invalid challenge id.");
      return;
    }

    if (isJoined(challenge._id)) {
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/challenges/${challenge._id}/join`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        }
      );

      if (!res.ok) {
        console.error("Join challenge failed:", res.status);
        alert("Failed to join challenge.");
        return;
      }

      setJoinedChallengeIds((prev) =>
        prev.includes(challenge._id) ? prev : [...prev, challenge._id]
      );
    } catch (err) {
      console.error("Error joining challenge:", err);
      alert("Network error. Please try again.");
    }
  };

  // 推荐（走马灯） challenge 的加入逻辑
  const handleJoinRecommendedChallenge = async (challenge) => {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    if (!challenge?._id) {
      console.error("Recommended challenge has no _id:", challenge);
      alert(
        "This recommended challenge has no linked backend record yet. Please create it in the DB and set _id in recommended[]."
      );
      return;
    }

    if (isJoined(challenge._id)) return;

    await handleJoinFriendChallenge(challenge);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#F5F5F5",
      }}
    >
      {/* 顶部标题 */}
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>
          Recommended For You:
        </Typography>
      </Box>

      {/* 主体内容 */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          px: 2,
          pb: 10,
        }}
      >
        {/* 推荐走马灯 */}
        <Box
          ref={carouselRef}
          onScroll={(e) => {
            const { scrollLeft, clientWidth } = e.target;
            const index = Math.round(scrollLeft / clientWidth);
            if (index !== currentIndex) setCurrentIndex(index);
          }}
          sx={{
            display: "flex",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollBehavior: "smooth",
            mb: 2,
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {recommended.map((item) => {
            const joined = isJoined(item._id);
            return (
              <Paper
                key={item._id}
                onClick={() => handleOpenDetail(item)}
                sx={{
                  flex: "0 0 100%",
                  scrollSnapAlign: "center",
                  p: 2,
                  borderRadius: 3,
                  cursor: "pointer",
                  boxSizing: "border-box",
                  position: "relative",
                }}
              >
                {/* 右上角只保留 Joined 标签，去掉头像 */}
                {joined && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      bgcolor: "#16A34A",
                      color: "#FFFFFF",
                      borderRadius: 12,
                      px: 1,
                      py: 0.2,
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    Joined
                  </Box>
                )}

                <Stack spacing={1.5}>
                  {/* 顶部只显示 leader 文案 */}
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {item.leader}
                  </Typography>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          mb: 0.5,
                          lineHeight: 1.2,
                          wordBreak: "break-word",
                        }}
                      >
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#6B7280" }}>
                        {item.time}
                      </Typography>
                    </Box>

                    <Box
                      component="img"
                      src={item.image}
                      alt={item.title}
                      sx={{
                        width: { xs: "38%", sm: "32%", md: "28%" },
                        height: "auto",
                        borderRadius: 3,
                        flexShrink: 0,
                        display: "block",
                      }}
                    />
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Box>

        {/* 小圆点 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mb: 3,
            gap: 1,
          }}
        >
          {recommended.map((item, index) => (
            <Box
              key={item._id}
              onClick={() => {
                setCurrentIndex(index);
                if (carouselRef.current) {
                  const width = carouselRef.current.clientWidth;
                  carouselRef.current.scrollTo({
                    left: width * index,
                    behavior: "smooth",
                  });
                }
              }}
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: index === currentIndex ? "#333" : "#C4C4C4",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>

        {/* Friend challenges 区块 */}
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, fontSize: 20, mb: 2 }}
        >
          Challenges From Your Friends:
        </Typography>

        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 4,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        {!loading && friendChallenges.length === 0 && (
          <Typography
            variant="body2"
            sx={{ mt: 1, color: "#6B7280" }}
          >
            No challenges from your friends yet.
          </Typography>
        )}

        {!loading && friendChallenges.length > 0 && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 2,
            }}
          >
            {friendChallenges.map((c) => {
              const joined = isJoined(c._id);
              return (
                <Paper
                  key={c._id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  {joined && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "#16A34A",
                        color: "#FFFFFF",
                        borderRadius: 12,
                        px: 1,
                        py: 0.2,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      Joined
                    </Box>
                  )}

                  <Typography sx={{ fontWeight: 700 }}>{c.title}</Typography>

                  <Typography variant="body2" sx={{ color: "#6B7280" }}>
                    {c.time}
                  </Typography>

                  <Box
                    sx={{
                      width: "100%",
                      height: 80,
                      borderRadius: 4,
                      bgcolor: "#E5E5E5",
                    }}
                  />


                  <Button
                    variant={joined ? "outlined" : "contained"}
                    size="small"
                    onClick={() => handleJoinFriendChallenge(c)}
                    disabled={joined}
                    sx={{
                      mt: 0.5,
                      textTransform: "none",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                      bgcolor: joined ? "transparent" : "#111827",
                      color: joined ? "#111827" : "#FFFFFF",
                      "&:hover": {
                        bgcolor: joined ? "transparent" : "#020617",
                      },
                    }}
                  >
                    {joined ? "Joined" : "Join challenge"}
                  </Button>
                </Paper>
              );
            })}
          </Box>
        )}
      </Box>

      <BottomNavBar />

      {/* 推荐 challenge 详情弹窗 */}
      <Dialog
        open={!!selectedChallenge}
        onClose={handleCloseDetail}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedChallenge?.title}
        </DialogTitle>

        <DialogContent dividers>
          <Typography sx={{ mb: 1.5, color: "#6B7280" }}>
            {selectedChallenge?.time}
          </Typography>
          <Typography sx={{ mb: 2 }}>
            {selectedChallenge?.description}
          </Typography>

          {selectedChallenge?.image && (
            <Box
              component="img"
              src={selectedChallenge.image}
              alt={selectedChallenge.title}
              sx={{
                width: "100%",
                borderRadius: 3,
                mb: 2,
                objectFit: "cover",
              }}
            />
          )}

          {selectedChallenge && isJoined(selectedChallenge._id) && (
            <Typography
              variant="body2"
              sx={{ color: "#16A34A", fontWeight: 500 }}
            >
              You have already joined this challenge.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetail}>Close</Button>

          <Button
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 999 }}
            disabled={
              !selectedChallenge || isJoined(selectedChallenge._id)
            }
            onClick={async () => {
              if (!selectedChallenge) return;

              if (isJoined(selectedChallenge._id)) return;

              await handleJoinRecommendedChallenge(selectedChallenge);
              handleCloseDetail();
            }}
          >
            {selectedChallenge && isJoined(selectedChallenge._id)
              ? "Joined"
              : "Join challenge"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExplorePage;
