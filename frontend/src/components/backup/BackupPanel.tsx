import React, { useEffect, useState } from 'react';
import { useBackup } from '../../hooks/useBackup';
import { BackupSafetyNotice } from './BackupSafetyNotice';
import { BackupStatusCard } from './BackupStatusCard';
import { BackupCreateForm } from './BackupCreateForm';
import { BackupList } from './BackupList';
import { BackupAudit } from './BackupAudit';

export function BackupPanel() {
  const {
    status, backups, audit, loading, error,
    loadBackupStatus, loadBackups, createBackup,
    loadBackupManifest, verifyBackup, dryRunRestore,
    restoreBackup, deleteBackup, loadBackupAudit,
    clearBackupAudit,
  } = useBackup();

  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBackupStatus();
    loadBackups();
    loadBackupAudit();
  }, [loadBackupStatus, loadBackups, loadBackupAudit]);

  async function handleCreate(opts: { includeRuntimeSafe: boolean; includeAudits: boolean; includeLogs: boolean; reason: string }) {
    setCreateError(null);
    setCreateSuccess(null);
    try {
      const result = await createBackup(opts) as { backupId?: string };
      setCreateSuccess(`Sauvegarde créée : ${String(result?.backupId || '').slice(0, 20)}`);
      await loadBackupAudit();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur création');
    }
  }

  async function handleDryRun(backupId: string) {
    const result = await dryRunRestore(backupId);
    await loadBackupAudit();
    return result;
  }

  async function handleRestore(backupId: string, opts: { confirmationCode: string; reason: string }) {
    await restoreBackup(backupId, opts);
    await loadBackupAudit();
  }

  async function handleDelete(backupId: string) {
    await deleteBackup(backupId);
    await loadBackupAudit();
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Sauvegarde locale</h2>

      <BackupSafetyNotice />
      <BackupStatusCard status={status} loading={loading && !status} />

      <BackupCreateForm onCreate={handleCreate} loading={loading} />

      {createSuccess && <div style={{ color: '#16a34a', fontSize: 13, marginBottom: 8 }}>{createSuccess}</div>}
      {(createError || error) && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{createError || error}</div>}

      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Sauvegardes ({backups.length})</h3>
      <BackupList
        backups={backups}
        loading={loading && backups.length === 0}
        onVerify={verifyBackup}
        onDelete={handleDelete}
        onLoadManifest={loadBackupManifest}
        onDryRun={handleDryRun}
        onRestore={handleRestore}
      />

      <BackupAudit audit={audit} onClear={clearBackupAudit} />
    </div>
  );
}
