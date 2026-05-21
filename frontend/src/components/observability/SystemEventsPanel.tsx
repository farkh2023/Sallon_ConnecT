'use client';

import { useState } from 'react';
import { useSystemEvents } from '@/hooks/useSystemEvents';
import { useServerEventsStream } from '@/hooks/useServerEventsStream';
import type { SystemEventSeverity, SystemEventSource } from '@/lib/types';

const SEVERITY_COLORS: Record<SystemEventSeverity, string> = {
  info:    'text-blue-300   border-blue-400/20   bg-blue-400/5',
  success: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/5',
  warning: 'text-amber-300  border-amber-400/20  bg-amber-400/5',
  error:   'text-rose-300   border-rose-400/20   bg-rose-400/5',
};

const SEVERITY_ICONS: Record<SystemEventSeverity, string> = {
  info: 'ℹ', success: '✓', warning: '⚠', error: '✗',
};

const SOURCE_LABELS: Record<SystemEventSource, string> = {
  backend:       'Backend',
  frontend:      'Frontend',
  network:       'Réseau',
  scheduler:     'Scheduler',
  backup:        'Backup',
  security:      'Sécurité',
  notifications: 'Notifications',
};

const SEVERITIES: Array<{ id: SystemEventSeverity | 'all'; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'info', label: 'Info' },
  { id: 'success', label: 'Succès' },
  { id: 'warning', label: 'Avertissement' },
  { id: 'error', label: 'Erreur' },
];

const SOURCES: Array<{ id: SystemEventSource | 'all'; label: string }> = [
  { id: 'all', label: 'Toutes sources' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'network', label: 'Réseau' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'backup', label: 'Backup' },
  { id: 'security', label: 'Sécurité' },
  { id: 'notifications', label: 'Notifications' },
];

export function SystemEventsPanel() {
  const {
    filteredEvents,
    events,
    unreadCount,
    filter,
    storageAvailable,
    setFilter,
    markRead,
    markAllRead,
    clearEvents,
    exportJson,
    exportCsv,
  } = useSystemEvents();
  const { state: sseState } = useServerEventsStream();
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearEvents();
    setConfirmClear(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Événements système
          </p>
          {unreadCount > 0 && (
            <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-bold text-sky-300">
              {unreadCount} non lu{unreadCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={exportJson}
            disabled={events.length === 0}
            className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-30"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={events.length === 0}
            className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-30"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-30"
          >
            Marquer comme lu
          </button>
          <button
            type="button"
            onClick={handleClear}
            className={`rounded-lg border px-2 py-0.5 text-[11px] transition ${
              confirmClear
                ? 'border-rose-400/50 text-rose-300 hover:bg-rose-400/10'
                : 'border-white/10 text-slate-400 hover:border-rose-400/30 hover:text-rose-300'
            }`}
          >
            {confirmClear ? 'Confirmer effacement' : 'Effacer'}
          </button>
          {confirmClear && (
            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-500 hover:text-slate-300"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Storage + SSE status */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
        {storageAvailable ? (
          <p className="text-[10px] text-emerald-400/60">
            ● Historique local activé · {events.length} événement{events.length !== 1 ? 's' : ''} persisté{events.length !== 1 ? 's' : ''}
          </p>
        ) : (
          <p className="text-[10px] text-amber-400/70">
            ⚠ Historique local indisponible
          </p>
        )}
        {sseState === 'open' && (
          <p className="text-[10px] text-emerald-400/60" aria-label="sse-status">⬤ Flux temps réel local actif</p>
        )}
        {sseState === 'connecting' && (
          <p className="text-[10px] text-sky-400/60" aria-label="sse-status">◌ Connexion…</p>
        )}
        {sseState === 'error' && (
          <p className="text-[10px] text-amber-400/70" aria-label="sse-status">⚠ Erreur flux SSE — fallback polling</p>
        )}
        {(sseState === 'closed' || sseState === 'disabled') && (
          <p className="text-[10px] text-slate-600" aria-label="sse-status">
            {sseState === 'disabled' ? '○ Flux temps réel désactivé' : '○ Flux temps réel déconnecté'}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-1.5">
        {SEVERITIES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter({ severity: s.id })}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${
              filter.severity === s.id
                ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SOURCES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setFilter({ source: s.id })}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
              filter.source === s.id
                ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-xs text-slate-500">
          Aucun événement{filter.severity !== 'all' || filter.source !== 'all' ? ' pour ce filtre' : ' enregistré'}.
        </div>
      ) : (
        <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className={`rounded-xl border p-2.5 transition ${SEVERITY_COLORS[evt.severity]} ${
                evt.read ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[11px]">{SEVERITY_ICONS[evt.severity]}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{evt.message}</p>
                    {evt.details && (
                      <p className="mt-0.5 text-[10px] text-slate-500">{evt.details}</p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[9px] text-slate-600">
                    {new Date(evt.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                  <span className="rounded border border-white/10 px-1 py-0 text-[9px] text-slate-600">
                    {SOURCE_LABELS[evt.source]}
                  </span>
                  {!evt.read && (
                    <button
                      type="button"
                      onClick={() => markRead(evt.id)}
                      className="text-[9px] text-slate-600 underline hover:text-slate-400"
                    >
                      lu
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-slate-600">
        Journal local — aucune télémétrie externe — max 200 événements · 7 jours de rétention
      </p>
    </div>
  );
}
