import { useState } from "react";
import {
  Paper, Typography, TextField, MenuItem, Button, Stack, Snackbar, Alert, Box
} from "@mui/material";
import { postFeedback } from "../api";

const PRODUCTS = ["Product A", "Product B", "Product C"];

export default function Submit() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    product: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, type: "success", msg: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.product || !form.message) {
      setToast({ open: true, type: "warning", msg: "Please fill all fields." });
      return;
    }
    try {
      setSubmitting(true);
      await postFeedback({
        name: form.name,
        email: form.email,
        product: form.product,
        comment: form.message,   // backend often expects comment/text/message; using "comment"
      });
      setToast({ open: true, type: "success", msg: "Thanks! Your feedback was submitted." });
      setForm({ name: "", email: "", product: "", message: "" });
    } catch (err) {
      setToast({ open: true, type: "error", msg: err.message || "Submit failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: "grid", placeItems: "start", py: 5, mx:"25rem" }}>
      <Paper elevation={2} sx={{ p: { xs: 4, md: 5 }, borderRadius: 3, width: "100%", maxWidth: 1080 }}>
        <Typography variant="h2" sx={{ mb: 1.5 }}>Submit Feedback</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Tell us what’s working and what we should improve.
        </Typography>

        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Name"
                name="name"
                value={form.name}
                onChange={onChange}
                fullWidth
                required
              />
              <TextField
                type="email"
                label="Email"
                name="email"
                value={form.email}
                onChange={onChange}
                fullWidth
                required
              />
            </Stack>

            <TextField
              select
              label="Product"
              name="product"
              value={form.product}
              onChange={onChange}
              fullWidth
              required
            >
              {PRODUCTS.map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Your feedback"
              name="message"
              value={form.message}
              onChange={onChange}
              fullWidth
              required
              multiline
              minRows={4}
              placeholder="Share details about your experience…"
            />

            <Stack direction="row" justifyContent="flex-end">
              <Button type="submit" variant="contained" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit"}
              </Button>
            </Stack>
          </Stack>
        </form>
      </Paper>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.type}
          onClose={() => setToast((t) => ({ ...t, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
