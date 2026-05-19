'use client';

import type { HelpSystemStatus as HelpSystemStatusType } from '@/lib/types';

interface StatusRowProps {
  label: string;
  ok: boolean | null;
  value?: string;
}

function StatusRow({ label, ok, value }: StatusRowProps) {
  const color = ok === null ? 'text-slate-500' : ok ? 'text-emerald-400' : 'text-rose-400';
  const icon = ok === null ? '—' : ok ? '✓' : '✗';
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className={`flex items-center gap-1 font-medium ${color}`}>
        <span>{icon}</span>
        {value && <span className="text-slate-500">{value}</span>}
      </span>
    </div>
  );
}

interface HelpSystemStatusProps {
  status: HelpSystemStatusType;
  onRefresh: () => void;
}

export function HelpSystemStatus({ status, onRefresh }: HelpSystemStatusProps) {
  const { loading, error, lastCheckedAt } = status;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">État système</p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Actualiser l'état système"
          className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-40"
        >
          {loading ? '…' : '↻ Actualiser'}
        </button>
      </div>

      {error && (
        <p className="mb-2 rounded-lg bg-rose-400/10 px-3 py-1.5 text-[11px] text-rose-300">
          Erreur : {error}
        </p>
      )}

      <div className="divide-y divide-white/5">
        <StatusRow label="Backend Express" ok={status.backendOk} />
        <StatusRow label="Frontend Next.js" ok={status.frontendOk} />
        <StatusRow
          label="Phase"
          ok={status.phase !== null}
          value={status.phase !== null ? `Phase ${status.phase}` : undefined}
        />
        <StatusRow
          label="Notifications non lues"
          ok={status.unreadNotifications === 0}
          value={status.unreadNotifications > 0 ? String(status.unreadNotifications) : undefined}
        />
        <StatusRow label="Scheduler actif" ok={status.schedulerActive} />
        <StatusRow label="Observabilité OK" ok={status.observabilityOk} />
        <StatusRow label="Backup disponible" ok={status.backupAvailable} />
        <StatusRow label="Sécurité localOnly" ok={status.securityLocalOnly} />
      </div>

      {lastCheckedAt && (
        <p className="mt-2 text-[10px] text-slate-600">
          Vérifié à {new Date(lastCheckedAt).toLocaleTimeString('fr-FR')}
        </p>
      )}
    </div>
  );
}
