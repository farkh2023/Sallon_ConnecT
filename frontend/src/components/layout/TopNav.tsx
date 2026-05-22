'use client';

import React from 'react';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';
import { OfflineStatus } from '@/components/pwa/OfflineStatus';
import { FullscreenButton } from '@/components/tv/FullscreenButton';
import { useTvMode } from '@/hooks/useTvMode';
import { ProfileSwitcher } from '@/components/profiles/ProfileSwitcher';
import type { UserProfile } from '@/lib/types';
import { PROJECT_PHASE_LABEL } from '@/lib/project';

interface NavLink {
  href: string;
  label: string;
}

const NAV_LINKS: NavLink[] = [
  { href: '#hero', label: 'Hub' },
  { href: '#appareils', label: 'Appareils' },
  { href: '#agents', label: 'Agents' },
  { href: '#media', label: 'Medias' },
  { href: '#scenarios', label: 'Scenarios' },
  { href: '#notifications', label: 'Notifs' },
  { href: '#observabilite', label: 'Observabilite' },
  { href: '#taches', label: 'Taches' },
  { href: '#profils', label: 'Profils' },
  { href: '#sauvegarde', label: 'Sauvegarde' },
  { href: '/sauvegardes', label: 'Sauvegardes' },
];

interface TopNavProps {
  unread?: number;
  profiles?: UserProfile[];
  activeProfile?: UserProfile | null;
  onActivateProfile?: (id: string) => void;
  voicePanelOpen?: boolean;
  onToggleVoicePanel?: () => void;
  helpPanelOpen?: boolean;
  onToggleHelpPanel?: () => void;
}

export function TopNav({
  unread = 0,
  profiles = [],
  activeProfile = null,
  onActivateProfile,
  voicePanelOpen = false,
  onToggleVoicePanel,
  helpPanelOpen = false,
  onToggleHelpPanel,
}: TopNavProps) {
  const tv = useTvMode();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-navy/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2">
        <a href="#hero" className="shrink-0 font-bold tracking-wide text-slate-100">
          Sallon-ConnecT
        </a>

        <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
            >
              {link.label}
              {link.href === '#notifications' && unread > 0 && (
                <span className="rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </a>
          ))}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <OfflineStatus />
          {onToggleVoicePanel && (
            <button
              type="button"
              aria-pressed={voicePanelOpen}
              onClick={onToggleVoicePanel}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
                voicePanelOpen
                  ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Assistant vocal
            </button>
          )}
          <button
            type="button"
            aria-pressed={tv.enabled}
            onClick={tv.toggleTvMode}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
              tv.enabled
                ? 'border-coral/40 bg-coral/15 text-coral'
                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            Mode TV
          </button>
          <FullscreenButton compact />
          {onToggleHelpPanel && (
            <button
              type="button"
              aria-pressed={helpPanelOpen}
              aria-label="Ouvrir le Centre d'aide (touche ?)"
              onClick={onToggleHelpPanel}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral ${
                helpPanelOpen
                  ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              Aide
            </button>
          )}
          <InstallPrompt />
          {profiles.length > 0 && onActivateProfile && (
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              onActivate={onActivateProfile}
            />
          )}
          <span className="hidden text-xs text-slate-600 sm:inline">{PROJECT_PHASE_LABEL}</span>
        </div>
      </div>
    </nav>
  );
}
