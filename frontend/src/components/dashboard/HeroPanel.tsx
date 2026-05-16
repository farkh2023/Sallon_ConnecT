'use client';

import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { MetricCard } from './MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface Health { status: string; phase: number; server: string; timestamp: string }
interface DevicesResp { count: number; devices: { liveStatus?: string }[] }

export function HeroPanel() {
  const health  = useApi<Health>('/api/health');
  const devices = useApi<DevicesResp>('/api/devices', false);

  usePolling(health.refresh, 30_000, true);

  const online = devices.data?.devices.filter(d => d.liveStatus === 'online').length ?? '—';
  const total  = devices.data?.count ?? '—';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sallon-ConnecT</h1>
          <p className="text-slate-500 text-sm mt-0.5">Hub intelligent local — Phase {health.data?.phase ?? '…'}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {health.data && <Badge color="green">{health.data.status === 'ok' ? 'En ligne' : health.data.status}</Badge>}
          <Button size="sm" onClick={devices.refresh} loading={devices.loading}>
            🔄 Scanner
          </Button>
        </div>
      </div>

      {health.error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-red-400 mb-4">
          Backend inaccessible — {health.error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Statut serveur" value={health.data?.status === 'ok' ? '✓ OK' : '—'} icon="🖥️" color="text-emerald-400" />
        <MetricCard label="Phase"          value={health.data?.phase ?? '—'} icon="🚀" />
        <MetricCard label="Appareils en ligne" value={`${online}/${total}`} icon="📡" color="text-blue-400" />
        <MetricCard
          label="Dernière vérif."
          value={health.data ? new Date(health.data.timestamp).toLocaleTimeString('fr-FR') : '—'}
          icon="🕐"
          color="text-slate-400"
        />
      </div>
    </div>
  );
}
