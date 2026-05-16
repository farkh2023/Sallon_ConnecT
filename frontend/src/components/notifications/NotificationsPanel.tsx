'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate } from '@/lib/format';
import type { NotificationItem } from '@/lib/types';

const LEVEL_COLOR: Record<string, 'green' | 'blue' | 'yellow' | 'red' | 'gray'> = {
  success: 'green', info: 'blue', warning: 'yellow', error: 'red', security: 'red',
};
const LEVEL_ICON: Record<string, string> = {
  success: '✅', info: 'ℹ️', warning: '⚠️', error: '❌', security: '🔒',
};

export function NotificationsPanel() {
  const { items, stats, loading, error, refresh, markRead } = useNotifications(15_000);

  return (
    <div>
      {/* Stats bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {stats && (
          <>
            <span className="text-xs text-slate-500">{stats.total} notification(s)</span>
            {stats.unread > 0 && <Badge color="coral">{stats.unread} non lues</Badge>}
          </>
        )}
        <Button size="sm" onClick={refresh} loading={loading} className="ml-auto">🔄 Actualiser</Button>
      </div>

      {error && <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 text-xs text-red-400 mb-3">{error}</div>}

      {loading && items.length === 0 && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length === 0 && <EmptyState icon="🔔" title="Aucune notification" message="Les événements système apparaîtront ici" />}

      <div className="space-y-2">
        {items.map(n => <NotifCard key={n.id} n={n} onRead={markRead} />)}
      </div>
    </div>
  );
}

function NotifCard({ n, onRead }: { n: NotificationItem; onRead: (id: string) => void }) {
  const color = LEVEL_COLOR[n.level] ?? 'gray';
  const icon  = LEVEL_ICON[n.level]  ?? '🔔';

  return (
    <div className={`flex gap-3 bg-white/[0.03] border rounded-xl px-4 py-3 transition-opacity ${
      n.read ? 'border-white/[0.05] opacity-60' : 'border-white/[0.09]'
    }`}>
      <span className="text-lg shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-slate-200 truncate">{n.title}</span>
          <Badge color={color}>{n.level}</Badge>
          {!n.read && <span className="w-2 h-2 rounded-full bg-brand shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 truncate">{n.message}</p>
        <p className="text-xs text-slate-600 mt-1">{formatDate(n.createdAt)}</p>
      </div>
      {!n.read && (
        <Button size="xs" variant="ghost" onClick={() => onRead(n.id)} className="shrink-0 self-start">✓</Button>
      )}
    </div>
  );
}
