'use client';

import { useState, useEffect } from 'react';
import type { WorkspaceProfile } from '@/lib/types';

interface WorkspaceEditorProps {
  profile:   WorkspaceProfile | null;
  onSave:    (data: Partial<WorkspaceProfile>) => Promise<void>;
  onCancel:  () => void;
}

const THEMES    = ['dark', 'light', 'system'] as const;
const LANGUAGES = ['fr', 'en'] as const;

export function WorkspaceEditor({ profile, onSave, onCancel }: WorkspaceEditorProps) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [theme,       setTheme]       = useState<'dark' | 'light' | 'system'>('dark');
  const [language,    setLanguage]    = useState<'fr' | 'en'>('fr');
  const [saving,      setSaving]      = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setDescription(profile.description ?? '');
      setTheme((profile.settings?.theme as 'dark' | 'light' | 'system') ?? 'dark');
      setLanguage((profile.settings?.language as 'fr' | 'en') ?? 'fr');
    } else {
      setName('');
      setDescription('');
      setTheme('dark');
      setLanguage('fr');
    }
  }, [profile]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        settings: {
          aiEnabled: profile?.settings?.aiEnabled ?? false,
          ragEnabled: profile?.settings?.ragEnabled ?? false,
          memoryEnabled: profile?.settings?.memoryEnabled ?? false,
          kbEnabled: profile?.settings?.kbEnabled ?? false,
          workflowsEnabled: profile?.settings?.workflowsEnabled ?? false,
          agentsEnabled: profile?.settings?.agentsEnabled ?? false,
          theme,
          language,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  const label = { display: 'block', fontSize: 11, color: '#888', marginBottom: 4 };
  const input = { width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #333', background: '#1a1a2e', color: '#e0e0e0', fontSize: 12 };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#0f0f1a', border: '1px solid #1e1e3a', borderRadius: 8, padding: 16 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#e0e0e0', marginBottom: 12 }}>
        {profile ? 'Modifier le workspace' : 'Nouveau workspace'}
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={label}>Nom *</label>
        <input
          style={input}
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Mon workspace"
          maxLength={60}
          required
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={label}>Description</label>
        <input
          style={input}
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Description optionnelle"
          maxLength={300}
        />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Theme</label>
          <select style={input} value={theme} onChange={e => setTheme(e.target.value as typeof theme)}>
            {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Langue</label>
          <select style={input} value={language} onChange={e => setLanguage(e.target.value as typeof language)}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={saving}
          style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: 'pointer' }}>
          Annuler
        </button>
        <button type="submit" disabled={saving || !name.trim()}
          style={{ padding: '5px 12px', fontSize: 12, borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
