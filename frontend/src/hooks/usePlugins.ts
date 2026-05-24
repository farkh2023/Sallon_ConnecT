'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type { PluginInfo, PluginsListResponse, PluginSafety } from '@/lib/types';

export function usePlugins() {
  const [plugins,  setPlugins]  = useState<PluginInfo[]>([]);
  const [safety,   setSafety]   = useState<PluginSafety | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const safe = useCallback(<T>(fn: () => T) => {
    if (mounted.current) fn();
  }, []);

  const loadPlugins = useCallback(async () => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const [list, safetyData] = await Promise.all([
        apiGet<PluginsListResponse>('/api/plugins/list'),
        apiGet<PluginSafety>('/api/plugins/safety'),
      ]);
      safe(() => { setPlugins(list.plugins); setSafety(safetyData); });
    } catch (err) {
      safe(() => setError(err instanceof Error ? err.message : 'Erreur inconnue'));
    } finally {
      safe(() => setLoading(false));
    }
  }, [safe]);

  useEffect(() => { void loadPlugins(); }, [loadPlugins]);

  const enablePlugin = useCallback(async (id: string) => {
    try {
      await apiPost(`/api/plugins/${encodeURIComponent(id)}/enable`);
      await loadPlugins();
    } catch (err) {
      safe(() => setError(err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }, [loadPlugins, safe]);

  const disablePlugin = useCallback(async (id: string) => {
    try {
      await apiPost(`/api/plugins/${encodeURIComponent(id)}/disable`);
      await loadPlugins();
    } catch (err) {
      safe(() => setError(err instanceof Error ? err.message : 'Erreur inconnue'));
    }
  }, [loadPlugins, safe]);

  return { plugins, safety, loading, error, loadPlugins, enablePlugin, disablePlugin };
}
