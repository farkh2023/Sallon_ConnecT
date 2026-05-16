'use client';

import { useApi } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SafetyNotice } from '@/components/ui/SafetyNotice';
import type { DlnaDevice } from '@/lib/types';

interface DlnaStatusResp  { enabled: boolean; status: string }
interface DlnaDevicesResp { count: number; devices: DlnaDevice[] }

export function DlnaPanel() {
  const status  = useApi<DlnaStatusResp>('/api/dlna/status');
  const devices = useApi<DlnaDevicesResp>('/api/dlna/devices', false);

  return (
    <div className="space-y-3">
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-slate-300">Statut DLNA/UPnP</p>
          {status.data && <Badge color={status.data.enabled ? 'green' : 'gray'}>{status.data.enabled ? 'Activé' : 'Désactivé'}</Badge>}
        </div>
        <Button size="sm" onClick={devices.refresh} loading={devices.loading}>
          🔍 Découvrir appareils
        </Button>
      </div>

      {devices.error && <div className="text-xs text-red-400 px-1">{devices.error}</div>}

      {devices.data && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-3">{devices.data.count} appareil(s) découvert(s)</p>
          {devices.data.count === 0
            ? <EmptyState icon="📡" title="Aucun appareil DLNA trouvé" />
            : <div className="space-y-2">
                {devices.data.devices.map((d, i) => (
                  <div key={d.id ?? i} className="flex items-center justify-between text-xs py-1 border-b border-white/[0.05] last:border-0">
                    <span className="text-slate-300 font-medium">{d.name}</span>
                    <Badge color="blue">{d.type ?? 'UPnP'}</Badge>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      <SafetyNotice>DLNA en découverte seule — aucun contrôle de lecture automatique.</SafetyNotice>
    </div>
  );
}
