'use client';

import { useState } from 'react';
import { useRag }            from '@/hooks/useRag';
import { RagStatusBadge }   from './RagStatusBadge';
import { RagSearchBox }     from './RagSearchBox';
import { RagAskBox }        from './RagAskBox';

type Tab = 'ask' | 'search';

export function RagPanel() {
  const {
    status, searchResult: _sr, askResult: _ar, loading, error,
    loadStatus, indexDocs, search, ask, clearIndex,
  } = useRag();

  const [tab,            setTab]            = useState<Tab>('ask');
  const [confirmClear,   setConfirmClear]   = useState(false);
  const [indexing,       setIndexing]       = useState(false);

  const indexed    = status?.indexed ?? false;
  const aiEnabled  = status?.aiEnabled ?? false;

  async function handleIndex() {
    setIndexing(true);
    await indexDocs();
    setIndexing(false);
  }

  async function handleClear() {
    if (!confirmClear) { setConfirmClear(true); return; }
    await clearIndex();
    setConfirmClear(false);
  }

  return (
    <section aria-label="RAG local — documentation" className="space-y-5">
      {/* En-tete */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Documentation locale (RAG)</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Recherche et questions sur la documentation Sallon-ConnecT — 100% local.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RagStatusBadge status={status} loading={loading && !status} />
          <button
            type="button"
            onClick={() => void loadStatus()}
            aria-label="Rafraichir le statut RAG"
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-slate-500 hover:text-slate-300"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Badges securite */}
      <div className="flex flex-wrap gap-2 text-[10px]">
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">RAG local uniquement</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Aucun cloud</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Citations obligatoires</span>
        {status?.mode === 'lexical' && (
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-400">Fallback lexical</span>
        )}
      </div>

      {/* Bouton Indexer */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleIndex()}
          disabled={indexing || loading}
          className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold text-sky-400 transition hover:bg-sky-400/20 disabled:opacity-40"
        >
          {indexing ? 'Indexation...' : indexed ? 'Reindexer' : 'Indexer documentation'}
        </button>
        {indexed && (
          <button
            type="button"
            onClick={() => void handleClear()}
            aria-label={confirmClear ? 'Confirmer la suppression de l\'index RAG' : 'Supprimer l\'index RAG'}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              confirmClear
                ? 'border-red-400/40 bg-red-400/15 text-red-300'
                : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {confirmClear ? 'Confirmer suppression ?' : 'Supprimer index'}
          </button>
        )}
        {confirmClear && (
          <button
            type="button"
            onClick={() => setConfirmClear(false)}
            className="text-[10px] text-slate-600 hover:text-slate-400"
          >
            Annuler
          </button>
        )}
      </div>

      {/* Statut sources */}
      {indexed && status?.sources && status.sources.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2">
          <p className="mb-1 text-[10px] font-semibold text-slate-600">
            Sources indexees ({status.sources.length})
          </p>
          <ul className="space-y-0.5">
            {status.sources.slice(0, 6).map(s => (
              <li key={s.path} className="flex items-center justify-between text-[10px] text-slate-600">
                <span className="font-mono truncate max-w-[70%]">{s.path}</span>
                <span>{s.chunks} chunks</span>
              </li>
            ))}
            {status.sources.length > 6 && (
              <li className="text-[10px] text-slate-700">+ {status.sources.length - 6} autres...</li>
            )}
          </ul>
        </div>
      )}

      {/* Onglets Ask / Search */}
      <div>
        <div className="flex gap-1 border-b border-white/5 pb-0 mb-4">
          {(['ask', 'search'] as Tab[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                tab === t
                  ? 'border-b-2 border-sky-400 text-sky-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t === 'ask' ? 'Question' : 'Recherche'}
            </button>
          ))}
        </div>

        {tab === 'ask' && (
          <RagAskBox
            indexed={indexed}
            aiEnabled={aiEnabled}
            loading={loading}
            onAsk={ask}
          />
        )}
        {tab === 'search' && (
          <RagSearchBox
            indexed={indexed}
            loading={loading}
            onSearch={search}
          />
        )}
      </div>
    </section>
  );
}
