import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useKnowledge', () => ({
  useKnowledge: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:    vi.fn().mockResolvedValue({}),
  apiPost:   vi.fn().mockResolvedValue({ ok: true }),
  apiPatch:  vi.fn().mockResolvedValue({ ok: true }),
  apiDelete: vi.fn().mockResolvedValue({ ok: true }),
}));

import { useKnowledge } from '@/hooks/useKnowledge';
import { KnowledgeBasePanel } from '@/components/ai/KnowledgeBasePanel';
import type { KnowledgeItem, KnowledgeSafetyFlags } from '@/lib/types';

const SAFETY: KnowledgeSafetyFlags = {
  localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true,
  pathTraversalBlocked: true, clearRequiresConfirmation: true,
  importExportDisabled: true, embeddingsOptional: true,
};

const ITEM: KnowledgeItem = {
  id: 'kb_test1', type: 'note', title: 'Item Knowledge Test',
  content: 'Contenu de test', sourceId: undefined,
  tags: ['test'], entities: ['ollama'], relations: [],
  importance: 3, createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(), localOnly: true,
};

const DEFAULT_HOOK = {
  items:     [ITEM],
  meta:      { totalItems: 1, byType: { note: 1 }, bySource: {}, updatedAt: null },
  safety:    SAFETY,
  loading:   false,
  error:     null,
  enabled:   true,
  loadItems: vi.fn().mockResolvedValue(undefined),
  search:    vi.fn().mockResolvedValue([]),
  getGraph:  vi.fn().mockResolvedValue({ nodes: [], edges: [], totalNodes: 0, totalEdges: 0, generatedAt: new Date().toISOString() }),
  summarize: vi.fn().mockResolvedValue({ summaries: {} }),
  reindex:   vi.fn().mockResolvedValue(true),
  clearAll:  vi.fn().mockResolvedValue(true),
};

beforeEach(() => {
  vi.mocked(useKnowledge).mockReturnValue({ ...DEFAULT_HOOK });
});

describe('KnowledgeBasePanel', () => {
  it('affiche le titre', () => {
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('Base de connaissances locale')).toBeTruthy();
  });

  it('affiche le badge local uniquement', () => {
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('Base locale uniquement')).toBeTruthy();
  });

  it('affiche le badge KB active', () => {
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('KB active')).toBeTruthy();
  });

  it('affiche le badge KB desactivee si disabled', () => {
    vi.mocked(useKnowledge).mockReturnValue({ ...DEFAULT_HOOK, enabled: false });
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('KB desactivee')).toBeTruthy();
  });

  it('affiche les 4 onglets', () => {
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('Base')).toBeTruthy();
    expect(screen.getByText('Recherche')).toBeTruthy();
    expect(screen.getByText('Graphe')).toBeTruthy();
    expect(screen.getByText('Resumes')).toBeTruthy();
  });

  it('affiche les items de la base', () => {
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('Item Knowledge Test')).toBeTruthy();
  });

  it('etat vide de la base', () => {
    vi.mocked(useKnowledge).mockReturnValue({ ...DEFAULT_HOOK, items: [] });
    render(<KnowledgeBasePanel />);
    expect(screen.getByText('Base de connaissances vide.')).toBeTruthy();
  });

  it('bascule vers onglet Recherche', async () => {
    render(<KnowledgeBasePanel />);
    await userEvent.click(screen.getByText('Recherche'));
    expect(screen.getByLabelText(/Recherche dans la base de connaissances/i)).toBeTruthy();
  });

  it('bascule vers onglet Graphe', async () => {
    render(<KnowledgeBasePanel />);
    await userEvent.click(screen.getByText('Graphe'));
    expect(screen.getByText('Generer le graphe')).toBeTruthy();
  });

  it('bascule vers onglet Resumes', async () => {
    render(<KnowledgeBasePanel />);
    await userEvent.click(screen.getByText('Resumes'));
    expect(screen.getByText('Tout resumer')).toBeTruthy();
  });

  it('affiche une erreur backend', () => {
    vi.mocked(useKnowledge).mockReturnValue({ ...DEFAULT_HOOK, error: 'Erreur knowledge backend' });
    render(<KnowledgeBasePanel />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Erreur knowledge backend')).toBeTruthy();
  });

  it('confirmation avant effacement', async () => {
    render(<KnowledgeBasePanel />);
    const clearBtn = screen.getByText('Effacer la base');
    await userEvent.click(clearBtn);
    expect(screen.queryByText(/Confirmer/)).toBeTruthy();
  });
});
