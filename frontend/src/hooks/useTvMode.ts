'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { TvModeState } from '@/lib/types';

interface TvModeContextValue extends TvModeState {
  fullscreenSupported: boolean;
  fullscreenError: string | null;
  setActivePanel: (panel: TvModeState['activePanel']) => void;
  toggleTvMode: () => void;
  enableTvMode: () => void;
  disableTvMode: () => void;
  requestRefresh: () => void;
  enterFullscreen: () => Promise<void>;
  exitFullscreen: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
}

export const TvModeContext = createContext<TvModeContextValue | null>(null);

export function useTvMode(): TvModeContextValue {
  const value = useContext(TvModeContext);
  if (!value) throw new Error('useTvMode must be used inside TvModeProvider');
  return value;
}

export function useTvModeController(): TvModeContextValue {
  const [enabled, setEnabled] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState<TvModeState['activePanel']>('dashboard');
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null);
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const syncFullscreen = () => {
      setFullscreenSupported(Boolean(document.documentElement.requestFullscreen));
      setFullscreen(Boolean(document.fullscreenElement));
    };

    const id = window.setTimeout(syncFullscreen, 0);

    document.addEventListener('fullscreenchange', syncFullscreen);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener('fullscreenchange', syncFullscreen);
    };
  }, []);

  const enableTvMode = useCallback(() => setEnabled(true), []);
  const disableTvMode = useCallback(() => setEnabled(false), []);
  const toggleTvMode = useCallback(() => setEnabled((current) => !current), []);

  const requestRefresh = useCallback(() => {
    const timestamp = new Date().toISOString();
    setLastRefreshAt(timestamp);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sallon:tv-refresh', { detail: { timestamp } }));
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (!document.documentElement.requestFullscreen) {
      setFullscreenError('Plein ecran non disponible dans ce navigateur');
      return;
    }

    try {
      setFullscreenError(null);
      await document.documentElement.requestFullscreen();
    } catch (err) {
      setFullscreenError(err instanceof Error ? err.message : 'Plein ecran impossible');
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined' || !document.fullscreenElement) return;

    try {
      setFullscreenError(null);
      await document.exitFullscreen();
    } catch (err) {
      setFullscreenError(err instanceof Error ? err.message : 'Sortie plein ecran impossible');
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (document.fullscreenElement) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  return useMemo(
    () => ({
      enabled,
      fullscreen,
      fullscreenSupported,
      fullscreenError,
      activePanel,
      lastRefreshAt,
      setActivePanel,
      toggleTvMode,
      enableTvMode,
      disableTvMode,
      requestRefresh,
      enterFullscreen,
      exitFullscreen,
      toggleFullscreen,
    }),
    [
      activePanel,
      disableTvMode,
      enableTvMode,
      enabled,
      enterFullscreen,
      exitFullscreen,
      fullscreen,
      fullscreenError,
      fullscreenSupported,
      lastRefreshAt,
      requestRefresh,
      toggleFullscreen,
      toggleTvMode,
    ]
  );
}
