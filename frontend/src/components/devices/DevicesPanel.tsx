'use client';

import { useApi } from '@/hooks/useApi';
import { usePolling } from '@/hooks/usePolling';
import { DeviceCard } from './DeviceCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { Device } from '@/lib/types';

interface DevicesResp { count: number; devices: Device[]; timestamp: string }

export function DevicesPanel() {
  const { data, loading, error, refresh } = useApi<DevicesResp>('/api/devices');
  usePolling(refresh, 60_000, true);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-slate-500">
          {data ? `${data.devices.filter(d => d.liveStatus === 'online').length}/${data.count} en ligne` : ''}
        </p>
        <Button size="sm" onClick={refresh} loading={loading}>🔄 Actualiser</Button>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-red-400 mb-4">{error}</div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {data && data.devices.length === 0 && (
        <EmptyState icon="📡" title="Aucun appareil configuré" message="Ajoutez des entrées dans data/devices.json" />
      )}

      {data && data.devices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {data.devices.map(d => <DeviceCard key={d.id} device={d} />)}
        </div>
      )}
    </div>
  );
}
