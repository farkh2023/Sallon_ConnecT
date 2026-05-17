'use client';

import { ReactNode, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { TvModeContext, useTvModeController } from '@/hooks/useTvMode';
import type { TvModeState } from '@/lib/types';

function scrollToSection(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function TvModeProvider({ children }: { children: ReactNode }) {
  const tv = useTvModeController();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.tvMode = tv.enabled ? 'on' : 'off';
  }, [tv.enabled]);

  const handlers = useMemo(
    () => ({
      t: tv.toggleTvMode,
      f: () => {
        void tv.toggleFullscreen();
      },
      r: () => {
        tv.setActivePanel('dashboard');
        tv.requestRefresh();
        scrollToSection('tv-dashboard');
      },
      n: () => {
        tv.setActivePanel('notifications');
        scrollToSection('notifications');
      },
      h: () => {
        tv.setActivePanel('observability');
        scrollToSection('observabilite');
      },
      s: () => {
        tv.setActivePanel('scheduler');
        scrollToSection('taches');
      },
      Escape: () => {
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          void tv.exitFullscreen();
          return;
        }
        tv.setActivePanel(null as TvModeState['activePanel']);
      },
    }),
    [tv]
  );

  useKeyboardShortcuts(handlers);

  return <TvModeContext.Provider value={tv}>{children}</TvModeContext.Provider>;
}
