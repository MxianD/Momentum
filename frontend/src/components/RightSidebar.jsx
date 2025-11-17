// src/components/RightSidebar.jsx
import React from "react";
import { Box, Paper, Typography, Stack } from "@mui/material";

function RightSidebar() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          borderRadius: 999,
          bgcolor: "background.paper",
          boxShadow: "0 16px 40px rgba(15, 23, 42, 0.05)",
          border: "1px solid rgba(226, 232, 240, 0.9)",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
          Trending topics
        </Typography>
        <Stack spacing={1.4}>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              #productivity
            </Typography>
            <Typography variant="caption" color="text.secondary">
              8k posts · 1 new today
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              #design
            </Typography>
            <Typography variant="caption" color="text.secondary">
              10k posts · 2 new today
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" fontWeight={600}>
              #devlife
            </Typography>
            <Typography variant="caption" color="text.secondary">
              12k posts · 3 new today
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default RightSidebar;
