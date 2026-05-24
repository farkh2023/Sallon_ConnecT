'use client';

import { useState, useEffect } from 'react';
import type { MemoryItem, MemoryItemType, MemoryScope, MemorySource } from '@/lib/types';

const TYPES:   MemoryItemType[] = ['preference', 'fact', 'summary', 'workflow-result', 'agent-result', 'diagnostic-insight', 'note'];
const SCOPES:  MemoryScope[]    = ['user', 'project', 'system', 'session'];
const SOURCES: MemorySource[]   = ['chat', 'agent', 'workflow', 'manual', 'diagnostic'];

interface MemoryEditorProps {
  item?:     MemoryItem | null;
  loading:   boolean;
  onSave:    (item: Partial<MemoryItem>) => void;
  onCancel:  () => void;
}

export function MemoryEditor({ item, loading, onSave, onCancel }: MemoryEditorProps) {
  const [type,       setType]       = useState<MemoryItemType>('note');
  const [scope,      setScope]      = useState<MemoryScope>('user');
  const [source,     setSource]     = useState<MemorySource>('manual');
  const [content,    setContent]    = useState('');
  const [tags,       setTags]       = useState('');
  const [importance, setImportance] = useState(1);

  useEffect(() => {
    if (item) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType(item.type);
      setScope(item.scope);
      setSource(item.source);
      setContent(item.content);
      setTags((item.tags || []).join(', '));
      setImportance(item.importance ?? 1);
      /* eslint-enable react-hooks/set-state-in-effect */
    } else {
      setType('note'); setScope('user'); setSource('manual');
      setContent(''); setTags(''); setImportance(1);
    }
  }, [item]);

  function handleSave() {
    const parsed = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ type, scope, source, content: content.trim(), tags: parsed, importance });
  }

  const isEdit = !!item;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-slate-400">
        {isEdit ? 'Modifier un item memoire' : 'Ajouter un item memoire'}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as MemoryItemType)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Portee (scope)</label>
          <select
            value={scope}
            onChange={e => setScope(e.target.value as MemoryScope)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Source</label>
          <select
            value={source}
            onChange={e => setSource(e.target.value as MemorySource)}
            disabled={loading}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] text-slate-500 mb-1">Contenu</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Contenu de l'item memoire..."
          rows={4}
          disabled={loading}
          aria-label="Contenu de l'item memoire"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
        <p className="mt-0.5 text-[10px] text-slate-600">{content.length} / 4000 caracteres</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Tags (virgule)</label>
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="ai, workflow, backup"
            disabled={loading}
            aria-label="Tags de l'item memoire"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-[10px] text-slate-500 mb-1">Importance (0–10)</label>
          <input
            type="number"
            min={0}
            max={10}
            value={importance}
            onChange={e => setImportance(Number(e.target.value))}
            disabled={loading}
            aria-label="Importance de l'item memoire"
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || !content.trim()}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-40"
        >
          {isEdit ? 'Mettre a jour' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
