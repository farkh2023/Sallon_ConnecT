'use client';

import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { SafetyNotice } from '@/components/ui/SafetyNotice';

interface AdbStatusResp { status: string; enabled: boolean; readOnly: boolean; deviceConnected?: boolean }
interface AdbDiagResp   { status: string; checks: Record<string, unknown> }

export function AdbPanel() {
  const status = useApi<AdbStatusResp>('/api/adb/status');
  const diag   = useApi<AdbDiagResp>('/api/adb/diagnostics');

  return (
    <div className="space-y-3">
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-300">Statut ADB</p>
          {status.data && (
            <Badge color={status.data.enabled ? (status.data.deviceConnected ? 'green' : 'yellow') : 'gray'}>
              {status.data.enabled ? (status.data.deviceConnected ? 'Connecté' : 'Non connecté') : 'Désactivé'}
            </Badge>
          )}
        </div>
        {status.error && <p className="text-xs text-red-400">{status.error}</p>}
        {status.data && (
          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex gap-2"><span>Lecture seule :</span><span className="text-slate-400">{status.data.readOnly ? 'Oui' : 'Non'}</span></div>
            <div className="flex gap-2"><span>Statut :</span><span className="text-slate-400">{status.data.status}</span></div>
          </div>
        )}
      </div>

      {diag.data && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs font-medium text-slate-400 mb-2">Diagnostics (lecture seule)</p>
          <pre className="text-xs text-slate-500 font-mono overflow-x-auto max-h-32 scrollbar-thin">
            {JSON.stringify(diag.data.checks, null, 2)}
          </pre>
        </div>
      )}

      <SafetyNotice>ADB en lecture seule — aucune écriture, push ou pull de fichiers.</SafetyNotice>
    </div>
  );
}
