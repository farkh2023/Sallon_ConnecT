'use client';

import { useState } from 'react';
import { useBackupDashboard } from '@/hooks/useBackupDashboard';
import type { BackupVerifyResult, BackupActionResult } from '@/lib/types';

import { BackupSummaryCards }    from './BackupSummaryCards';
import { BackupActionsBar }      from './BackupActionsBar';
import { BackupCreateModal }     from './BackupCreateModal';
import { BackupDeleteConfirm }   from './BackupDeleteConfirm';
import { BackupTable }           from './BackupTable';
import { BackupVerifyPanel }     from './BackupVerifyPanel';
import { BackupExportPanel }     from './BackupExportPanel';
import { BackupDiagnosticPanel } from './BackupDiagnosticPanel';
import { BackupSafetyNotice }    from './BackupSafetyNotice';
import { BackupLimitations }     from './BackupLimitations';
import { RestoreAssistantWizard } from './restore-assistant/RestoreAssistantWizard';

export function BackupDashboardPanel() {
  const {
    dashboard, items, loading, error,
    loadDashboard, createBackup, verifyBackup, exportBackup, deleteBackup,
  } = useBackupDashboard();

  const [showCreate,   setShowCreate]   = useState(false);
  const [deleteId,     setDeleteId]     = useState<string | null>(null);
  const [verifyRes,    setVerifyRes]    = useState<BackupVerifyResult | null>(null);
  const [exportRes,    setExportRes]    = useState<BackupActionResult | null>(null);
  const [restoreId,    setRestoreId]    = useState<string | null>(null);

  const handleQuickBackup = async () => {
    await createBackup('quick', false);
    await loadDashboard();
  };

  const handleFullBackup = async () => {
    await createBackup('full', false);
    await loadDashboard();
  };

  const handleCreate = async (type: 'quick' | 'full', exportZip: boolean) => {
    await createBackup(type, exportZip);
    await loadDashboard();
  };

  const handleVerify = async (id: string) => {
    const res = await verifyBackup(id);
    if (res) setVerifyRes(res);
  };

  const handleExport = async (id: string) => {
    const res = await exportBackup(id);
    if (res) setExportRes(res);
  };

  const handleRestore = (id: string) => {
    setRestoreId(id);
  };

  const handleDelete = async (id: string, _confirmation: string) => {
    await deleteBackup(id, 'SUPPRIMER');
    await loadDashboard();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <BackupSummaryCards summary={dashboard?.summary ?? null} loading={loading} />

      <BackupActionsBar
        loading={loading}
        onQuickBackup={handleQuickBackup}
        onFullBackup={handleFullBackup}
        onRefresh={loadDashboard}
        onOpenCreate={() => setShowCreate(true)}
      />

      {verifyRes  && <BackupVerifyPanel result={verifyRes} onClose={() => setVerifyRes(null)} />}
      {exportRes  && <BackupExportPanel result={exportRes} onClose={() => setExportRes(null)} />}
      {restoreId  && (
        <RestoreAssistantWizard
          snapshotId={restoreId}
          onClose={() => setRestoreId(null)}
        />
      )}

      <BackupTable
        items={items}
        loading={loading}
        onVerify={handleVerify}
        onExport={handleExport}
        onRestore={handleRestore}
        onDelete={id => setDeleteId(id)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <BackupSafetyNotice />
        <BackupLimitations />
      </div>

      <BackupDiagnosticPanel diagnostic={dashboard?.diagnostic ?? null} />

      <BackupCreateModal
        open={showCreate}
        loading={loading}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
      />

      <BackupDeleteConfirm
        snapshotId={deleteId ?? ''}
        open={deleteId !== null}
        loading={loading}
        onClose={() => setDeleteId(null)}
        onDelete={handleDelete}
      />
    </div>
  );
}
