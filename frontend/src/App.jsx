// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
} from "@mui/material";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import HomePage from "./pages/HomePage.jsx";
import ForumPage from "./pages/ForumPage.jsx";
import ExplorePage from "./pages/ExplorePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#516E1F" },
    background: {
      default: "#D4D4DA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: [
      "-apple-system",
      "BlinkMacSystemFont",
      '"SF Pro Text"',
      '"Segoe UI"',
      "system-ui",
      "sans-serif",
    ].join(","),
  },
});

// 一个简单的“需要登录”的封装
function RequireAuth({ user, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);

  // 初始化时，从 localStorage 里读之前登录过的用户
  useEffect(() => {
    try {
      const saved = localStorage.getItem("momentumUser");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <Router>
          <Routes>
            {/* 登录页：如果已经有 user，自动跳到首页 */}
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <LoginPage onLogin={setUser} />
                )
              }
            />

            {/* 下面这些页面都需要登录 */}
            <Route
              path="/"
              element={
                <RequireAuth user={user}>
                  <HomePage />
                </RequireAuth>
              }
            />
            <Route
              path="/forum"
              element={
                <RequireAuth user={user}>
                  <ForumPage />
                </RequireAuth>
              }
            />
            <Route
              path="/explore"
              element={
                <RequireAuth user={user}>
                  <ExplorePage />
                </RequireAuth>
              }
            />

            {/* 兜底：未知路径都重定向到 / */}
            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;
