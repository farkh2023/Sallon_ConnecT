'use client';

import { useState } from 'react';

const TYPES = ['', 'memory', 'rag', 'workflow', 'agent', 'diagnostic', 'plugin', 'event', 'note'];

interface KnowledgeFiltersValue {
  type?:   string;
  source?: string;
  tag?:    string;
  entity?: string;
}

interface KnowledgeFiltersProps {
  value:    KnowledgeFiltersValue;
  onChange: (f: KnowledgeFiltersValue) => void;
}

export function KnowledgeFilters({ value, onChange }: KnowledgeFiltersProps) {
  const [tag,    setTag]    = useState(value.tag    || '');
  const [entity, setEntity] = useState(value.entity || '');

  function apply(patch: Partial<KnowledgeFiltersValue>) {
    onChange({ ...value, ...patch });
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      <select
        aria-label="Filtrer par type"
        value={value.type || ''}
        onChange={e => apply({ type: e.target.value || undefined })}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#1a1a2e', color: '#e0e0e0' }}
      >
        {TYPES.map(t => <option key={t} value={t}>{t || 'Tous types'}</option>)}
      </select>

      <input
        aria-label="Filtrer par tag"
        placeholder="Tag..."
        value={tag}
        onChange={e => setTag(e.target.value)}
        onBlur={() => apply({ tag: tag || undefined })}
        onKeyDown={e => e.key === 'Enter' && apply({ tag: tag || undefined })}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#1a1a2e', color: '#e0e0e0', width: 110 }}
      />

      <input
        aria-label="Filtrer par entite"
        placeholder="Entite..."
        value={entity}
        onChange={e => setEntity(e.target.value)}
        onBlur={() => apply({ entity: entity || undefined })}
        onKeyDown={e => e.key === 'Enter' && apply({ entity: entity || undefined })}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #444', background: '#1a1a2e', color: '#e0e0e0', width: 110 }}
      />

      <button
        onClick={() => { setTag(''); setEntity(''); onChange({}); }}
        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #555', background: '#2a2a3e', color: '#aaa', cursor: 'pointer' }}
      >
        Reinitialiser
      </button>
    </div>
  );
}
