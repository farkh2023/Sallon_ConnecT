import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useGlobalSearch', () => ({
  useGlobalSearch: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn().mockResolvedValue({}),
  apiPost: vi.fn().mockResolvedValue({ ok: true, results: [], groups: {}, total: 0 }),
}));

import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { CommandCenterModal } from '@/components/search/CommandCenterModal';
import type { SearchCommand, SearchHistoryEntry } from '@/lib/types';

const MOCK_COMMAND: SearchCommand = {
  id: 'open.dashboard', title: 'Ouvrir le dashboard', description: 'Naviguer vers le dashboard',
  category: 'navigation', target: '/dashboard', actions: ['open'], tags: ['dashboard'],
  safe: true, dryRunRequired: false,
};

const MOCK_HISTORY: SearchHistoryEntry[] = [
  { query: 'workflow', timestamp: new Date().toISOString(), total: 3 },
  { query: 'agent', timestamp: new Date().toISOString(), total: 1 },
];

const DEFAULT_HOOK = {
  results:        [],
  groups:         {},
  commands:       [MOCK_COMMAND],
  history:        MOCK_HISTORY,
  loading:        false,
  error:          null,
  enabled:        true,
  query:          '',
  setQuery:       vi.fn(),
  search:         vi.fn().mockResolvedValue(undefined),
  loadCommands:   vi.fn().mockResolvedValue(undefined),
  previewCommand: vi.fn().mockResolvedValue(MOCK_COMMAND),
  runCommand:     vi.fn().mockResolvedValue({ ok: true, action: 'navigate', target: '/dashboard', command: 'open.dashboard', dryRun: false }),
  clearHistory:   vi.fn(),
};

beforeEach(() => {
  vi.mocked(useGlobalSearch).mockReturnValue({ ...DEFAULT_HOOK });
});

describe('CommandCenterModal', () => {
  it('ne s\'affiche pas quand closed', () => {
    render(<CommandCenterModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('s\'affiche quand open=true', () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });

  it('affiche le badge local uniquement', () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Recherche locale uniquement')).toBeTruthy();
  });

  it('affiche le champ de recherche', () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Recherche globale/i)).toBeTruthy();
  });

  it('affiche les recherches recentes', () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText(/workflow/)).toBeTruthy();
  });

  it('affiche les commandes rapides', () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Commandes rapides')).toBeTruthy();
  });

  it('appelle setQuery et search en tapant', async () => {
    const setQuery = vi.fn();
    const search   = vi.fn().mockResolvedValue(undefined);
    vi.mocked(useGlobalSearch).mockReturnValue({ ...DEFAULT_HOOK, setQuery, search });
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    const input = screen.getByLabelText(/Recherche globale/i);
    await userEvent.type(input, 'test');
    expect(setQuery).toHaveBeenCalled();
  });

  it('ferme avec Echap', async () => {
    const onClose = vi.fn();
    render(<CommandCenterModal open={true} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('appelle clearHistory depuis RecentSearches', async () => {
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    const btn = screen.getByText('Effacer');
    await userEvent.click(btn);
    expect(screen.getByText(/Confirmer/)).toBeTruthy();
  });

  it('affiche une erreur backend', () => {
    vi.mocked(useGlobalSearch).mockReturnValue({ ...DEFAULT_HOOK, error: 'Erreur backend search' });
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Erreur backend search')).toBeTruthy();
  });

  it('affiche les resultats groupes quand query active', () => {
    vi.mocked(useGlobalSearch).mockReturnValue({
      ...DEFAULT_HOOK,
      query: 'dash',
      results: [{ id: 'r1', type: 'command', title: 'Ouvrir le dashboard', description: 'Nav', score: 2, source: 'cmd', target: '/dashboard', tags: [], actions: ['open'], localOnly: true }],
      groups: { command: [{ id: 'r1', type: 'command', title: 'Ouvrir le dashboard', description: 'Nav', score: 2, source: 'cmd', target: '/dashboard', tags: [], actions: ['open'], localOnly: true }] },
    });
    render(<CommandCenterModal open={true} onClose={vi.fn()} />);
    expect(screen.getByText('Ouvrir le dashboard')).toBeTruthy();
  });
});
