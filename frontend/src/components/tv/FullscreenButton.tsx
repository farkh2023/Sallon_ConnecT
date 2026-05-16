'use client';

import { useState } from 'react';
import { useTvMode } from '@/hooks/useTvMode';

interface FullscreenButtonProps {
  compact?: boolean;
}

export function FullscreenButton({ compact = false }: FullscreenButtonProps) {
  const tv = useTvMode();
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const label = tv.fullscreen ? 'Quitter plein ecran' : 'Plein ecran';

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (!tv.fullscreenSupported) {
            setLocalMessage('Plein ecran non disponible');
            return;
          }
          setLocalMessage(null);
          void tv.toggleFullscreen();
        }}
        className={`rounded-lg border border-white/10 bg-white/5 font-semibold text-slate-300 transition hover:bg-white/10 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
          compact ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-3 text-sm'
        }`}
      >
        {compact ? (tv.fullscreen ? 'Quitter' : 'Plein ecran') : label}
      </button>
      {(localMessage || tv.fullscreenError) && !compact && (
        <span className="text-xs text-yellow-300">{localMessage || tv.fullscreenError}</span>
      )}
    </div>
  );
}
