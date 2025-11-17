// src/pages/ChallengesPage.jsx
import React from "react";
import {
  Grid,
  Box,
  Paper,
  Typography,
  LinearProgress,
  Stack,
  Button,
  Chip,
} from "@mui/material";
import SideNav from "../components/SideNav.jsx";
import RightSidebar from "../components/RightSidebar.jsx";

const challenges = [
  {
    id: 1,
    title: "7-day focus challenge",
    description: "Commit to 2 hours of distraction-free work every day.",
    progress: 40,
    daysLeft: 3,
    tag: "Productivity",
  },
  {
    id: 2,
    title: "Daily UI sketch",
    description: "Create a tiny UI sketch every day for 14 days.",
    progress: 70,
    daysLeft: 5,
    tag: "Design",
  },
  {
    id: 3,
    title: "Morning writing sprint",
    description: "Write 200 words before 9 AM, for 10 days in a row.",
    progress: 10,
    daysLeft: 9,
    tag: "Writing",
  },
];

function ChallengesPage() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={3} lg={3}>
        <SideNav activeIndex={2} />
      </Grid>

      <Grid item xs={12} md={6} lg={6}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>
            Challenges
          </Typography>
          <Button
            variant="contained"
            sx={{ borderRadius: 999, textTransform: "none" }}
          >
            Create challenge
          </Button>
        </Box>

        {challenges.map((c) => (
          <Paper
            key={c.id}
            elevation={0}
            sx={{
              p: 2,
              mb: 1.5,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {c.title}
              </Typography>
              <Chip label={c.tag} size="small" />
            </Box>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {c.description}
            </Typography>

            <Stack spacing={0.5} sx={{ mb: 1 }}>
              <LinearProgress
                variant="determinate"
                value={c.progress}
                sx={{ borderRadius: 999, height: 6 }}
              />
              <Typography variant="caption" color="text.secondary">
                {c.progress}% · {c.daysLeft} days left
              </Typography>
            </Stack>

            <Button
              size="small"
              variant="outlined"
              sx={{ textTransform: "none", borderRadius: 999 }}
            >
              View details
            </Button>
          </Paper>
        ))}
      </Grid>

      <Grid
        item
        xs={12}
        md={3}
        lg={3}
        sx={{ display: { xs: "none", md: "block" } }}
      >
        <RightSidebar />
      </Grid>
    </Grid>
  );
}

export default ChallengesPage;
