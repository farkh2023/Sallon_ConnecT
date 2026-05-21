'use client';

import { useState } from 'react';
import { useNotificationsCenter } from '@/hooks/useNotificationsCenter';
import type { LocalNotificationSeverity, LocalNotificationSource } from '@/lib/types';

const SEVERITY_COLORS: Record<LocalNotificationSeverity, string> = {
  info:    'text-blue-300   border-blue-400/20   bg-blue-400/5',
  success: 'text-emerald-300 border-emerald-400/20 bg-emerald-400/5',
  warning: 'text-amber-300  border-amber-400/20  bg-amber-400/5',
  error:   'text-rose-300   border-rose-400/20   bg-rose-400/5',
};

const SEVERITY_ICONS: Record<LocalNotificationSeverity, string> = {
  info: 'ℹ', success: '✓', warning: '⚠', error: '✗',
};

const SEVERITIES: Array<{ id: LocalNotificationSeverity | 'all'; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'info', label: 'Info' },
  { id: 'success', label: 'Succès' },
  { id: 'warning', label: 'Avertissement' },
  { id: 'error', label: 'Erreur' },
];

const SOURCES: Array<{ id: LocalNotificationSource | 'all'; label: string }> = [
  { id: 'all', label: 'Toutes' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'network', label: 'Réseau' },
  { id: 'scheduler', label: 'Scheduler' },
  { id: 'backup', label: 'Backup' },
  { id: 'security', label: 'Sécurité' },
  { id: 'system', label: 'Système' },
];

export function NotificationsCenterPanel() {
  const {
    filteredNotifications,
    notifications,
    unreadCount,
    filter,
    browserPermission,
    setFilter,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestBrowserPermission,
  } = useNotificationsCenter();

  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); return; }
    clearAll();
    setConfirmClear(false);
  };

  const isBrowserNotifSupported = typeof Notification !== 'undefined';

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Centre de notifications
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
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="rounded-lg border border-white/10 px-2 py-0.5 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300 disabled:opacity-30"
          >
            Tout marquer comme lu
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

      {/* Stats + browser permission */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] text-slate-600">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''} locale{notifications.length !== 1 ? 's' : ''}
        </p>
        {isBrowserNotifSupported && browserPermission === 'default' && (
          <button
            type="button"
            onClick={() => void requestBrowserPermission()}
            className="rounded-lg border border-white/10 px-2 py-0.5 text-[10px] text-slate-500 transition hover:border-sky-400/30 hover:text-sky-300"
          >
            Activer notifications navigateur
          </button>
        )}
        {isBrowserNotifSupported && browserPermission === 'granted' && (
          <span className="text-[10px] text-emerald-400/60">● Notifications navigateur activées</span>
        )}
        {isBrowserNotifSupported && browserPermission === 'denied' && (
          <span className="text-[10px] text-amber-400/60">⚠ Notifications navigateur bloquées</span>
        )}
        {!isBrowserNotifSupported && (
          <span className="text-[10px] text-slate-600">Notifications navigateur non supportées</span>
        )}
      </div>

      {/* Severity filters */}
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

      {/* Source filters */}
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
      {filteredNotifications.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 text-center text-xs text-slate-500">
          {filter.severity !== 'all' || filter.source !== 'all'
            ? 'Aucune notification pour ce filtre.'
            : 'Aucune notification.'}
        </div>
      ) : (
        <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-2.5 transition ${SEVERITY_COLORS[n.severity]} ${
                n.read ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[11px]">{SEVERITY_ICONS[n.severity]}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-semibold">{n.title}</p>
                      {(n.count ?? 1) > 1 && (
                        <span className="rounded-full bg-white/10 px-1.5 py-0 text-[9px] text-slate-400">
                          ×{n.count}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px]">{n.message}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[9px] text-slate-600">
                    {new Date(n.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                  <span className="rounded border border-white/10 px-1 py-0 text-[9px] text-slate-600 capitalize">
                    {n.source}
                  </span>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(n.id)}
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
        Notifications locales uniquement — aucune télémétrie externe — max 100
      </p>
    </div>
  );
}
