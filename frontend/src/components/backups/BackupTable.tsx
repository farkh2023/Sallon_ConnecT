'use client';

import type { BackupDashboardItem } from '@/lib/types';
import { BackupItemCard } from './BackupItemCard';

interface Props {
  items:      BackupDashboardItem[];
  loading:    boolean;
  onVerify:   (id: string) => void;
  onExport:   (id: string) => void;
  onRestore:  (id: string) => void;
  onDelete:   (id: string) => void;
}

export function BackupTable({ items, loading, onVerify, onExport, onRestore, onDelete }: Props) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-white/[0.08] bg-[#0A2540]/60 px-6 py-10 text-center text-sm text-slate-500">
        Aucun snapshot trouve. Creez votre premier backup ci-dessus.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map(item => (
        <BackupItemCard
          key={item.id}
          item={item}
          loading={loading}
          onVerify={onVerify}
          onExport={onExport}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
