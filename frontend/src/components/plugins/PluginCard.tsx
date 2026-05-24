'use client';

import type { PluginInfo } from '@/lib/types';

interface Props {
  plugin:    PluginInfo;
  onEnable:  (id: string) => void;
  onDisable: (id: string) => void;
}

export function PluginCard({ plugin, onEnable, onDisable }: Props) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        plugin.valid
          ? 'border-white/10 bg-white/5'
          : 'border-red-500/30 bg-red-500/10'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold text-slate-100">{plugin.name}</span>
            <span className="text-xs text-slate-500">v{plugin.version}</span>
            {plugin.localOnly && (
              <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                LOCAL
              </span>
            )}
            {plugin.enabled && plugin.valid && (
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-400">
                ACTIF
              </span>
            )}
          </div>

          {plugin.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-400">{plugin.description}</p>
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-600">Auteur : {plugin.author}</span>
            {plugin.permissions.length === 0 ? (
              <span className="text-xs text-slate-600">• Aucune permission</span>
            ) : (
              plugin.permissions.map(p => (
                <span
                  key={p}
                  className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] text-sky-400"
                >
                  {p}
                </span>
              ))
            )}
          </div>

          {plugin.error && (
            <p className="mt-1.5 text-xs text-red-400">Erreur : {plugin.error}</p>
          )}
        </div>

        <div className="shrink-0">
          {plugin.valid ? (
            plugin.enabled ? (
              <button
                type="button"
                onClick={() => onDisable(plugin.id)}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
              >
                Desactiver
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onEnable(plugin.id)}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
              >
                Activer
              </button>
            )
          ) : (
            <span className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400">
              Invalide
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
