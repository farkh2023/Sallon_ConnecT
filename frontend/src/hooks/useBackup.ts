import { useState, useCallback } from 'react';
import { apiGet, apiPost, apiDelete } from '../lib/api';
import type {
  BackupStatus,
  BackupItem,
  BackupManifest,
  BackupAuditEntry,
  BackupDryRunResult,
  BackupSafety,
} from '../lib/types';

interface CreateBackupOptions {
  includeRuntimeSafe?: boolean;
  includeAudits?: boolean;
  includeLogs?: boolean;
  reason?: string;
}

interface RestoreOptions {
  confirmationCode: string;
  reason?: string;
}

interface VerifyResult {
  backupId: string;
  valid: boolean;
  issues: string[];
}

export function useBackup() {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [audit, setAudit] = useState<BackupAuditEntry[]>([]);
  const [safety, setSafety] = useState<BackupSafety | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBackupStatus = useCallback(async () => {
    try {
      const data = await apiGet<BackupStatus>('/api/backup/status');
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur statut backup');
    }
  }, []);

  const loadBackups = useCallback(async () => {
    try {
      const data = await apiGet<{ backups: BackupItem[] }>('/api/backup/backups');
      setBackups(data.backups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur liste backups');
    }
  }, []);

  const createBackup = useCallback(async (options: CreateBackupOptions = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<BackupItem & { status: string }>('/api/backup/create', {
        includeRuntimeSafe: options.includeRuntimeSafe !== false,
        includeAudits: options.includeAudits === true,
        includeLogs: options.includeLogs === true,
        reason: options.reason || 'Sauvegarde manuelle',
      });
      await loadBackups();
      await loadBackupStatus();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur création backup';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBackups, loadBackupStatus]);

  const loadBackupManifest = useCallback(async (backupId: string): Promise<BackupManifest | null> => {
    try {
      const data = await apiGet<{ manifest: BackupManifest }>(`/api/backup/backups/${backupId}/manifest`);
      return data.manifest;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur manifest');
      return null;
    }
  }, []);

  const verifyBackup = useCallback(async (backupId: string): Promise<VerifyResult | null> => {
    try {
      const result = await apiPost<VerifyResult>(`/api/backup/backups/${backupId}/verify`);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur vérification');
      return null;
    }
  }, []);

  const dryRunRestore = useCallback(async (backupId: string): Promise<BackupDryRunResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<BackupDryRunResult>(`/api/backup/backups/${backupId}/restore/dry-run`);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur dry-run');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreBackup = useCallback(async (backupId: string, options: RestoreOptions) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost(`/api/backup/backups/${backupId}/restore`, options);
      await loadBackups();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur restauration';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBackups]);

  const deleteBackup = useCallback(async (backupId: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/api/backup/backups/${backupId}`);
      await loadBackups();
      await loadBackupStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erreur suppression';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadBackups, loadBackupStatus]);

  const loadBackupAudit = useCallback(async () => {
    try {
      const data = await apiGet<{ audit: BackupAuditEntry[] }>('/api/backup/audit');
      setAudit(data.audit || []);
    } catch { /* ignore */ }
  }, []);

  const clearBackupAudit = useCallback(async () => {
    try {
      await apiDelete('/api/backup/audit');
      setAudit([]);
    } catch { /* ignore */ }
  }, []);

  const loadBackupSafety = useCallback(async () => {
    try {
      const data = await apiGet<BackupSafety>('/api/backup/safety');
      setSafety(data);
    } catch { /* ignore */ }
  }, []);

  return {
    status, backups, audit, safety, loading, error,
    loadBackupStatus, loadBackups, createBackup,
    loadBackupManifest, verifyBackup, dryRunRestore,
    restoreBackup, deleteBackup, loadBackupAudit,
    clearBackupAudit, loadBackupSafety,
  };
}
