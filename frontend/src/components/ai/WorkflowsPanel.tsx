'use client';

import { useState } from 'react';
import { useWorkflows }             from '@/hooks/useWorkflows';
import { WorkflowList }             from './WorkflowList';
import { WorkflowTemplatesPanel }   from './WorkflowTemplatesPanel';
import { WorkflowEditor }           from './WorkflowEditor';
import { WorkflowRunPanel }         from './WorkflowRunPanel';
import { WorkflowImportExport }     from './WorkflowImportExport';
import type { WorkflowDefinition }  from '@/lib/types';
import { apiPost }                  from '@/lib/api';

type Tab = 'list' | 'templates' | 'editor' | 'import';

export function WorkflowsPanel() {
  const {
    workflows, templates, runResult, loading, error,
    loadWorkflows, runWorkflow, createFromTemplate, deleteWorkflow, exportWorkflow, clearResult,
  } = useWorkflows();

  const [tab,      setTab]      = useState<Tab>('list');
  const [exported, setExported] = useState<WorkflowDefinition | null>(null);

  async function handleRun(id: string) {
    await runWorkflow(id);
    setTab('list');
  }

  async function handleDelete(id: string) {
    await deleteWorkflow(id);
  }

  async function handleExport(id: string) {
    const wf = await exportWorkflow(id);
    if (wf) { setExported(wf); setTab('import'); }
  }

  async function handleUseTemplate(id: string) {
    await createFromTemplate(id);
    setTab('list');
  }

  async function handleSaveEditor(wf: WorkflowDefinition) {
    try {
      await apiPost('/api/ai/workflows', wf);
      await loadWorkflows();
      setTab('list');
    } catch { /* erreur affichee par useWorkflows */ }
  }

  async function handleImport(wf: WorkflowDefinition) {
    try {
      await apiPost('/api/ai/workflows/import', wf);
      await loadWorkflows();
      setTab('list');
    } catch { /* erreur affichee par useWorkflows */ }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'list',      label: 'Workflows' },
    { id: 'templates', label: 'Templates' },
    { id: 'editor',    label: 'Creer' },
    { id: 'import',    label: 'Import/Export' },
  ];

  return (
    <section aria-label="Workflows IA locaux" className="space-y-6">
      {/* En-tete */}
      <div>
        <h2 className="text-base font-semibold text-slate-100">Workflows IA locaux</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Orchestration visuelle sequentielle — dry-run par defaut, local-only.
        </p>
      </div>

      {/* Badges securite */}
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Local uniquement</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Aucun cloud</span>
        <span className="rounded bg-amber-400/10 px-2 py-0.5 text-amber-400">Dry-run actif</span>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-emerald-500">Secrets masques</span>
      </div>

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-3 py-2 text-xs text-red-300" role="alert">
          {error}
        </div>
      )}

      {/* Run result */}
      {runResult && (
        <WorkflowRunPanel result={runResult} onClear={clearResult} />
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-white/8 pb-0">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
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
          <WorkflowList
            workflows={workflows}
            loading={loading}
            onRun={handleRun}
            onDelete={handleDelete}
            onExport={handleExport}
          />
        )}

        {tab === 'templates' && (
          <WorkflowTemplatesPanel
            templates={templates}
            loading={loading}
            onUseTemplate={handleUseTemplate}
          />
        )}

        {tab === 'editor' && (
          <WorkflowEditor
            loading={loading}
            onSave={wf => void handleSaveEditor(wf)}
            onCancel={() => setTab('list')}
          />
        )}

        {tab === 'import' && (
          <WorkflowImportExport
            loading={loading}
            onImport={wf => void handleImport(wf)}
            exported={exported}
            onClear={() => setExported(null)}
          />
        )}
      </div>
    </section>
  );
}
