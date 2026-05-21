'use client';

import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { MetricCard } from './MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PROJECT_PHASE, PROJECT_PHASE_LABEL } from '@/lib/project';

interface Health { status: string; phase: number; server: string; timestamp: string }
interface DevicesResp { count: number; devices: { liveStatus?: string }[] }

export function HeroPanel() {
  const health  = useApi<Health>('/api/health');
  const devices = useApi<DevicesResp>('/api/devices', false);

  usePolling(health.refresh, 30_000, true);

  const online = devices.data?.devices.filter(d => d.liveStatus === 'online').length ?? '---';
  const total  = devices.data?.count ?? '---';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sallon-ConnecT</h1>
          <p className="text-slate-500 text-sm mt-0.5">Hub intelligent local - {PROJECT_PHASE_LABEL}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {health.loading && !health.data && <Badge color="gray">Vérification…</Badge>}
          {!health.loading && health.data && (
            <Badge color={health.data.status === 'ok' ? 'green' : 'yellow'}>
              {health.data.status === 'ok' ? 'En ligne' : 'Dégradé'}
            </Badge>
          )}
          {!health.loading && health.error && <Badge color="red">Backend indisponible</Badge>}
          <Button size="sm" onClick={devices.refresh} loading={devices.loading}>
            Scanner
          </Button>
        </div>
      </div>

      {health.error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-red-400 mb-4">
          Backend inaccessible - {health.error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard
          label="Statut serveur"
          value={health.loading && !health.data ? '…' : health.data?.status === 'ok' ? 'OK' : health.error ? 'ERR' : '---'}
          icon="SV"
          color={health.data?.status === 'ok' ? 'text-emerald-400' : health.error ? 'text-rose-400' : 'text-slate-500'}
        />
        <MetricCard label="Phase" value={PROJECT_PHASE} icon="PH" />
        <MetricCard label="Appareils en ligne" value={`${online}/${total}`} icon="NW" color="text-blue-400" />
        <MetricCard
          label="Derniere verif."
          value={health.data ? new Date(health.data.timestamp).toLocaleTimeString('fr-FR') : '---'}
          icon="TM"
          color="text-slate-400"
        />
      </div>
    </div>
  );
}
