export type SummaryMetrics = {
  range: { start: number; end: number };
  voltage: { min: number|null; max: number|null; avg: number|null };
  current: { min: number|null; max: number|null; avg: number|null; rms: number|null };
  power: { min_w: number|null; max_w: number|null; avg_w: number|null; factor_avg: number|null };
  energy: { delta_kwh: number|null; peak_kwh: number; offpeak_kwh: number };
  load_factor: number|null;
  efficiency_score: number|null;
  power_distribution: { active_kw: number; reactive_kvar: number; apparent_kva: number };
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function fetchSummary(start?: number, end?: number): Promise<SummaryMetrics> {
  const url = new URL(`${API_BASE}/api/metrics/summary`);
  if (start) url.searchParams.set('start', String(start));
  if (end) url.searchParams.set('end', String(end));
  const token = localStorage.getItem('auth_token') || '';
  const res = await fetch(url.toString(), {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json();
}

export async function fetchVoltageHistory(start: number, end: number) {
  const url = new URL(`${API_BASE}/api/metrics/voltage-history`);
  url.searchParams.set('start', String(start));
  url.searchParams.set('end', String(end));
  const token = localStorage.getItem('auth_token') || '';
  const res = await fetch(url.toString(), {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
  });
  if (!res.ok) throw new Error('Failed to fetch voltage history');
  return res.json();
}
