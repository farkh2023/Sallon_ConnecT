'use client';

import { useState } from 'react';
import { useAiAssistant }        from '@/hooks/useAiAssistant';
import { AiStatusBadge }         from './AiStatusBadge';
import { AiChatBox }             from './AiChatBox';
import { AiDiagnosticsActions }  from './AiDiagnosticsActions';
import { RagPanel }              from './RagPanel';

export function AiAssistantPanel() {
  const {
    status, messages, loading, error,
    loadStatus, sendMessage, analyzeDiagnostics, suggestCommand, clearMessages,
  } = useAiAssistant();

  const [showRag, setShowRag] = useState(false);
  const disabled = !status?.enabled || !status?.available;

  return (
    <section aria-label="Assistant IA local" className="space-y-6">
      {/* En-tete */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Assistant IA local</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Propulse par Ollama — 100% local, aucune donnee cloud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AiStatusBadge status={status} loading={loading && !status} />
          <button
            type="button"
            onClick={() => void loadStatus()}
            aria-label="Rafraichir le statut IA"
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-slate-400 transition hover:text-slate-200"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Avertissement IA desactivee */}
      {status && !status.enabled && (
        <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-300">
          <p className="font-semibold">IA locale desactivee</p>
          <p className="mt-1 text-xs text-amber-400/80">
            Pour activer : mettre <code className="rounded bg-black/20 px-1">SALLON_AI_ENABLED=true</code> dans <code className="rounded bg-black/20 px-1">.env</code>,
            puis installer Ollama et executer <code className="rounded bg-black/20 px-1">ollama pull qwen2.5:7b</code>.
          </p>
        </div>
      )}

      {/* Avertissement Ollama indisponible */}
      {status?.enabled && !status.available && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
          <p className="font-semibold">Ollama non disponible</p>
          <p className="mt-1 text-xs text-red-400/80">
            Verifiez qu&apos;Ollama est lance : <code className="rounded bg-black/20 px-1">ollama serve</code>.
            Raison : {status.reason ?? 'inconnue'}.
          </p>
        </div>
      )}

      {/* Erreur reseau */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Badge securite */}
      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600">
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Local IA uniquement</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Aucun cloud</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Suggestions dry-run seulement</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Secrets masques</span>
      </div>

      {/* Chat */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Chat local</p>
        <AiChatBox
          messages={messages}
          loading={loading}
          disabled={disabled}
          onSend={msg => void sendMessage(msg)}
          onClear={clearMessages}
        />
      </div>

      {/* Actions diagnostics */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400">Actions diagnostics</p>
        <AiDiagnosticsActions
          disabled={disabled}
          loading={loading}
          onAnalyzeDiagnostics={analyzeDiagnostics}
          onSuggestCommand={suggestCommand}
        />
      </div>

      {/* RAG — documentation locale */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-400">Documentation locale (RAG)</p>
          <button
            type="button"
            onClick={() => setShowRag(v => !v)}
            aria-pressed={showRag}
            aria-label="Afficher ou masquer le panneau RAG"
            className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold transition ${
              showRag
                ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
                : 'border-white/10 bg-white/5 text-slate-500 hover:text-slate-300'
            }`}
          >
            {showRag ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        {showRag && <RagPanel />}
      </div>
    </section>
  );
}
