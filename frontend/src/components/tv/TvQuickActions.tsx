'use client';

import { useMemo } from 'react';
import { useTvMode } from '@/hooks/useTvMode';
import type { TvQuickAction } from '@/lib/types';
import { TvFocusGrid } from './TvFocusGrid';

function scrollToSection(id: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function TvQuickActions() {
  const tv = useTvMode();

  const actions = useMemo<TvQuickAction[]>(
    () => [
      {
        id: 'refresh',
        label: 'Actualiser',
        description: 'Relit les statuts locaux en GET uniquement',
        shortcut: 'R',
        safe: true,
        onRun: () => tv.requestRefresh(),
      },
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Ouvre le centre local',
        shortcut: 'N',
        safe: true,
        onRun: () => {
          tv.setActivePanel('notifications');
          scrollToSection('notifications');
        },
      },
      {
        id: 'scheduler',
        label: 'Taches',
        description: 'Affiche le scheduler local',
        shortcut: 'S',
        safe: true,
        onRun: () => {
          tv.setActivePanel('scheduler');
          scrollToSection('taches');
        },
      },
      {
        id: 'media',
        label: 'Mode multimedia',
        description: 'Affiche les integrations sans commande auto',
        safe: true,
        onRun: () => {
          tv.setActivePanel('media');
          scrollToSection('media');
        },
      },
    ],
    [tv]
  );

  return <TvFocusGrid actions={actions} />;
}
