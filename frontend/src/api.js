const API_BASE = '/api';

export const fetchStats = async () => {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
};

export const fetchSessions = async (page = 1, limit = 50, search = '') => {
  const params = new URLSearchParams({ page, limit, search });
  const res = await fetch(`${API_BASE}/sessions?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch sessions');
  return res.json();
};

export const fetchSessionEvents = async (sessionId) => {
  const res = await fetch(`${API_BASE}/sessions/${encodeURIComponent(sessionId)}`);
  if (!res.ok) throw new Error('Failed to fetch session journey');
  return res.json();
};

export const fetchHeatmapData = async (pageUrl) => {
  const res = await fetch(`${API_BASE}/heatmap?pageUrl=${encodeURIComponent(pageUrl)}`);
  if (!res.ok) throw new Error('Failed to fetch heatmap data');
  return res.json();
};

export const fetchPages = async () => {
  const res = await fetch(`${API_BASE}/pages`);
  if (!res.ok) throw new Error('Failed to fetch pages');
  return res.json();
};

export const seedDemoData = async (count = 8) => {
  const res = await fetch(`${API_BASE}/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count }),
  });
  if (!res.ok) throw new Error('Failed to seed demo data');
  return res.json();
};

export const checkHealth = async () => {
  const res = await fetch('/health');
  if (!res.ok) throw new Error('Backend health check failed');
  return res.json();
};
