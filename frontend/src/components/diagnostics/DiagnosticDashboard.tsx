'use client';

import { useDiagnosticsOverview } from '@/hooks/useDiagnosticsOverview';
import type { DiagnosticEntry, DiagnosticSnapshot, DiagnosticStatus } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  ok:       'text-emerald-300 border-emerald-400/20 bg-emerald-400/5',
  degraded: 'text-amber-300   border-amber-400/20   bg-amber-400/5',
  offline:  'text-rose-300    border-rose-400/20    bg-rose-400/5',
  unknown:  'text-slate-400   border-slate-400/20   bg-slate-400/5',
};

const STATUS_ICONS: Record<string, string> = {
  ok: '✓', degraded: '⚠', offline: '✗', unknown: '?',
};

const OVERALL_COLORS: Record<DiagnosticStatus, string> = {
  healthy:  'text-emerald-300',
  degraded: 'text-amber-300',
  offline:  'text-rose-300',
  unknown:  'text-slate-400',
};

const OVERALL_LABELS: Record<DiagnosticStatus, string> = {
  healthy:  'Sain',
  degraded: 'Dégradé',
  offline:  'Hors ligne',
  unknown:  'Inconnu',
};

type DiagnosticCardKey = {
  [K in keyof DiagnosticSnapshot]: DiagnosticSnapshot[K] extends DiagnosticEntry ? K : never
}[keyof DiagnosticSnapshot];

const CARDS_ORDER: DiagnosticCardKey[] = [
  'backend', 'sse', 'scheduler', 'backup', 'notifications', 'storage', 'security', 'frontend', 'network',
];

function HealthCard({ entry }: { entry: DiagnosticEntry }) {
  return (
    <div className={`rounded-xl border p-3 ${STATUS_COLORS[entry.status]}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold">{entry.label}</span>
        <span className="shrink-0 text-sm">{STATUS_ICONS[entry.status]}</span>
      </div>
      {entry.detail && (
        <p className="mt-1 text-[11px] opacity-70 truncate">{entry.detail}</p>
      )}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="72" height="72" className="shrink-0" aria-label={`Score ${score}/100`}>
      <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <circle
        cx="36" cy="36" r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 36 36)"
      />
      <text x="36" y="40" textAnchor="middle" fill={color} fontSize="13" fontWeight="bold">
        {score}
      </text>
    </svg>
  );
}

export function DiagnosticDashboard() {
  const { data, loading, error, lastFetchedAt, refresh, exportJson } = useDiagnosticsOverview({
    autoRefreshMs: 60_000,
  });

  if (loading && !data) {
    return (
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-xs text-slate-500">
        Chargement diagnostic…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-rose-400/20 bg-rose-400/5 p-4">
        <p className="text-xs text-rose-300">Diagnostic indisponible : {error}</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-2 rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 hover:text-slate-200"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ScoreRing score={data.score} />
          <div>
            <p className={`text-lg font-bold leading-none ${OVERALL_COLORS[data.overallStatus]}`}>
              {OVERALL_LABELS[data.overallStatus]}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Score : {data.score}/100
            </p>
            {lastFetchedAt && (
              <p className="text-[10px] text-slate-600">
                Contrôle : {new Date(lastFetchedAt).toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-40"
          >
            {loading ? 'Actualisation…' : 'Actualiser'}
          </button>
          <button
            type="button"
            onClick={exportJson}
            disabled={!data}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:opacity-40"
          >
            Export JSON
          </button>
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-amber-400/70">⚠ Erreur au dernier contrôle : {error}</p>
      )}

      {/* Health cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {CARDS_ORDER.map((key) => {
          const e = data[key];
          return <HealthCard key={key} entry={e} />;
        })}
      </div>

      <p className="text-[10px] text-slate-600">
        Diagnostic local uniquement — aucune télémétrie externe
      </p>
    </div>
  );
}
