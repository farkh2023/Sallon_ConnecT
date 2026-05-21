'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/api';
import { maskSensitiveClientText } from '@/lib/safety';
import { emitSystemEvent } from '@/lib/systemEventBus';
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

function toBackendStatus(
  data: HealthResponse | null,
  online: boolean,
  error: string | null,
  initialLoad: boolean,
): BackendHealthStatus {
  if (initialLoad) return 'checking';
  if (!online) return 'offline';
  if (error) return 'offline';
  if (!data) return 'unknown';
  return data.status === 'ok' ? 'online' : 'degraded';
}

export function useBackendHealth(pollMs = 30_000): BackendHealthState {
  const online = useOnlineStatus();
  const mountedRef = useRef(true);
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  const initialLoad = lastCheckedAt === null;
  const backendStatus = toBackendStatus(data, online, error, initialLoad);
  const prevStatusRef = useRef<BackendHealthStatus>('checking');

  useEffect(() => {
    if (backendStatus === prevStatusRef.current) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = backendStatus;
    if (backendStatus === 'checking') return;

    const transitions: Record<string, { severity: 'info' | 'success' | 'warning' | 'error'; msg: string }> = {
      online:   { severity: 'success', msg: 'Backend Express en ligne' },
      offline:  { severity: 'error',   msg: 'Backend Express hors ligne' },
      degraded: { severity: 'warning', msg: 'Backend Express dégradé' },
      unknown:  { severity: 'warning', msg: 'État backend inconnu' },
    };
    const cfg = transitions[backendStatus];
    if (cfg) {
      emitSystemEvent({
        type: `backend.${backendStatus}`,
        severity: cfg.severity,
        source: 'backend',
        message: cfg.msg,
        details: prev !== 'checking' ? `Transition : ${prev} → ${backendStatus}` : undefined,
      });
    }
  }, [backendStatus]);

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
