import { useEffect, useState, useCallback } from 'react';
import { fetchSummary, fetchHistory } from '../utils/apiClient';

type SummaryParams = {
  period?: string;
  from?: string | number;
  to?: string | number;
  device_id?: string;
};

type HistoryParams = SummaryParams & { interval_seconds?: number };

export function useTelemetrySummary(params: SummaryParams = { period: 'day' }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchSummary(params)
      .then((res) => setData(res.summary))
      .catch((err) => setError(err?.message || 'Failed to load summary'))
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { summary: data, loading, error, refresh: load };
}

export function useTelemetryHistory(params: HistoryParams) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchHistory(params)
      .then((res) => setData(res))
      .catch((err) => setError(err?.message || 'Failed to load history'))
      .finally(() => setLoading(false));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  return { history: data, loading, error, refresh: load };
}

