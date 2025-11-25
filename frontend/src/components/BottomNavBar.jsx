// src/components/BottomNavBar.jsx
import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";
import { useLocation, useNavigate } from "react-router-dom";

function TabItem({ icon, label, active = false, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        gap: 0.4,
        cursor: "pointer",
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 6,
          bgcolor: active ? "#8B8B8F" : "#E4E4E7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: active ? "#FFFFFF" : "#9CA3AF",
        }}
      >
        {icon}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontSize: 11,
          color: active ? "#111827" : "#B4B4BB",
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      component="nav"
      sx={{
        position: "sticky",
        bottom: 0,
        left: 0,
        right: 0,
        bgcolor: "#F7F7F7",
        borderTop: "1px solid #E5E7EB",
        px: 1.5,
        pt: 0.6,
        pb: 0.8,
        mt: "auto",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 16,
          bgcolor: "#FFFFFF",
          px: 1,
          pt: 0.6,
          pb: 0.4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <TabItem
            icon={<HomeRoundedIcon />}
            label="Home"
            active={location.pathname === "/"}
            onClick={() => navigate("/")}
          />
          <TabItem
            icon={<GroupOutlinedIcon />}
            label="Friends"
            onClick={() => navigate("/friends")}
          />
          <TabItem
            icon={<ForumOutlinedIcon />}
            label="Forum"
            active={location.pathname.startsWith("/forum")}
            onClick={() => navigate("/forum")}
          />
          <TabItem
            icon={<TravelExploreOutlinedIcon />}
            label="Explore"
            active={location.pathname.startsWith("/explore")}
            onClick={() => navigate("/explore")}
          />
        </Box>
      </Paper>
    </Box>
  );
}
