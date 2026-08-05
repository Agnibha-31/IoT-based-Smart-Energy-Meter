import { getAccessToken } from './apiClient';

export type LiveReading = {
  id: number;
  device_id: string;
  voltage: number | null;
  current: number | null;
  real_power_kw: number | null;
  apparent_power_kva: number | null;
  reactive_power_kvar: number | null;
  energy_kwh: number | null;
  energy: number | null; // Alias for energy_kwh
  total_energy_kwh: number | null;
  frequency: number | null;
  power_factor: number | null;
  captured_at: number | null;
  created_at: number; // epoch seconds
};

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export function subscribeToLiveReadings(onReading: (r: LiveReading) => void) {
  const token = getAccessToken();
  const url = `${API_BASE}/api/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  const es = new EventSource(url, { withCredentials: false } as any);
  es.onmessage = (evt) => {
    try {
      const data = JSON.parse(evt.data);
      onReading(data);
    } catch {}
  };
  es.onerror = () => {
    // Let browser retry with SSE default backoff
  };
  return () => es.close();
}

export async function fetchLatest(deviceId?: string) {
  const url = new URL(`${API_BASE}/api/readings/latest`);
  if (deviceId) url.searchParams.set('device_id', deviceId);
  const token = getAccessToken();
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch latest');
  return res.json();
}

