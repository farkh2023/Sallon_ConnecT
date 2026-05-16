'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/api';
import { maskSensitiveClientText } from '@/lib/safety';
import type { BackendHealthStatus, OfflineStatus } from '@/lib/types';
import { useOnlineStatus } from './useOnlineStatus';

interface HealthResponse {
  status?: string;
  phase?: number;
  server?: string;
  timestamp?: string;
}

interface BackendHealthState extends OfflineStatus {
  data: HealthResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

function toBackendStatus(data: HealthResponse | null, online: boolean, error: string | null): BackendHealthStatus {
  if (!online) return 'offline';
  if (error) return 'offline';
  if (!data) return 'unknown';
  return data.status === 'ok' ? 'online' : 'degraded';
}

export function useBackendHealth(pollMs = 30_000): BackendHealthState {
  const online = useOnlineStatus();
  const mountedRef = useRef(true);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 4_000);
    setLoading(true);

    try {
      const response = await fetch(buildApiUrl('/api/health'), {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const json = (await response.json()) as HealthResponse;
      if (!mountedRef.current) return;

      setData(json);
      setError(null);
      setLastCheckedAt(new Date().toISOString());
    } catch (err) {
      if (!mountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Backend local indisponible';
      setError(maskSensitiveClientText(message));
      setData(null);
      setLastCheckedAt(new Date().toISOString());
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
    const id = window.setInterval(refresh, pollMs);
    return () => window.clearInterval(id);
  }, [pollMs, refresh]);

  const backendStatus = toBackendStatus(data, online, error);

  return {
    online,
    backendAvailable: backendStatus === 'online' || backendStatus === 'degraded',
    backendStatus,
    lastCheckedAt,
    message: error,
    data,
    loading,
    error,
    refresh,
  };
}
