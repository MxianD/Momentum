// src/components/SideNav.jsx
import React from "react";
import {
  Paper,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ForumIcon from "@mui/icons-material/Forum";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import BookmarkBorderIcon from "@mui/icons-material/BookmarkBorder";

const items = [
  { label: "Feed", icon: <HomeIcon /> },
  { label: "Forum", icon: <ForumIcon /> },
  { label: "Challenges", icon: <EmojiEventsIcon /> },
  { label: "Saved", icon: <BookmarkBorderIcon /> },
];

function SideNav({ activeIndex = 0 }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        borderRadius: 999,
        bgcolor: "background.paper",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.05)",
        border: "1px solid rgba(226, 232, 240, 0.8)",
        width: 190,
      }}
    >
      <List disablePadding>
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <Box
              key={item.label}
              sx={{
                mb: index === items.length - 1 ? 0 : 0.5,
                borderRadius: 999,
                bgcolor: selected ? "rgba(26, 115, 232, 0.08)" : "transparent",
              }}
            >
              <ListItemButton
                selected={false}
                sx={{
                  borderRadius: 999,
                  px: 2,
                  py: 1.0,
                  "&:hover": {
                    bgcolor: selected
                      ? "rgba(26, 115, 232, 0.1)"
                      : "rgba(15, 23, 42, 0.03)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: selected ? "#1A73E8" : "action.active",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selected ? 600 : 500,
                    color: selected ? "text.primary" : "text.secondary",
                  }}
                />
              </ListItemButton>
            </Box>
          );
        })}
      </List>
    </Paper>
  );
}

export default SideNav;
