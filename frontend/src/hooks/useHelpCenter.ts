'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl } from '@/lib/api';
import { sanitizeHelpSearch } from '@/lib/helpSafety';
import { maskSensitiveClientText } from '@/lib/safety';
import { emitSystemEvent } from '@/lib/systemEventBus';
import type { HelpCategory, HelpNetworkState, HelpSystemStatus } from '@/lib/types';

interface UseHelpCenterState {
  query: string;
  activeCategory: HelpCategory;
  systemStatus: HelpSystemStatus;
  setQuery: (q: string) => void;
  setActiveCategory: (cat: HelpCategory) => void;
  refreshStatus: () => Promise<void>;
}

const DEFAULT_STATUS: HelpSystemStatus = {
  networkState: 'checking',
  backendOk: null,
  frontendOk: null,
  phase: null,
  unreadNotifications: null,
  schedulerActive: null,
  observabilityOk: null,
  backupAvailable: null,
  securityLocalOnly: null,
  loading: true,
  error: null,
  lastCheckedAt: null,
};

export function useHelpCenter(): UseHelpCenterState {
  const [query, setQueryRaw] = useState('');
  const [activeCategory, setActiveCategory] = useState<HelpCategory>('all');
  const [systemStatus, setSystemStatus] = useState<HelpSystemStatus>(DEFAULT_STATUS);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const setQuery = useCallback((q: string) => {
    setQueryRaw(sanitizeHelpSearch(q));
  }, []);

  const refreshStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setSystemStatus((prev) => ({ ...prev, loading: true, error: null }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5_000);

    try {
      const healthRes = await fetch(buildApiUrl('/api/health'), {
        cache: 'no-store',
        signal: controller.signal,
      });

      if (!mountedRef.current) return;

      let phase: number | null = null;
      let backendOk = false;
      if (healthRes.ok) {
        const healthData = (await healthRes.json()) as { status?: string; phase?: number };
        backendOk = healthData.status === 'ok';
        phase = typeof healthData.phase === 'number' ? healthData.phase : null;
      }

      let unreadNotifications: number | null = null;
      let schedulerActive: boolean | null = null;
      let observabilityOk: boolean | null = null;
      let backupAvailable: boolean | null = null;
      let securityLocalOnly: boolean | null = null;

      const safeGet = async (path: string) => {
        const c = new AbortController();
        const t = window.setTimeout(() => c.abort(), 3_000);
        try {
          const r = await fetch(buildApiUrl(path), { cache: 'no-store', signal: c.signal });
          return r.ok ? (await r.json()) : null;
        } catch { return null; } finally { window.clearTimeout(t); }
      };

      const [notifData, schedulerData, obsData, backupData] = await Promise.all([
        safeGet('/api/notifications/stats'),
        safeGet('/api/scheduler/status'),
        safeGet('/api/observability/overview'),
        safeGet('/api/backup/status'),
      ]);

      if (!mountedRef.current) return;

      if (notifData && typeof notifData === 'object') {
        unreadNotifications = Number((notifData as Record<string, unknown>).unread ?? 0);
      }
      if (schedulerData && typeof schedulerData === 'object') {
        schedulerActive = Boolean((schedulerData as Record<string, unknown>).enabled);
      }
      if (obsData && typeof obsData === 'object') {
        const obs = obsData as Record<string, unknown>;
        observabilityOk = obs.status === 'ok' || obs.status === 'warning';
        const security = obs.security as Record<string, unknown> | undefined;
        securityLocalOnly = Boolean(security?.localOnly ?? true);
      }
      if (backupData && typeof backupData === 'object') {
        const bk = backupData as Record<string, unknown>;
        backupAvailable = Boolean(bk.enabled) && Number(bk.count ?? 0) > 0;
      }

      const networkState: HelpNetworkState = !backendOk
        ? 'offline'
        : (observabilityOk === false || schedulerActive === false)
          ? 'degraded'
          : 'online';

      setSystemStatus({
        networkState,
        backendOk,
        frontendOk: true,
        phase,
        unreadNotifications,
        schedulerActive,
        observabilityOk,
        backupAvailable,
        securityLocalOnly,
        loading: false,
        error: null,
        lastCheckedAt: new Date().toISOString(),
      });

      emitSystemEvent({
        type: `help.refresh.${networkState}`,
        severity: networkState === 'online' ? 'success' : networkState === 'degraded' ? 'warning' : 'error',
        source: 'backend',
        message: `Actualisation Centre d'aide — état : ${networkState}`,
        details: phase !== null ? `Phase ${phase}` : undefined,
      });

      if (unreadNotifications !== null && unreadNotifications > 0) {
        emitSystemEvent({
          type: 'notifications.unread',
          severity: 'info',
          source: 'notifications',
          message: `${unreadNotifications} notification(s) non lue(s)`,
        });
      }

      if (securityLocalOnly === true) {
        emitSystemEvent({
          type: 'security.localonly.confirmed',
          severity: 'info',
          source: 'security',
          message: 'Mode local-only confirmé — aucune télémétrie externe',
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = err instanceof Error ? maskSensitiveClientText(err.message) : 'Erreur reseau';
      setSystemStatus((prev) => ({
        ...prev,
        networkState: 'offline',
        backendOk: false,
        loading: false,
        error: msg,
        lastCheckedAt: new Date().toISOString(),
      }));
      emitSystemEvent({
        type: 'help.refresh.error',
        severity: 'error',
        source: 'network',
        message: `Erreur refresh Centre d'aide : ${msg}`,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
  const timer = window.setTimeout(() => {
    void refreshStatus();
  }, 0);

  return () => {
    window.clearTimeout(timer);
  };
}, [refreshStatus]);
  return { query, activeCategory, systemStatus, setQuery, setActiveCategory, refreshStatus };
}
