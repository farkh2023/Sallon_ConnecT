'use client';

import type { BackupDashboardSummary } from '@/lib/types';

interface Props {
  summary: BackupDashboardSummary | null;
  loading?: boolean;
}

function Card({ label, value, color = 'text-slate-100' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0A2540] p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </div>
  );
}

export function BackupSummaryCards({ summary, loading }: Props) {
  if (loading && !summary) {
    return <div className="text-sm text-slate-500">Chargement...</div>;
  }
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      <Card label="Total"      value={summary.total}          color="text-slate-100" />
      <Card label="Valides"    value={summary.valid}          color="text-emerald-300" />
      <Card label="Corrompus"  value={summary.corrupted}      color="text-red-300" />
      <Card label="Incomplets" value={summary.incomplete}     color="text-amber-300" />
      <Card label="Quick"      value={summary.quick}          color="text-sky-300" />
      <Card label="Full"       value={summary.full}           color="text-violet-300" />
      <Card label="Taille tot." value={summary.totalSizeLabel} color="text-slate-300" />
    </div>
  );
}
