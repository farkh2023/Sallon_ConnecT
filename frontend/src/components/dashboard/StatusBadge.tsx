import { Badge } from '@/components/ui/Badge';

interface StatusBadgeProps { status: string; label?: string }

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const s = status?.toLowerCase() ?? '';
  const color =
    s === 'online' || s === 'ok' || s === 'connected' || s === 'running' ? 'green' :
    s === 'offline' || s === 'error' || s === 'failed' ? 'red' :
    s === 'warning' || s === 'unconfigured' ? 'yellow' : 'gray';
  return <Badge color={color}>{label ?? status}</Badge>;
}
