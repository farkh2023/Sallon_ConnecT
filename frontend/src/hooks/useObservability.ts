'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiDelete, apiPost, buildApiUrl, handleApiError } from '@/lib/api';
import type {
  ObservabilityOverview,
  ObservabilitySnapshot,
  SnapshotChartFilters,
  SnapshotStats,
  SnapshotTimelineResponse,
  SnapshotTrends,
} from '@/lib/types';

interface UseObservabilityState {
  overview: ObservabilityOverview | null;
  loading: boolean;
  error: string | null;
  lastRefreshedAt: string | null;
  refresh: () => Promise<void>;
  snapshots: ObservabilitySnapshot[];
  snapshotStats: SnapshotStats | null;
  snapshotTrends: SnapshotTrends | null;
  snapshotLoading: boolean;
  snapshotError: string | null;
  loadSnapshots: () => Promise<void>;
  createSnapshot: () => Promise<ObservabilitySnapshot | null>;
  loadSnapshotStats: () => Promise<void>;
  loadSnapshotTrends: () => Promise<void>;
  clearSnapshots: () => Promise<void>;
  timeline: SnapshotTimelineResponse | null;
  timelineLoading: boolean;
  timelineError: string | null;
  loadSnapshotTimeline: (filters?: SnapshotChartFilters) => Promise<void>;
  exportSnapshotsJson: () => void;
  exportSnapshotsCsv: () => void;
}

export function useObservability(pollMs = 0): UseObservabilityState {
  const mountedRef = useRef(true);

  const [overview, setOverview] = useState<ObservabilityOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);

  const [snapshots, setSnapshots] = useState<ObservabilitySnapshot[]>([]);
  const [snapshotStats, setSnapshotStats] = useState<SnapshotStats | null>(null);
  const [snapshotTrends, setSnapshotTrends] = useState<SnapshotTrends | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<SnapshotTimelineResponse | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
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
    const id = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    if (pollMs <= 0 || typeof window === 'undefined') return;
    const id = window.setInterval(() => { void refresh(); }, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  const loadSnapshots = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const res = await fetch(buildApiUrl('/api/observability/snapshots'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { snapshots: ObservabilitySnapshot[]; total: number };
      if (mountedRef.current) setSnapshots(json.snapshots || []);
    } catch (err) {
      if (mountedRef.current) setSnapshotError(handleApiError(err));
    } finally {
      if (mountedRef.current) setSnapshotLoading(false);
    }
  }, []);

  const createSnapshot = useCallback(async (): Promise<ObservabilitySnapshot | null> => {
    if (typeof window === 'undefined') return null;
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      const snapshot = await apiPost<ObservabilitySnapshot>('/api/observability/snapshots');
      if (mountedRef.current) {
        setSnapshots(prev => [snapshot, ...prev]);
        setSnapshotStats(null);
        setSnapshotTrends(null);
        setTimeline(null);
      }
      return snapshot;
    } catch (err) {
      if (mountedRef.current) setSnapshotError(handleApiError(err));
      return null;
    } finally {
      if (mountedRef.current) setSnapshotLoading(false);
    }
  }, []);

  const loadSnapshotStats = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(buildApiUrl('/api/observability/snapshots/stats'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SnapshotStats;
      if (mountedRef.current) setSnapshotStats(json);
    } catch (err) {
      if (mountedRef.current) setSnapshotError(handleApiError(err));
    }
  }, []);

  const loadSnapshotTrends = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(buildApiUrl('/api/observability/snapshots/trends'), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SnapshotTrends;
      if (mountedRef.current) setSnapshotTrends(json);
    } catch (err) {
      if (mountedRef.current) setSnapshotError(handleApiError(err));
    }
  }, []);

  const clearSnapshots = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSnapshotLoading(true);
    setSnapshotError(null);
    try {
      await apiDelete('/api/observability/snapshots');
      if (mountedRef.current) {
        setSnapshots([]);
        setSnapshotStats(null);
        setSnapshotTrends(null);
        setTimeline(null);
      }
    } catch (err) {
      if (mountedRef.current) setSnapshotError(handleApiError(err));
    } finally {
      if (mountedRef.current) setSnapshotLoading(false);
    }
  }, []);

  const loadSnapshotTimeline = useCallback(async (filters?: SnapshotChartFilters) => {
    if (typeof window === 'undefined') return;
    setTimelineLoading(true);
    setTimelineError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.set('limit', String(filters.limit));
      if (filters?.status) params.set('status', filters.status);
      if (filters?.source) params.set('source', filters.source);
      if (filters?.from) params.set('from', filters.from);
      if (filters?.to) params.set('to', filters.to);
      const query = params.toString();
      const url = buildApiUrl(`/api/observability/snapshots/timeline${query ? `?${query}` : ''}`);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as SnapshotTimelineResponse;
      if (mountedRef.current) setTimeline(json);
    } catch (err) {
      if (mountedRef.current) setTimelineError(handleApiError(err));
    } finally {
      if (mountedRef.current) setTimelineLoading(false);
    }
  }, []);

  const exportSnapshotsJson = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open(buildApiUrl('/api/observability/snapshots/export.json'), '_blank', 'noopener,noreferrer');
  }, []);

  const exportSnapshotsCsv = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.open(buildApiUrl('/api/observability/snapshots/export.csv'), '_blank', 'noopener,noreferrer');
  }, []);

  return {
    overview,
    loading,
    error,
    lastRefreshedAt,
    refresh,
    snapshots,
    snapshotStats,
    snapshotTrends,
    snapshotLoading,
    snapshotError,
    loadSnapshots,
    createSnapshot,
    loadSnapshotStats,
    loadSnapshotTrends,
    clearSnapshots,
    timeline,
    timelineLoading,
    timelineError,
    loadSnapshotTimeline,
    exportSnapshotsJson,
    exportSnapshotsCsv,
  };
}
