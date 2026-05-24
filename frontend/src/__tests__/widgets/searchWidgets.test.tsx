import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock('@/hooks/useGlobalSearch', () => ({
  useGlobalSearch: vi.fn(),
}));

import { apiGet, apiPost } from '@/lib/api';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { GlobalSearchWidget    } from '@/widgets/examples/GlobalSearchWidget';
import { CommandCenterWidget   } from '@/widgets/examples/CommandCenterWidget';
import { RecentSearchesWidget  } from '@/widgets/examples/RecentSearchesWidget';

const BASE = { widgetId: 'global-search', size: 'medium' as const };

const MOCK_HOOK = {
  results: [], groups: {}, commands: [], history: [],
  loading: false, error: null, enabled: true,
  query: '', setQuery: vi.fn(),
  search: vi.fn(), loadCommands: vi.fn(),
  previewCommand: vi.fn(), runCommand: vi.fn(), clearHistory: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiGet).mockResolvedValue({ ok: true, enabled: true, commands: 15, indexed: 20 });
  vi.mocked(apiPost).mockResolvedValue({ ok: true, results: [{ id: 'r1', type: 'command', title: 'Dashboard', description: 'Nav', score: 2, source: 'cmd', target: '/dashboard', tags: [], actions: ['open'], localOnly: true }], groups: {}, total: 1 });
  vi.mocked(useGlobalSearch).mockReturnValue({ ...MOCK_HOOK });
});

describe('GlobalSearchWidget', () => {
  it('affiche le titre', () => {
    render(<GlobalSearchWidget {...BASE} />);
    expect(screen.getByText('Recherche globale')).toBeTruthy();
  });

  it('affiche le badge local uniquement', () => {
    render(<GlobalSearchWidget {...BASE} />);
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });

  it('contient un champ de recherche', () => {
    render(<GlobalSearchWidget {...BASE} />);
    expect(screen.getByLabelText(/Recherche globale widget/i)).toBeTruthy();
  });

  it('lance une recherche au submit', async () => {
    render(<GlobalSearchWidget {...BASE} />);
    const input = screen.getByLabelText(/Recherche globale widget/i);
    await userEvent.type(input, 'workflow');
    await userEvent.click(screen.getByText('🔍'));
    expect(vi.mocked(apiPost)).toHaveBeenCalledWith('/api/search', expect.objectContaining({ query: 'workflow' }));
  });
});

describe('CommandCenterWidget', () => {
  it('affiche le titre', () => {
    render(<CommandCenterWidget widgetId="command-center" size="medium" />);
    expect(screen.getByText('Command Center')).toBeTruthy();
  });

  it('affiche le bouton Ctrl+K', () => {
    render(<CommandCenterWidget widgetId="command-center" size="medium" />);
    expect(screen.getByText('Ctrl+K')).toBeTruthy();
  });

  it('ouvre le modal au clic', async () => {
    render(<CommandCenterWidget widgetId="command-center" size="medium" />);
    const btn = screen.getByLabelText(/Ouvrir le command center/i);
    await userEvent.click(btn);
    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});

describe('RecentSearchesWidget', () => {
  it('affiche le titre', () => {
    render(<RecentSearchesWidget widgetId="recent-searches" size="medium" />);
    expect(screen.getByText('Recherches recentes')).toBeTruthy();
  });

  it('affiche message vide quand pas d\'historique', () => {
    render(<RecentSearchesWidget widgetId="recent-searches" size="medium" />);
    expect(screen.getByText('Aucune recherche recente.')).toBeTruthy();
  });

  it('affiche le badge local uniquement', () => {
    render(<RecentSearchesWidget widgetId="recent-searches" size="medium" />);
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });
});
