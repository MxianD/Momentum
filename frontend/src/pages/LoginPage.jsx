// src/pages/LoginPage.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://localhost:3001/api";

function LoginPage({ onLogin }) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || submitting) return;

    try {
      setSubmitting(true);

      // 调后端 /api/users/login
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        console.error("Login request failed:", res.status);
        alert("Login failed. Please try again.");
        setSubmitting(false);
        return;
      }

      const user = await res.json(); // { _id, name }

      // 存进 localStorage
      localStorage.setItem("momentumUser", JSON.stringify(user));

      // 通知 App
      if (onLogin) onLogin(user);

      // 跳到首页
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#516E1F",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: 360,
          borderRadius: 4,
          p: 3,
          bgcolor: "#F9FAFB",
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1, color: "#111827" }}
        >
          Welcome to Momentum
        </Typography>

        <Typography
          variant="body2"
          sx={{ mb: 3, color: "#6B7280" }}
        >
          Before we start, how should we call you?
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Your name"
              variant="outlined"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />

            <Button
              type="submit"
              variant="contained"
              disabled={!name.trim() || submitting}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 999,
                py: 1,
                bgcolor: "#111827",
                "&:hover": { bgcolor: "#020617" },
              }}
            >
              {submitting ? "Logging in..." : "Continue"}
            </Button>

            <Typography
              variant="caption"
              sx={{ color: "#9CA3AF" }}
            >
              No password needed. Your name will be stored and used
              across the app.
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginPage;
