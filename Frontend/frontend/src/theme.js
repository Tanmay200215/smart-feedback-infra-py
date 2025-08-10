import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb" },          // blue-600
    secondary: { main: "#0ea5e9" },        // sky-500
    background: { default: "#f8fafc", paper: "#ffffff" },
  },
  shape: { borderRadius: 16 },             // softer corners
  typography: {
    fontFamily: `"Inter", system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial`,
    h1: { fontWeight: 700, fontSize: "2rem" },
    h2: { fontWeight: 700, fontSize: "1.5rem" },
    h3: { fontWeight: 600, fontSize: "1.25rem" },
    body1: { fontSize: "0.95rem" },
  },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 20 } } },
    MuiCard:  { styleOverrides: { root: { borderRadius: 20 } } },
    MuiButton:{ styleOverrides: { root: { borderRadius: 14, textTransform: "none" } } },
  },
});

export default theme;
