// src/pages/LoginPage.jsx
import React, { useState } from "react";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

function LoginPage() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    // 如果环境变量没生效，先给出明显提示，避免你一直懵
    if (!import.meta.env.VITE_API_BASE_URL) {
      console.warn("VITE_API_BASE_URL is not set, using localhost fallback");
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        // 后端返回非 2xx，比如 500 / 404
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Login failed (${res.status})`);
      }

      const user = await res.json();

      // 存到 localStorage，后面 HomePage / ForumPage 会用到
      localStorage.setItem("momentumUser", JSON.stringify(user));

      // 跳转到首页
      navigate("/home");
    } catch (err) {
      console.error("Login error:", err);
      setError(
        "Unable to login. Please check your network and server configuration."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#F5F5F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          maxWidth: 360,
          width: "100%",
          p: 3,
          borderRadius: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, mb: 1.5, textAlign: "center" }}
        >
          Welcome to Momentum
        </Typography>
        <Typography
          variant="body2"
          sx={{ mb: 2, textAlign: "center", color: "#6B7280" }}
        >
          Enter your name to start tracking your challenges.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2 }}
          />

          {error && (
            <Typography
              variant="caption"
              sx={{ color: "red", display: "block", mb: 1 }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              borderRadius: 999,
            }}
          >
            {loading ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <Typography
          variant="caption"
          sx={{ mt: 2, display: "block", textAlign: "center", color: "#9CA3AF" }}
        >
          API: {API_BASE_URL}
        </Typography>
      </Paper>
    </Box>
  );
}

export default LoginPage;
