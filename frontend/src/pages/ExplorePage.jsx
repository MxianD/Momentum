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

// 推荐挑战（走马灯，系统默认，先写死在前端）
// ⚠️ 如果以后你在数据库里给这几个挑战建了真实 _id，可以在这里补上 _id 字段，
//   这样就能和 friend challenge 一样真正写入用户加入记录。
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
    id: "691beb74bcfe398e75f30544",
    title: "Stay Hydrated",
    leader: "Challenge Leader",
    time: "Daily - 1 week",
    description:
      "Drink enough water every day and keep track of your hydration goal together.",
    image: meditationImg,
  },
  {
    id: "691beb94bcfe398e75f30548",
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

  // ✅ 用这个 state 存当前弹窗里展示的 challenge
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

  // 从后端加载好友挑战 + 用户已加入挑战
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [friendsRes, joinedRes] = await Promise.all([
          fetch(`${API_BASE_URL}/challenges/friends`),
          userId
            ? fetch(`${API_BASE_URL}/challenges/joined/${userId}`)
            : Promise.resolve({ ok: true, json: async () => [] }),
        ]);

        if (!friendsRes.ok) throw new Error("Failed to load challenges");

        const friends = await friendsRes.json();
        setFriendChallenges(friends);

        if (joinedRes.ok) {
          const joinedData = await joinedRes.json(); // UserChallenge[]
          const ids = joinedData.map((uc) => uc.challenge._id);
          setJoinedChallengeIds(ids);
        }
      } catch (err) {
        console.error("Error loading explore data", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // 打开走马灯弹窗
  const handleOpenDetail = (challenge) => {
    setSelectedChallenge(challenge);
  };

  const handleCloseDetail = () => {
    setSelectedChallenge(null);
  };

  const isJoined = (challengeId) => joinedChallengeIds.includes(challengeId);

  // 好友 challenge 的加入（已连后端）
  const handleJoinFriendChallenge = async (challenge) => {
    if (!userId) {
      alert("Please login first.");
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
        return;
      }

      setJoinedChallengeIds((prev) =>
        prev.includes(challenge._id) ? prev : [...prev, challenge._id]
      );
    } catch (err) {
      console.error("Error joining challenge:", err);
    }
  };

  // 🔥 推荐（走马灯） challenge 的加入逻辑
  // 现在这 3 个是“系统默认模板”，前端写死，没有 _id。
  // 如果以后你在数据库里给它们建了真实 challenge（有 _id），
  // 可以在 recommended 里补上 _id，这里就可以直接走和 friend 一样的接口。
  const handleJoinRecommendedChallenge = async (challenge) => {
    if (!userId) {
      alert("Please login first.");
      return;
    }

    if (!challenge._id) {
      // alert(
      //   "当前这几个 Recommended 挑战还只是前端模板。\n如果想把它们真正写入数据库并在 Home 里显示，需要先在后端为它们建对应的 challenge 记录，再把 _id 填到前端 recommended 里。"
      // );
      return;
    }

    // 如果你已经给这些 recommended 配了 _id，就可以直接复用 friend 的逻辑：
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
          {recommended.map((item) => (
            <Paper
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              sx={{
                flex: "0 0 100%",
                scrollSnapAlign: "center",
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              {/* 整张卡片的垂直布局 */}
              <Stack spacing={1.5}>
                {/* 顶部：Challenge Leader + 右上头像 */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" sx={{ fontSize: 13 }}>
                    {item.leader}
                  </Typography>
                  <Avatar sx={{ width: 28, height: 28 }} />
                </Stack>

                {/* 中部：左文字，右插画 */}
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* 左侧文字块 */}
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

                  {/* 右侧插画 */}
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
          ))}
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
              key={item.id}
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

        {!loading && (
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

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 0.5 }}
                  >
                    <Stack direction="row" spacing={-0.5}>
                      <Avatar sx={{ width: 22, height: 22 }} />
                      <Avatar sx={{ width: 22, height: 22 }} />
                      <Avatar sx={{ width: 22, height: 22 }} />
                    </Stack>

                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      5 ⚡
                    </Typography>
                  </Stack>

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
        {/* 标题 */}
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedChallenge?.title}
        </DialogTitle>

        {/* 内容 */}
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
        </DialogContent>

        {/* 弹窗底部按钮 */}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDetail}>Close</Button>

          <Button
            variant="contained"
            sx={{ textTransform: "none", borderRadius: 999 }}
            onClick={() => {
              if (!selectedChallenge) return;

              // 推荐 challenge（走马灯那 3 个）
              if (!selectedChallenge._id) {
                handleJoinRecommendedChallenge(selectedChallenge);
              } else {
                // 理论上不会走到这里，但如果你以后把 friends 也复用这个弹窗，可以走 friend 加入逻辑
                handleJoinFriendChallenge(selectedChallenge);
              }

              handleCloseDetail();
            }}
          >
            Join challenge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ExplorePage;
