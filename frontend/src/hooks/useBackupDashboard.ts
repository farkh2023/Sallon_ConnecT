'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost, apiDelete, buildApiUrl, handleApiError } from '../lib/api';
import type {
  BackupDashboardResponse,
  BackupDashboardItem,
  BackupDashboardSafety,
  BackupActionResult,
  BackupVerifyResult,
  BackupRestorePrepareResult,
} from '../lib/types';

export interface UseBackupDashboardState {
  dashboard:    BackupDashboardResponse | null;
  items:        BackupDashboardItem[];
  safety:       BackupDashboardSafety | null;
  loading:      boolean;
  actionLoading: string | null;
  error:        string | null;
}

export function useBackupDashboard() {
  const mountedRef    = useRef(true);
  const [dashboard, setDashboard]       = useState<BackupDashboardResponse | null>(null);
  const [items, setItems]               = useState<BackupDashboardItem[]>([]);
  const [safety, setSafety]             = useState<BackupDashboardSafety | null>(null);
  const [loading, setLoading]           = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadDashboard = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<BackupDashboardResponse>('/api/backups/dashboard');
      if (!mountedRef.current) return;
      setDashboard(data);
      setItems(data.items ?? []);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(handleApiError(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      const data = await apiGet<{ items: BackupDashboardItem[]; total: number }>('/api/backups/list');
      if (mountedRef.current) setItems(data.items ?? []);
    } catch (err) {
      if (mountedRef.current) setError(handleApiError(err));
    }
  }, []);

  const loadSafety = useCallback(async () => {
    try {
      const data = await apiGet<BackupDashboardSafety>('/api/backups/safety');
      if (mountedRef.current) setSafety(data);
    } catch { /* non-bloquant */ }
  }, []);

  const createBackup = useCallback(async (type: 'quick' | 'full', exportZip = false): Promise<BackupActionResult> => {
    setActionLoading('create');
    try {
      const result = await apiPost<BackupActionResult>('/api/backups/create', { type, exportZip });
      return result;
    } catch (err) {
      return { ok: false, error: handleApiError(err) };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const verifyBackup = useCallback(async (id: string): Promise<BackupVerifyResult> => {
    setActionLoading(`verify-${id}`);
    try {
      const result = await apiPost<BackupVerifyResult>(`/api/backups/${encodeURIComponent(id)}/verify`);
      return result;
    } catch (err) {
      return { ok: false, results: [], error: handleApiError(err) };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const exportBackup = useCallback(async (id: string): Promise<BackupActionResult> => {
    setActionLoading(`export-${id}`);
    try {
      const result = await apiPost<BackupActionResult>(`/api/backups/${encodeURIComponent(id)}/export`);
      return result;
    } catch (err) {
      return { ok: false, error: handleApiError(err) };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const deleteBackup = useCallback(async (id: string, confirmation: string): Promise<BackupActionResult> => {
    setActionLoading(`delete-${id}`);
    try {
      const result = await apiDelete<BackupActionResult>(
        `/api/backups/${encodeURIComponent(id)}`,
        { confirmation }
      );
      return result;
    } catch (err) {
      return { ok: false, error: handleApiError(err) };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const prepareRestore = useCallback(async (id: string): Promise<BackupRestorePrepareResult> => {
    setActionLoading(`restore-${id}`);
    try {
      const result = await apiPost<BackupRestorePrepareResult>(
        `/api/backups/${encodeURIComponent(id)}/restore/prepare`
      );
      return result;
    } catch (err) {
      return {
        ok: false, snapshotId: id, warning: '', instruction: '', command: '',
        risks: [], localOnly: true, noAutoRestore: true, error: handleApiError(err),
      };
    } finally {
      if (mountedRef.current) setActionLoading(null);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const id = window.setTimeout(() => { void loadDashboard(); void loadSafety(); }, 0);
    return () => window.clearTimeout(id);
  }, [loadDashboard, loadSafety]);

  return {
    dashboard,
    items,
    safety,
    loading,
    actionLoading,
    error,
    loadDashboard,
    loadBackups,
    loadSafety,
    createBackup,
    verifyBackup,
    exportBackup,
    deleteBackup,
    prepareRestore,
    refresh,
  };
}
