'use client';

import { usePlugins } from '@/hooks/usePlugins';
import { PluginCard }         from './PluginCard';
import { PluginSafetyNotice } from './PluginSafetyNotice';

export function PluginsPanel() {
  const { plugins, loading, error, loadPlugins, enablePlugin, disablePlugin } = usePlugins();

  const activeCount = plugins.filter(p => p.enabled).length;

  return (
    <div className="space-y-6">
      <PluginSafetyNotice />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          {loading
            ? 'Chargement...'
            : plugins.length === 0
              ? 'Aucun plugin installe.'
              : `${plugins.length} plugin(s) detecte(s) — ${activeCount} actif(s)`}
        </p>
        <button
          type="button"
          onClick={() => void loadPlugins()}
          disabled={loading}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
        >
          {loading ? 'Chargement...' : 'Actualiser'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {!loading && plugins.length === 0 && !error && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-500">
          <p className="mb-2 font-medium text-slate-400">Aucun plugin detecte</p>
          <p>
            Placez un dossier contenant un fichier{' '}
            <code className="font-mono text-slate-300">plugin.json</code> dans{' '}
            <code className="font-mono text-slate-300">plugins/</code> pour commencer.
          </p>
          <p className="mt-2 text-xs text-slate-600">
            Exemple : <code className="font-mono">plugins/mon-plugin/plugin.json</code>
          </p>
        </div>
      )}

      {plugins.length > 0 && (
        <div className="space-y-3">
          {plugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onEnable={enablePlugin}
              onDisable={disablePlugin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
