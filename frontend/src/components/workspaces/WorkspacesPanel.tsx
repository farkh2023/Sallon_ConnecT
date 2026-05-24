'use client';

import { useEffect, useState } from 'react';
import { useWorkspaces } from '@/hooks/useWorkspaces';
import { WorkspaceSafetyNotice }  from './WorkspaceSafetyNotice';
import { WorkspaceCard }          from './WorkspaceCard';
import { WorkspaceEditor }        from './WorkspaceEditor';
import { WorkspaceSwitcher }      from './WorkspaceSwitcher';
import { WorkspaceImportExport }  from './WorkspaceImportExport';
import type { WorkspaceProfile }  from '@/lib/types';

type Tab = 'list' | 'new' | 'import';

export function WorkspacesPanel() {
  const {
    profiles, current, currentId, total, enabled, loading, error,
    loadProfiles, createProfile, updateProfile, deleteProfile,
    switchWorkspace, exportProfile, importProfile,
  } = useWorkspaces();

  const [tab,          setTab]          = useState<Tab>('list');
  const [editTarget,   setEditTarget]   = useState<WorkspaceProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteInput,  setDeleteInput]  = useState('');
  const [feedback,     setFeedback]     = useState<string | null>(null);

  useEffect(() => { void loadProfiles(); }, [loadProfiles]);

  function flash(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleSwitch(id: string) {
    const ok = await switchWorkspace(id);
    if (ok) flash('Workspace active.');
  }

  async function handleSave(data: Partial<WorkspaceProfile>) {
    if (editTarget) {
      const res = await updateProfile(editTarget.id, data);
      if (res) { setEditTarget(null); flash('Workspace mis a jour.'); }
    } else {
      const res = await createProfile(data);
      if (res) { setTab('list'); flash('Workspace cree.'); }
    }
  }

  async function handleExport(id: string) {
    const ok = await exportProfile(id);
    if (ok) flash("Export enregistre dans runtime/workspaces/exports/.");
    else flash("Erreur export.");
  }

  function requestDelete(id: string) {
    setDeleteTarget(id);
    setDeleteInput('');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const isDefault = profiles.find(p => p.id === deleteTarget)?.isDefault;
    const conf = isDefault ? 'SUPPRIMER_WORKSPACE_DEFAULT' : 'SUPPRIMER';
    if (deleteInput.trim() !== conf) return;
    const ok = await deleteProfile(deleteTarget, conf);
    if (ok) {
      setDeleteTarget(null);
      flash('Workspace supprime.');
      void loadProfiles();
    }
  }

  async function handleImport(payload: unknown): Promise<boolean> {
    const res = await importProfile(payload);
    if (res) { setTab('list'); flash('Workspace importe.'); void loadProfiles(); return true; }
    return false;
  }

  const btnStyle = (active: boolean) => ({
    padding: '6px 14px', fontSize: 12, borderRadius: 4, cursor: 'pointer',
    border: active ? '1px solid #4f46e5' : '1px solid #333',
    background: active ? '#1a1a3e' : 'transparent',
    color: active ? '#a0a0ff' : '#888',
  });

  const deleteConf = profiles.find(p => p.id === deleteTarget)?.isDefault
    ? 'SUPPRIMER_WORKSPACE_DEFAULT'
    : 'SUPPRIMER';

  return (
    <div style={{ padding: 16, background: '#080812', minHeight: 400, color: '#e0e0e0', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 15 }}>Workspaces locaux</span>
          <span style={{ marginLeft: 10, fontSize: 11, color: '#555' }}>{total} workspace(s)</span>
          {!enabled && <span style={{ marginLeft: 10, fontSize: 11, color: '#f87171' }}>Desactive</span>}
        </div>
        {profiles.length > 1 && (
          <WorkspaceSwitcher
            profiles={profiles}
            currentId={currentId}
            onSwitch={handleSwitch}
            disabled={loading}
          />
        )}
      </div>

      <WorkspaceSafetyNotice />

      {feedback && (
        <div style={{ background: '#0d2a1a', border: '1px solid #1a5c30', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#4ade80', marginBottom: 10 }}>
          {feedback}
        </div>
      )}

      {error && (
        <div style={{ background: '#1a0a0a', border: '1px solid #5c1a1a', borderRadius: 6, padding: '6px 12px', fontSize: 12, color: '#f87171', marginBottom: 10 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        <button style={btnStyle(tab === 'list')}   onClick={() => { setTab('list');   setEditTarget(null); }}>Liste</button>
        <button style={btnStyle(tab === 'new')}    onClick={() => { setTab('new');    setEditTarget(null); }} disabled={!enabled}>Nouveau</button>
        <button style={btnStyle(tab === 'import')} onClick={() => { setTab('import'); setEditTarget(null); }} disabled={!enabled}>Importer</button>
        {current && (
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#555', alignSelf: 'center' }}>
            Actif : <span style={{ color: '#a0a0ff' }}>{current.name}</span>
          </div>
        )}
      </div>

      {tab === 'list' && (
        <div>
          {loading && <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 20 }}>Chargement...</div>}
          {!loading && profiles.length === 0 && (
            <div style={{ fontSize: 12, color: '#555', textAlign: 'center', padding: 20 }}>Aucun workspace.</div>
          )}
          {editTarget && (
            <div style={{ marginBottom: 12 }}>
              <WorkspaceEditor
                profile={editTarget}
                onSave={handleSave}
                onCancel={() => setEditTarget(null)}
              />
            </div>
          )}
          {profiles.filter(p => !editTarget || p.id !== editTarget.id).map(p => (
            <WorkspaceCard
              key={p.id}
              profile={p}
              isCurrent={p.id === currentId}
              onSwitch={handleSwitch}
              onEdit={setEditTarget}
              onExport={handleExport}
              onDelete={requestDelete}
            />
          ))}
        </div>
      )}

      {tab === 'new' && (
        <WorkspaceEditor
          profile={null}
          onSave={handleSave}
          onCancel={() => setTab('list')}
        />
      )}

      {tab === 'import' && (
        <WorkspaceImportExport onImport={handleImport} />
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #5c1a1a', borderRadius: 10, padding: 24, maxWidth: 360, width: '90%' }}>
            <div style={{ fontWeight: 600, marginBottom: 10, color: '#f87171' }}>Supprimer le workspace ?</div>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 14 }}>
              Tapez <strong style={{ color: '#f87171' }}>{deleteConf}</strong> pour confirmer.
            </div>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={deleteConf}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #5c1a1a', background: '#1a0a0a', color: '#e0e0e0', fontSize: 12 }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteTarget(null)}
                style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteInput.trim() !== deleteConf}
                style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, border: 'none', background: '#7f1d1d', color: '#fff', cursor: 'pointer' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
