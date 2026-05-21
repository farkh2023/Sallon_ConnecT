'use client';

import type { HelpNetworkState, HelpSystemStatus as HelpSystemStatusType } from '@/lib/types';

interface StatusRowProps {
  label: string;
  ok: boolean | null;
  value?: string;
}

function StatusRow({ label, ok, value }: StatusRowProps) {
  const color =
    ok === null ? 'text-slate-500' : ok ? 'text-emerald-400' : 'text-rose-400';
  const icon = ok === null ? '…' : ok ? '✓' : '✗';
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

const NETWORK_STATE_CONFIG: Record<HelpNetworkState, { label: string; cls: string }> = {
  checking:  { label: 'Vérification en cours…', cls: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
  online:    { label: 'En ligne',               cls: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/20' },
  degraded:  { label: 'Dégradé',                cls: 'text-amber-300  bg-amber-400/10  border-amber-400/20' },
  offline:   { label: 'Backend hors ligne',     cls: 'text-rose-300   bg-rose-400/10   border-rose-400/20' },
  unknown:   { label: 'État inconnu',           cls: 'text-slate-500  bg-slate-500/10  border-slate-500/20' },
};

interface HelpSystemStatusProps {
  status: HelpSystemStatusType;
  onRefresh: () => void;
}

export function HelpSystemStatus({ status, onRefresh }: HelpSystemStatusProps) {
  const { loading, error, lastCheckedAt, networkState } = status;
  const netCfg = NETWORK_STATE_CONFIG[networkState];

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

      {/* Network state badge */}
      <div className={`mb-3 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${netCfg.cls}`}
           role="status" aria-label={`État réseau : ${netCfg.label}`}>
        {netCfg.label}
      </div>

      {error && (
        <p className="mb-2 rounded-lg bg-rose-400/10 px-3 py-1.5 text-[11px] text-rose-300">
          Backend inaccessible — {error}
        </p>
      )}

      <div className="divide-y divide-white/5">
        <StatusRow label="Backend Express" ok={status.backendOk} />
        <StatusRow label="Frontend Next.js" ok={status.frontendOk} />
        <StatusRow
          label="Phase"
          ok={status.phase === null ? null : true}
          value={status.phase !== null ? `Phase ${status.phase}` : undefined}
        />
        <StatusRow
          label="Notifications non lues"
          ok={status.unreadNotifications === null ? null : status.unreadNotifications === 0}
          value={status.unreadNotifications !== null && status.unreadNotifications > 0 ? String(status.unreadNotifications) : undefined}
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
