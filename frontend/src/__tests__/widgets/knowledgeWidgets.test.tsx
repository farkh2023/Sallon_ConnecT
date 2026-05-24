import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from '@/lib/api';
import { KnowledgeStatusWidget } from '@/widgets/examples/KnowledgeStatusWidget';
import { KnowledgeSearchWidget } from '@/widgets/examples/KnowledgeSearchWidget';
import { KnowledgeGraphWidget  } from '@/widgets/examples/KnowledgeGraphWidget';

const BASE_PROPS = { widgetId: 'knowledge-status', size: 'medium' as const };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiGet).mockResolvedValue({
    ok: true, enabled: true,
    meta: { totalItems: 42, byType: {}, bySource: {}, updatedAt: null },
    safety: { localOnly: true },
  });
  vi.mocked(apiPost).mockResolvedValue({
    ok: true, results: [{ id: 'kb_1', type: 'note', title: 'Resultat test', _score: 2 }], total: 1,
  });
});

describe('KnowledgeStatusWidget', () => {
  it('affiche le titre', async () => {
    render(<KnowledgeStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText('Base de connaissances')).toBeTruthy();
  });

  it('affiche Local uniquement', () => {
    render(<KnowledgeStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });

  it('affiche Active quand enabled', async () => {
    render(<KnowledgeStatusWidget {...BASE_PROPS} />);
    await vi.waitFor(() => expect(screen.getByText('Active')).toBeTruthy());
  });

  it('affiche Inactif quand disabled', async () => {
    vi.mocked(apiGet).mockResolvedValue({ ok: true, enabled: false, meta: { totalItems: 0, byType: {}, bySource: {}, updatedAt: null } });
    render(<KnowledgeStatusWidget {...BASE_PROPS} />);
    await vi.waitFor(() => expect(screen.getByText('Inactif')).toBeTruthy());
  });
});

describe('KnowledgeSearchWidget', () => {
  it('affiche le titre du widget', () => {
    render(<KnowledgeSearchWidget widgetId="knowledge-search" size="medium" />);
    expect(screen.getByText('Recherche Knowledge')).toBeTruthy();
  });

  it('contient un champ de recherche', () => {
    render(<KnowledgeSearchWidget widgetId="knowledge-search" size="medium" />);
    expect(screen.getByLabelText(/Recherche knowledge widget/i)).toBeTruthy();
  });

  it('lance une recherche au submit', async () => {
    render(<KnowledgeSearchWidget widgetId="knowledge-search" size="medium" />);
    const input = screen.getByLabelText(/Recherche knowledge widget/i);
    await userEvent.type(input, 'ollama');
    await userEvent.click(screen.getByText('OK'));
    expect(vi.mocked(apiPost)).toHaveBeenCalledWith('/api/ai/knowledge/search', expect.objectContaining({ query: 'ollama' }));
  });
});

describe('KnowledgeGraphWidget', () => {
  it('affiche le titre', () => {
    render(<KnowledgeGraphWidget widgetId="knowledge-graph" size="medium" />);
    expect(screen.getByText('Graphe Knowledge')).toBeTruthy();
  });

  it('affiche le bouton Generer', () => {
    render(<KnowledgeGraphWidget widgetId="knowledge-graph" size="medium" />);
    expect(screen.getByText('Generer')).toBeTruthy();
  });

  it('genere le graphe au clic', async () => {
    vi.mocked(apiPost).mockResolvedValue({ ok: true, nodes: [], edges: [], totalNodes: 0, totalEdges: 0, generatedAt: new Date().toISOString() });
    render(<KnowledgeGraphWidget widgetId="knowledge-graph" size="medium" />);
    await userEvent.click(screen.getByText('Generer'));
    expect(vi.mocked(apiPost)).toHaveBeenCalledWith('/api/ai/knowledge/graph', {});
  });
});
