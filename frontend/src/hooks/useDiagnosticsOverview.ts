'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { buildApiUrl, handleApiError } from '@/lib/api';
import { emitSystemEvent } from '@/lib/systemEventBus';
import { isStorageAvailable } from '@/lib/systemEventStorage';
import type {
  DiagnosticsApiResponse,
  DiagnosticEntry,
  DiagnosticEntryStatus,
  DiagnosticSnapshot,
  DiagnosticStatus,
} from '@/lib/types';

export interface UseDiagnosticsOverviewOptions {
  autoRefreshMs?: number;
}

export interface UseDiagnosticsOverviewState {
  data: DiagnosticSnapshot | null;
  raw: DiagnosticsApiResponse | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
  refresh: () => Promise<void>;
  exportJson: () => void;
}

function entry(
  status: DiagnosticEntryStatus,
  label: string,
  score: number,
  detail?: string,
): DiagnosticEntry {
  return { status, label, score, detail };
}

function buildSnapshot(
  api: DiagnosticsApiResponse,
  sseConnected: boolean,
  storageAvailable: boolean,
): DiagnosticSnapshot {
  // Backend
  const backendOk = api.status === 'ok';
  const backendEntry = entry(
    backendOk ? 'ok' : 'degraded',
    'Backend',
    backendOk ? 20 : 0,
    backendOk ? `Uptime ${api.uptime ?? 0}s · ${api.nodeVersion ?? ''}` : 'Backend dégradé',
  );

  // SSE
  const sseClients = api.sse?.clients ?? 0;
  const sseEntry = entry(
    sseConnected ? 'ok' : 'degraded',
    'SSE',
    sseConnected ? 15 : 0,
    sseConnected
      ? `${sseClients} client(s) connecté(s)`
      : 'Flux SSE non connecté',
  );

  // Scheduler
  const schedulerStatus = api.scheduler?.status ?? 'unknown';
  const schedulerRunning = schedulerStatus === 'running';
  const schedulerEntry = entry(
    schedulerRunning ? 'ok' : 'degraded',
    'Scheduler',
    schedulerRunning ? 10 : 0,
    schedulerRunning
      ? `${api.scheduler?.activeSchedules ?? 0}/${api.scheduler?.totalSchedules ?? 0} actif(s)`
      : `Statut: ${schedulerStatus}`,
  );

  // Backup
  const backupOk = api.backup?.enabled ?? false;
  const backupEntry = entry(
    backupOk ? 'ok' : 'degraded',
    'Backup',
    backupOk ? 10 : 0,
    backupOk
      ? `${api.backup?.count ?? 0} sauvegarde(s)`
      : 'Backup désactivé',
  );

  // Notifications
  const notifTotal = api.notifications?.total ?? 0;
  const notifUnread = api.notifications?.unread ?? 0;
  const notifEntry = entry(
    'ok',
    'Notifications',
    10,
    `${notifTotal} total · ${notifUnread} non lu(s)`,
  );

  // Storage
  const storageEntry = entry(
    storageAvailable ? 'ok' : 'degraded',
    'Stockage local',
    storageAvailable ? 10 : 0,
    storageAvailable ? 'localStorage disponible' : 'localStorage indisponible',
  );

  // Security
  const secOk = (api.security?.localOnly ?? false) &&
    !(api.security?.firebase ?? true) &&
    !(api.security?.cloudServices ?? true);
  const secEntry = entry(
    secOk ? 'ok' : 'degraded',
    'Sécurité local-only',
    secOk ? 15 : 0,
    secOk ? 'Aucune télémétrie · local uniquement' : 'Avertissement sécurité',
  );

  // Frontend (always ok when this code runs)
  const frontendEntry = entry('ok', 'Frontend', 0, 'Interface opérationnelle');

  // Network (derived from backend reachability)
  const networkEntry = entry(
    backendOk ? 'ok' : 'offline',
    'Réseau',
    0,
    backendOk ? 'Backend joignable' : 'Backend injoignable',
  );

  const score =
    backendEntry.score +
    sseEntry.score +
    schedulerEntry.score +
    backupEntry.score +
    notifEntry.score +
    storageEntry.score +
    secEntry.score +
    10; // no critical errors (implied by successful fetch)

  const overallStatus: DiagnosticStatus =
    score >= 80 ? 'healthy' : score >= 50 ? 'degraded' : score > 0 ? 'degraded' : 'offline';

  return {
    timestamp: api.timestamp,
    overallStatus,
    score: Math.min(100, score),
    backend:       backendEntry,
    frontend:      frontendEntry,
    sse:           sseEntry,
    network:       networkEntry,
    storage:       storageEntry,
    scheduler:     schedulerEntry,
    backup:        backupEntry,
    notifications: notifEntry,
    security:      secEntry,
  };
}

export function useDiagnosticsOverview(
  options: UseDiagnosticsOverviewOptions = {},
): UseDiagnosticsOverviewState {
  const { autoRefreshMs } = options;

  const [data, setData] = useState<DiagnosticSnapshot | null>(null);
  const [raw, setRaw] = useState<DiagnosticsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refresh = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildApiUrl('/api/diagnostics/overview'), {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const apiData = (await res.json()) as DiagnosticsApiResponse;
      if (!mountedRef.current) return;

      // Detect SSE by checking if the browser EventSource is available and connected
      // We use a simple proxy: if the backend shows >=1 client, SSE is connected
      const sseConnected = typeof EventSource !== 'undefined' && (apiData.sse?.clients ?? 0) >= 1;
      const storageOk = isStorageAvailable();

      const snapshot = buildSnapshot(apiData, sseConnected, storageOk);
      setRaw(apiData);
      setData(snapshot);
      setLastFetchedAt(new Date().toISOString());

      // Emit to bus if score drops critically
      if (snapshot.score < 50) {
        emitSystemEvent({
          type: 'diagnostic.degraded',
          severity: 'warning',
          source: 'frontend',
          message: `Santé système dégradée — score ${snapshot.score}/100`,
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const msg = handleApiError(err);
      setError(msg);
      emitSystemEvent({
        type: 'diagnostic.error',
        severity: 'error',
        source: 'frontend',
        message: `Diagnostic indisponible : ${msg}`,
      });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(id);
  }, [refresh]);

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs <= 0 || typeof window === 'undefined') return;
    const id = window.setInterval(() => { void refresh(); }, autoRefreshMs);
    return () => window.clearInterval(id);
  }, [autoRefreshMs, refresh]);

  const exportJson = useCallback(() => {
    if (!raw || typeof document === 'undefined') return;
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [raw]);

  return { data, raw, loading, error, lastFetchedAt, refresh, exportJson };
}
