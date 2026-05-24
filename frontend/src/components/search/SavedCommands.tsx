'use client';

import type { SearchCommand } from '@/lib/types';

const CATEGORY_ICONS: Record<string, string> = {
  navigation: '🗺️', action: '⚡', search: '🔍', utility: '🔧',
};

interface SavedCommandsProps {
  commands: SearchCommand[];
  onSelect: (cmd: SearchCommand) => void;
}

export function SavedCommands({ commands, onSelect }: SavedCommandsProps) {
  const navCommands = commands.filter(c => c.category === 'navigation').slice(0, 6);
  const actionCmds  = commands.filter(c => c.category !== 'navigation').slice(0, 4);
  const all         = [...navCommands, ...actionCmds];

  if (all.length === 0) {
    return <div style={{ padding: '8px 14px', color: '#555', fontSize: 12 }}>Aucune commande disponible.</div>;
  }

  return (
    <div>
      <div style={{ padding: '6px 14px 4px', fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>
        Commandes rapides
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '4px 14px 10px' }}>
        {all.map(cmd => (
          <button
            key={cmd.id}
            onClick={() => onSelect(cmd)}
            title={cmd.description}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 4,
              border: '1px solid #2a2a4e', background: '#12121e',
              color: '#a0a0d0', fontSize: 11, cursor: 'pointer',
            }}
          >
            <span>{CATEGORY_ICONS[cmd.category] || '•'}</span>
            <span>{cmd.title.replace('Ouvrir ', '').replace('Lancer ', '').replace('Rechercher dans ', '')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
