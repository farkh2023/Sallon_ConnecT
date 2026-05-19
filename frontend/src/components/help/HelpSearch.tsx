'use client';

import type { HelpCategory } from '@/lib/types';

const CATEGORIES: { id: HelpCategory; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'installation', label: 'Installation' },
  { id: 'lancement', label: 'Lancement' },
  { id: 'sante', label: 'Santé' },
  { id: 'reseau', label: 'Réseau' },
  { id: 'tv', label: 'Mode TV' },
  { id: 'securite', label: 'Sécurité' },
  { id: 'backup', label: 'Backup' },
  { id: 'tests', label: 'Tests' },
  { id: 'release', label: 'Release' },
];

interface HelpSearchProps {
  query: string;
  activeCategory: HelpCategory;
  onQueryChange: (q: string) => void;
  onCategoryChange: (cat: HelpCategory) => void;
}

export function HelpSearch({ query, activeCategory, onQueryChange, onCategoryChange }: HelpSearchProps) {
  return (
    <div className="space-y-3">
      <input
        type="search"
        aria-label="Rechercher dans le Centre d'aide"
        placeholder="🔍 Rechercher une commande, un sujet, une question…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 outline-none transition focus:border-sky-400/50 focus:bg-white/8 focus-visible:ring-2 focus-visible:ring-sky-400/30"
      />
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`rounded-full border px-3 py-0.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${
              activeCategory === cat.id
                ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
