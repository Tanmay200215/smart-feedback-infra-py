// Simple API client (works with FastAPI or API Gateway/Lambda)
const API_BASE = import.meta.env.VITE_API_BASE || "/api";

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json().catch(() => ({}));
}

export async function listFeedback(params = {}) {
  const q = new URLSearchParams(params).toString();
  return http(`/feedback${q ? `?${q}` : ""}`);
}

export async function postFeedback(payload) {
  return http(`/feedback`, { method: "POST", body: JSON.stringify(payload) });
}

export async function getInsights() {
  return http(`/insights`);
}
