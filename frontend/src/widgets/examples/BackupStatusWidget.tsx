'use client';

import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';
import type { BackupDashboardResponse } from '@/lib/types';

export function BackupStatusWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<BackupDashboardResponse>('/api/backups/dashboard');

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Sauvegardes</span>
        <button type="button" onClick={() => void refresh()} aria-label="Actualiser sauvegardes" className="text-[10px] text-slate-600 hover:text-slate-400">↻</button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate">{error}</p>}
      {data && (
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-100">{data.summary.total}</p>
              <p className="text-[10px] text-slate-500">Total</p>
            </div>
            {size !== 'small' && (
              <div className="text-center">
                <p className="text-lg font-semibold text-emerald-400">{data.summary.valid}</p>
                <p className="text-[10px] text-slate-600">Valides</p>
              </div>
            )}
          </div>
          {size !== 'small' && data.summary.lastBackupAt && (
            <p className="text-[10px] text-slate-600">
              Dernier : {new Date(data.summary.lastBackupAt).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
