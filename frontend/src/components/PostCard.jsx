// src/components/PostCard.jsx
import React from "react";
import {
  Paper,
  Box,
  Avatar,
  Typography,
  IconButton,
  Stack,
} from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import ShareIcon from "@mui/icons-material/Share";

function PostCard({ username, handle, time, content }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        mb: 2,
        borderRadius: 999,
        bgcolor: "background.paper",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.05)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
      }}
    >
      <Box sx={{ display: "flex", gap: 2 }}>
        <Avatar sx={{ width: 36, height: 36 }} />
        <Box sx={{ flexGrow: 1 }}>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}
          >
            <Typography variant="subtitle2" fontWeight={600}>
              {username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {handle} · {time}
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ mb: 1.3 }}>
            {content}
          </Typography>

          <Stack direction="row" spacing={1}>
            <IconButton size="small">
              <FavoriteBorderIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ChatBubbleOutlineIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ShareIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Paper>
  );
}

export default PostCard;
