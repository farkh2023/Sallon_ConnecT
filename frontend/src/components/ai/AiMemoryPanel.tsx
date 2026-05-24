'use client';

import { useState } from 'react';
import { useMemory }                   from '@/hooks/useMemory';
import { MemoryStatusBadge }           from './MemoryStatusBadge';
import { MemoryList }                  from './MemoryList';
import { MemoryEditor }                from './MemoryEditor';
import { MemorySearchBox }             from './MemorySearchBox';
import { MemoryImportExport }          from './MemoryImportExport';
import { MemoryRetentionSettings }     from './MemoryRetentionSettings';
import { apiPost }                     from '@/lib/api';
import type { MemoryItem, MemoryRetentionStatus } from '@/lib/types';

type Tab = 'list' | 'add' | 'search' | 'io' | 'retention';

export function AiMemoryPanel() {
  const {
    items, meta, safety, loading, error, enabled,
    loadItems, createItem, updateItem, deleteItem,
    search, exportAll, clearAll,
  } = useMemory();

  const [tab,      setTab]      = useState<Tab>('list');
  const [editItem, setEditItem] = useState<MemoryItem | null>(null);

  async function handleSave(data: Partial<MemoryItem>) {
    let ok: boolean;
    if (editItem) {
      ok = await updateItem(editItem.id, data);
    } else {
      ok = await createItem(data);
    }
    if (ok) { setEditItem(null); setTab('list'); }
  }

  async function handleImport(raw: string) {
    try {
      const payload = JSON.parse(raw) as { items: MemoryItem[] };
      await apiPost('/api/ai/memory/import', payload);
      await loadItems();
      return true;
    } catch { return false; }
  }

  function handleEdit(item: MemoryItem) {
    setEditItem(item);
    setTab('add');
  }

  function handleCancelEdit() {
    setEditItem(null);
    setTab('list');
  }

  const retention: MemoryRetentionStatus | null = meta ? {
    totalItems:    meta.totalItems,
    maxItems:      safety?.maxItems      ?? 1000,
    retentionDays: 90,
    byType:        meta.byType  || {},
    byScope:       meta.byScope || {},
  } : null;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'list',      label: 'Memoire' },
    { id: 'add',       label: editItem ? 'Modifier' : 'Ajouter' },
    { id: 'search',    label: 'Recherche' },
    { id: 'io',        label: 'Export/Import' },
    { id: 'retention', label: 'Retention' },
  ];

  return (
    <section aria-label="Memoire persistante IA locale" className="space-y-6">
      {/* En-tete */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">Memoire persistante IA</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Contexte utilisateur local — preferences, faits, resumes — sans cloud.
        </p>
      </div>

      {/* Badges securite */}
      <MemoryStatusBadge enabled={enabled} safety={safety} total={meta?.totalItems} />

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8 pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setTab(t.id); if (t.id !== 'add') setEditItem(null); }}
            aria-pressed={tab === t.id}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              tab === t.id
                ? 'border-b-2 border-sky-400 text-sky-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div>
        {tab === 'list' && (
          <MemoryList
            items={items}
            loading={loading}
            onEdit={handleEdit}
            onDelete={id => void deleteItem(id)}
          />
        )}

        {tab === 'add' && (
          <MemoryEditor
            item={editItem}
            loading={loading}
            onSave={data => void handleSave(data)}
            onCancel={handleCancelEdit}
          />
        )}

        {tab === 'search' && (
          <MemorySearchBox onSearch={search} />
        )}

        {tab === 'io' && (
          <MemoryImportExport
            loading={loading}
            onExport={exportAll}
            onImport={handleImport}
            onClear={clearAll}
          />
        )}

        {tab === 'retention' && (
          <MemoryRetentionSettings retention={retention} />
        )}
      </div>
    </section>
  );
}
