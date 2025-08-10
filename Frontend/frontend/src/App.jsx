import { Box } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Submit from "./pages/Submit";

export default function App() {
  return (
    <Box sx={{ minHeight: "auto", display: "flex", flexDirection: "column" }}>
      <Box
          sx={{
            position: "sticky", 
            top: 0,
            zIndex: 1000, 
            backdropFilter: "blur(10px)", 
            backgroundColor: "rgba(255, 255, 255, 0.1)", 
            px: 0,
            pt:-10, 
            pb:0
          }}
        >
          <Navbar />
        </Box>
      {/* Main grows to fill height; each page handles its own Container */}
      <Box component="main" sx={{ flex: 1, py: { xs: 2, md: 3 }, overflowY:"auto"}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}
