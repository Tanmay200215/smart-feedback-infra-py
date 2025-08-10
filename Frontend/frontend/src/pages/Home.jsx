import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { listFeedback } from "../api";
import { Container, Grid, Typography, Paper, Stack, Chip } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import InsightsIcon from "@mui/icons-material/Insights";

const PRODUCTS = [
  {
    title: "Product A",
    subtitle: "Collaboration suite for teams",
    img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Product B",
    subtitle: "Mobile-first CRM",
    img: "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    title: "Product C",
    subtitle: "AI-powered support desk",
    img: "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Home() {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listFeedback({ limit: 10, order: "desc" });
        const items = Array.isArray(data) ? data : data.items || data.data || [];
        setFeedback(items);
      } catch (e) {
        setErr(e.message || "Failed to load feedback");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const latest = useMemo(() => feedback.slice(0, 10), [feedback]);

  return (
    <>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        {/* Hero */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            background:
              "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(14,165,233,0.08))",
            border: "1px solid rgba(2, 6, 23, 0.06)",
          }}
        >
          <Stack direction={{ xs: "column", md: "row" }} alignItems="center" spacing={3}>
            <Stack flex={1} spacing={1}>
              <Typography variant="h1">Turn feedback into insight</Typography>
              <Typography color="text.secondary">
                Collect, visualize, and act on customer signal in minutes—not months.
              </Typography>
              <Stack direction="row" gap={1} mt={1}>
                <Chip icon={<BoltIcon />} label="Serverless-ready" color="primary" variant="outlined" />
                <Chip icon={<InsightsIcon />} label="GenAI Insights" color="secondary" variant="outlined" />
              </Stack>
            </Stack>
          </Stack>
        </Paper>

        {/* Products */}
        <Typography variant="h2" sx={{ mt: 5, mb: 2 }}>
          Products
        </Typography>
        <Grid container spacing={3}>
          {PRODUCTS.map((p) => (
            <Grid key={p.title} item xs={12} sm={6} md={4}>
              <ProductCard {...p} />
            </Grid>
          ))}
        </Grid>

        {/* Latest Feedback */}
        <Typography variant="h2" sx={{ mt: 5, mb: 2 }}>
          Latest Feedback
        </Typography>
        <Paper elevation={2} sx={{ p: 2, borderRadius: 3 }}>
          {loading && <Typography color="text.secondary">Loading…</Typography>}
          {err && <Typography color="error">{err}</Typography>}
          {!loading && !err && latest.length === 0 && (
            <Typography color="text.secondary">No feedback yet.</Typography>
          )}
          {!loading &&
            !err &&
            latest.map((f, i) => (
              <Paper
                key={f.id || i}
                variant="outlined"
                sx={{ p: 1.5, mb: 1.2, borderRadius: 2 }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  {f.product || "Unknown Product"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {f.comment || f.text || f.message}
                </Typography>
                {f.sentiment && (
                  <Chip
                    size="small"
                    label={`Sentiment: ${f.sentiment}`}
                    sx={{ mt: 1 }}
                  />
                )}
              </Paper>
            ))}
        </Paper>
      </Container>
    </>
  );
}
