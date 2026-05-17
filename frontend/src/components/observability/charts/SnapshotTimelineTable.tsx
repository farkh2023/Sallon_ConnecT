'use client';

import type { SnapshotTimelineItem } from '@/lib/types';

interface SnapshotTimelineTableProps {
  items: SnapshotTimelineItem[];
}

const STATUS_COLOR: Record<string, string> = {
  ok: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Manuel',
  scheduler: 'Scheduler',
  startup: 'Démarrage',
};

function scoreBar(score: number) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 rounded ${color}`} style={{ width: `${pct * 0.4}px`, minWidth: '4px' }} />
      <span className="text-xs text-gray-400">{pct}%</span>
    </span>
  );
}

export function SnapshotTimelineTable({ items }: SnapshotTimelineTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">Aucun snapshot dans la sélection.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-300 border-collapse">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Source</th>
            <th className="py-2 pr-3 font-medium">Statut</th>
            <th className="py-2 pr-3 font-medium">Mémoire</th>
            <th className="py-2 pr-3 font-medium">Notifs</th>
            <th className="py-2 pr-3 font-medium">Scheduler</th>
            <th className="py-2 font-medium">Sécurité</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id ?? idx} className="border-b border-gray-800 hover:bg-gray-800/40">
              <td className="py-1.5 pr-3 whitespace-nowrap text-xs text-gray-400">
                {new Date(item.createdAt).toLocaleString('fr-FR', {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </td>
              <td className="py-1.5 pr-3 text-xs">{SOURCE_LABEL[item.source] ?? item.source}</td>
              <td className={`py-1.5 pr-3 font-semibold text-xs ${STATUS_COLOR[item.status] ?? 'text-gray-300'}`}>
                {item.status.toUpperCase()}
              </td>
              <td className="py-1.5 pr-3">{scoreBar(item.memoryScore)}</td>
              <td className="py-1.5 pr-3">{scoreBar(item.notificationScore)}</td>
              <td className="py-1.5 pr-3">{scoreBar(item.schedulerScore)}</td>
              <td className="py-1.5">{scoreBar(item.securityScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
