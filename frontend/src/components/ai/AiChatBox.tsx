'use client';

import { useState, useRef, useEffect } from 'react';
import type { AiChatMessage } from '@/lib/types';

interface Props {
  messages:   AiChatMessage[];
  loading:    boolean;
  disabled:   boolean;
  onSend:     (message: string) => void;
  onClear:    () => void;
}

export function AiChatBox({ messages, loading, disabled, onSend, onClear }: Props) {
  const [input, setInput]     = useState('');
  const bottomRef             = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading || disabled) return;
    onSend(trimmed);
    setInput('');
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Historique */}
      <div
        role="log"
        aria-label="Historique du chat IA"
        className="flex max-h-72 min-h-[120px] flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3"
      >
        {messages.length === 0 && (
          <p className="text-center text-xs text-slate-600">
            {disabled ? 'IA locale non disponible.' : 'Posez une question sur Sallon-ConnecT.'}
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'ml-auto bg-sky-500/20 text-sky-200'
                : 'bg-white/5 text-slate-300'
            }`}
          >
            <span className="mb-0.5 block text-[9px] font-bold uppercase text-slate-600">
              {msg.role === 'user' ? 'Vous' : 'Assistant local'}
            </span>
            <span className="whitespace-pre-wrap">{msg.content}</span>
          </div>
        ))}
        {loading && (
          <p className="text-xs text-slate-500 italic">Ollama reflechit...</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={disabled || loading}
          placeholder={disabled ? 'IA non disponible' : 'Votre question...'}
          aria-label="Message pour l'assistant IA local"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-sky-400/40 focus:outline-none disabled:opacity-40"
        />
        <button
          type="submit"
          disabled={disabled || loading || !input.trim()}
          aria-label="Envoyer le message"
          className="rounded-lg border border-sky-400/30 bg-sky-400/15 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/25 disabled:opacity-40"
        >
          Envoyer
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer l'historique du chat"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-500 transition hover:text-slate-300"
          >
            Effacer
          </button>
        )}
      </form>

      <p className="text-[10px] text-slate-600">
        Local IA uniquement — aucune donnee envoyee en dehors de votre machine.
      </p>
    </div>
  );
}
