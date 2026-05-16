'use client';

import { useApi } from '@/hooks/useApi';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import type { MediaService } from '@/lib/types';

interface ServicesResp { services: MediaService[] }

export function MediaPanel() {
  const { data, loading, error } = useApi<ServicesResp>('/api/media/services');

  if (loading) return <div className="h-24 animate-pulse bg-white/[0.03] rounded-xl" />;
  if (error)   return <div className="text-xs text-red-400">{error}</div>;
  if (!data?.services?.length) return <EmptyState icon="🎬" title="Aucun service média configuré" />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {data.services.map(s => (
        <div key={s.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 flex items-center gap-3">
          <span className="text-2xl">{s.type === 'youtube' ? '▶️' : s.type === 'dlna' ? '📡' : '🎬'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{s.name}</p>
            <p className="text-xs text-slate-500 capitalize">{s.type}</p>
          </div>
          <Badge color={s.enabled ? 'green' : 'gray'}>{s.enabled ? 'Actif' : 'Inactif'}</Badge>
        </div>
      ))}
    </div>
  );
}
