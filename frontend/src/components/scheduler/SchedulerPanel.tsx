'use client';

import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafetyNotice } from '@/components/ui/SafetyNotice';
import { formatDate, formatScheduleExpr } from '@/lib/format';
import { apiPost, handleApiError } from '@/lib/api';
import type { Schedule, ScheduleHistoryItem } from '@/lib/types';
import { useState } from 'react';

interface StatusResp   { status: string; enabled: boolean; activeSchedules: number; totalSchedules: number; tickMs: number; nextScheduled: { name: string; at: string } | null }
interface ScheduleResp { schedules: Schedule[] }
interface HistoryResp  { history: ScheduleHistoryItem[] }

export function SchedulerPanel() {
  const status    = useApi<StatusResp>('/api/scheduler/status');
  const schedules = useApi<ScheduleResp>('/api/scheduler/schedules');
  const history   = useApi<HistoryResp>('/api/scheduler/history?limit=10');
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runMsg, setRunMsg]       = useState<string | null>(null);

  usePolling(status.refresh, 30_000, true);

  async function runNow(id: string, name: string) {
    if (!confirm(`Exécuter "${name}" maintenant ?`)) return;
    setRunningId(id);
    setRunMsg(null);
    try {
      const r = await apiPost<{ success: boolean; status: string; durationMs?: number }>(`/api/scheduler/schedules/${id}/run`);
      setRunMsg(`✅ ${r.status} (${r.durationMs ?? 0} ms)`);
      schedules.refresh();
      history.refresh();
    } catch (err) {
      setRunMsg(`❌ ${handleApiError(err)}`);
    } finally {
      setRunningId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex flex-wrap gap-4 items-center">
        {status.data && (
          <>
            <Badge color={status.data.status === 'running' ? 'green' : 'gray'}>
              {status.data.status === 'running' ? '▶ En cours' : '⏹ Arrêté'}
            </Badge>
            <span className="text-xs text-slate-500">{status.data.activeSchedules}/{status.data.totalSchedules} tâches actives</span>
            <span className="text-xs text-slate-600">Tick : {status.data.tickMs / 1000}s</span>
            {status.data.nextScheduled && (
              <span className="text-xs text-slate-500 ml-auto">
                Prochaine : <strong className="text-slate-300">{status.data.nextScheduled.name}</strong> — {formatDate(status.data.nextScheduled.at)}
              </span>
            )}
          </>
        )}
        {status.error && <span className="text-xs text-red-400">{status.error}</span>}
      </div>

      {runMsg && (
        <div className={`text-xs px-3 py-2 rounded-lg border ${runMsg.startsWith('✅') ? 'bg-success/10 border-success/20 text-emerald-400' : 'bg-danger/10 border-danger/20 text-red-400'}`}>
          {runMsg}
        </div>
      )}

      {/* Schedules */}
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">Tâches planifiées</p>
        {schedules.loading && <div className="h-20 animate-pulse bg-white/[0.03] rounded-xl" />}
        {schedules.data?.schedules.length === 0 && <EmptyState icon="📅" title="Aucune tâche configurée" />}
        <div className="space-y-2">
          {schedules.data?.schedules.map(s => (
            <div key={s.id} className={`bg-white/[0.03] border rounded-xl p-3 flex items-center gap-3 flex-wrap ${s.enabled ? 'border-success/20' : 'border-white/[0.07] opacity-70'}`}>
              <Badge color={s.enabled ? 'green' : 'gray'}>{s.enabled ? 'Actif' : 'Inactif'}</Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{s.name}</p>
                <p className="text-xs text-slate-500">{s.actionType} — {formatScheduleExpr(s.schedule)}</p>
                {s.nextRunAt && <p className="text-xs text-slate-600">Prochaine : {formatDate(s.nextRunAt)}</p>}
              </div>
              <Button
                size="xs" variant="secondary"
                loading={runningId === s.id}
                onClick={() => runNow(s.id, s.name)}
              >
                ▶ Exécuter
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {history.data && history.data.history.length > 0 && (
        <div>
          <p className="text-sm font-medium text-slate-400 mb-2">Historique récent</p>
          <div className="space-y-1.5">
            {history.data.history.map(h => (
              <div key={h.id} className={`flex items-center gap-3 text-xs px-3 py-2 rounded-lg border ${
                h.status === 'success' ? 'border-success/15 bg-success/5' :
                h.status === 'failed'  ? 'border-danger/15 bg-danger/5'  : 'border-white/[0.06] bg-white/[0.02]'
              }`}>
                <span>{h.status === 'success' ? '✅' : h.status === 'failed' ? '❌' : '⏭'}</span>
                <span className="font-medium text-slate-300 truncate flex-1">{h.scheduleName}</span>
                <span className="text-slate-500 shrink-0">{h.durationMs} ms</span>
                <span className="text-slate-600 shrink-0">{formatDate(h.finishedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <SafetyNotice>Actions sensibles bloquées par défaut — streaming, scènes SmartThings, commandes TV non planifiables.</SafetyNotice>
    </div>
  );
}
