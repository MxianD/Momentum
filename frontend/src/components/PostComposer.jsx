// src/components/PostComposer.jsx
import React from "react";
import {
  Paper,
  Box,
  Avatar,
  TextField,
  IconButton,
  Button,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";

function PostComposer() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 999,
        bgcolor: "background.paper",
        boxShadow: "0 20px 45px rgba(15, 23, 42, 0.06)",
        border: "1px solid rgba(226, 232, 240, 0.9)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
        <Avatar sx={{ width: 40, height: 40 }} />
        <Box sx={{ flexGrow: 1 }}>
          <TextField
            fullWidth
            placeholder="What's on your mind?"
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                fontSize: 15,
              },
            }}
          />

          <Box
            sx={{
              mt: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <IconButton size="small">
                <ImageIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <AttachFileIcon fontSize="small" />
              </IconButton>
              <IconButton size="small">
                <EmojiEmotionsIcon fontSize="small" />
              </IconButton>
            </Box>
            <Button
              variant="contained"
              sx={{
                borderRadius: 999,
                textTransform: "none",
                px: 3.5,
                py: 0.7,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Post
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default PostComposer;
