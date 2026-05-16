import type { Device } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface DeviceCardProps { device: Device }

const ICONS: Record<string, string> = {
  tv: '📺', pc: '💻', phone: '📱', box: '📡', nas: '🗄️', laptop: '💻',
};

export function DeviceCard({ device }: DeviceCardProps) {
  const icon  = ICONS[device.type?.toLowerCase() ?? ''] ?? '📟';
  const live  = device.liveStatus ?? 'unconfigured';
  const color = live === 'online' ? 'green' : live === 'offline' ? 'red' : 'gray';
  const label = device.liveStatusLabel ?? device.statusLabel ?? live;

  return (
    <div className={`bg-white/[0.03] border rounded-xl p-4 flex flex-col gap-2 transition-colors ${
      live === 'online' ? 'border-success/30' : 'border-white/[0.07]'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl">{icon}</span>
        <Badge color={color}>{label}</Badge>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200 truncate">{device.name}</p>
        <p className="text-xs text-slate-500 capitalize">{device.type}</p>
      </div>
    </div>
  );
}
