import { AppBar, Toolbar, Box, Button, Container, Typography, alpha } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { YAxis } from "recharts";

export default function Navbar() {
  const loc = useLocation();
  const isActive = (path) => loc.pathname === path;

  return (
    <AppBar
      elevation={0}
      position="sticky"
      sx={{
        mt: 2,
        borderRadius: 3,
        // maxWidth: "1200px",
        // mx:"auto",
        mx: "28rem",
        overflow:"hidden",
        width: {xs:"95%",md:"600px"},
        backdropFilter: "blur(10px)",
        background: (t) =>
          `linear-gradient(135deg, ${alpha(t.palette.primary.main, 0.75)}, ${alpha(
            t.palette.secondary.main,
            0.75
          )})`,
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters  sx={{ px: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
            Smart Feedback
          </Typography>
          <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
            <Button component={Link} to="/" variant={isActive("/") ? "contained" : "text"} color="inherit">
              Home
            </Button>
            <Button component={Link} to="/dashboard" variant={isActive("/dashboard") ? "contained" : "text"} color="inherit">
              Dashboard
            </Button>
            <Button component={Link} to="/submit" variant={isActive("/submit") ? "contained" : "text"} color="inherit">
              Submit
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
