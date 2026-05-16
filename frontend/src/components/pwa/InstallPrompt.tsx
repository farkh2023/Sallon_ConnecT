'use client';

import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export function InstallPrompt() {
  const { canInstall, state, promptInstall, dismiss } = useInstallPrompt();

  if (!canInstall || state === 'installed') return null;

  return (
    <div className="pwa-install">
      <button
        type="button"
        onClick={promptInstall}
        className="rounded-lg border border-brand/50 bg-brand/20 px-3 py-1.5 text-xs font-semibold text-blue-100 transition hover:bg-brand/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
      >
        Installer Sallon-ConnecT
      </button>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-lg border border-white/10 px-2 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
        aria-label="Masquer l'installation PWA"
      >
        x
      </button>
    </div>
  );
}
