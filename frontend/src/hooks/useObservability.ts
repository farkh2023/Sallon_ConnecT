'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl, handleApiError } from '@/lib/api';
import type { ObservabilityOverview } from '@/lib/types';

interface UseObservabilityState {
  overview: ObservabilityOverview | null;
  loading: boolean;
  error: string | null;
  lastRefreshedAt: string | null;
  refresh: () => Promise<void>;
}

export function useObservability(pollMs = 0): UseObservabilityState {
  const mountedRef = useRef(true);
  const [overview, setOverview] = useState<ObservabilityOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5_000);
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl('/api/observability/overview'), {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = (await response.json()) as ObservabilityOverview;
      if (!mountedRef.current) return;

      setOverview(json);
      setLastRefreshedAt(new Date().toISOString());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(handleApiError(err));
    } finally {
      window.clearTimeout(timeout);
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    if (pollMs <= 0 || typeof window === 'undefined') return;
    const id = window.setInterval(() => {
      void refresh();
    }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  return {
    overview,
    loading,
    error,
    lastRefreshedAt,
    refresh,
  };
}
