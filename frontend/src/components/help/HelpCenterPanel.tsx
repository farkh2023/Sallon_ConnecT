'use client';

import { useState } from 'react';
import { useHelpCenter } from '@/hooks/useHelpCenter';
import { HelpSearch } from './HelpSearch';
import { HelpQuickStart } from './HelpQuickStart';
import { HelpTopics } from './HelpTopics';
import { HelpPracticalLabs } from './HelpPracticalLabs';
import { HelpCommands } from './HelpCommands';
import { HelpFaq } from './HelpFaq';
import { HelpTroubleshooting } from './HelpTroubleshooting';
import { HelpSystemStatus } from './HelpSystemStatus';
import { HelpSafetyNotice } from './HelpSafetyNotice';
import { HelpLinks } from './HelpLinks';

type Tab =
  | 'accueil'
  | 'commandes'
  | 'tp'
  | 'faq'
  | 'depannage'
  | 'statut'
  | 'liens';

const TABS: { id: Tab; label: string }[] = [
  { id: 'accueil', label: '🏠 Accueil' },
  { id: 'commandes', label: '⌨ Commandes' },
  { id: 'tp', label: '🎓 TP' },
  { id: 'faq', label: '❓ FAQ' },
  { id: 'depannage', label: '🔧 Dépannage' },
  { id: 'statut', label: '📊 Statut' },
  { id: 'liens', label: '🔗 Liens' },
];

interface HelpCenterPanelProps {
  open: boolean;
  onClose: () => void;
}

export function HelpCenterPanel({ open, onClose }: HelpCenterPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('accueil');
  const { query, activeCategory, systemStatus, setQuery, setActiveCategory, refreshStatus } = useHelpCenter();

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-label="Centre d'aide Sallon-ConnecT">
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-white/[0.08] bg-[#071A2F] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🛟</span>
            <div>
              <p className="text-sm font-semibold text-slate-100">Centre d&apos;aide</p>
              <p className="text-[11px] text-slate-500">Sallon-ConnecT — Local, sécurisé</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/aide"
              className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-sky-400/30 hover:text-sky-300"
            >
              Plein écran ↗
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le Centre d'aide"
              className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="shrink-0 border-b border-white/[0.06] px-4 py-3">
          <HelpSearch
            query={query}
            activeCategory={activeCategory}
            onQueryChange={setQuery}
            onCategoryChange={setActiveCategory}
          />
        </div>

        {/* Tabs */}
        <div className="no-scrollbar shrink-0 flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
                activeTab === tab.id
                  ? 'bg-sky-400/15 text-sky-300'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-4">
          {activeTab === 'accueil' && (
            <>
              <HelpQuickStart />
              <HelpTopics query={query} />
              <HelpSafetyNotice />
            </>
          )}
          {activeTab === 'commandes' && <HelpCommands query={query} />}
          {activeTab === 'tp' && <HelpPracticalLabs query={query} />}
          {activeTab === 'faq' && <HelpFaq query={query} />}
          {activeTab === 'depannage' && <HelpTroubleshooting query={query} />}
          {activeTab === 'statut' && (
            <>
              <HelpSystemStatus status={systemStatus} onRefresh={() => void refreshStatus()} />
              <HelpSafetyNotice />
            </>
          )}
          {activeTab === 'liens' && <HelpLinks />}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-2 text-center text-[10px] text-slate-600">
          Centre d&apos;aide local — aucune télémétrie — aucun cloud
        </div>
      </div>
    </div>
  );
}
