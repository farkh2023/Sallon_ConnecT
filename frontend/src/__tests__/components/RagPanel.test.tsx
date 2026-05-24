import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useRag', () => ({
  useRag: vi.fn(),
}));

import { useRag } from '@/hooks/useRag';
import { RagPanel } from '@/components/ai/RagPanel';
import type { RagStatusResponse } from '@/lib/types';

const SAFETY = {
  localOnly: true, noCloudAllowed: true, sourceAllowlist: true,
  pathTraversalBlocked: true, secretMaskingEnabled: true,
  maxFileSizeMB: 2, maxQuestionChars: 2000, citationsLocalOnly: true,
};

function mockHook(overrides: Partial<ReturnType<typeof useRag>>) {
  (useRag as ReturnType<typeof vi.fn>).mockReturnValue({
    status:       null,
    searchResult: null,
    askResult:    null,
    loading:      false,
    error:        null,
    loadStatus:   vi.fn(),
    indexDocs:    vi.fn().mockResolvedValue(true),
    search:       vi.fn().mockResolvedValue(null),
    ask:          vi.fn().mockResolvedValue(null),
    clearIndex:   vi.fn().mockResolvedValue(true),
    clearResults: vi.fn(),
    ...overrides,
  });
}

const NOT_INDEXED_STATUS: RagStatusResponse = {
  indexed: false, chunkCount: 0, sources: [], mode: null,
  embeddingModel: null, indexedAt: null, checksum: null,
  ragVersion: null, aiEnabled: false, safety: SAFETY,
};

const INDEXED_STATUS: RagStatusResponse = {
  indexed: true, chunkCount: 12, mode: 'lexical',
  sources: [
    { path: 'README.md', chunks: 5, size: 2048 },
    { path: 'docs/PHASE45.md', chunks: 7, size: 3000 },
  ],
  embeddingModel: null, indexedAt: '2026-05-23T00:00:00.000Z',
  checksum: 'abc123', ragVersion: '46',
  aiEnabled: false, safety: SAFETY,
};

beforeEach(() => { vi.clearAllMocks(); });

// =============================================================================
// RagPanel — etat vide (non indexe)
// =============================================================================

describe('RagPanel — etat vide', () => {
  it('rend sans crash', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    expect(() => render(<RagPanel />)).not.toThrow();
  });

  it('affiche le bouton Indexer documentation', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByRole('button', { name: /indexer documentation/i })).toBeDefined();
  });

  it('affiche le badge RAG local uniquement', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getAllByText(/RAG local uniquement/i).length).toBeGreaterThan(0);
  });

  it('affiche Aucun cloud', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByText(/Aucun cloud/i)).toBeDefined();
  });

  it('affiche Citations obligatoires', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByText(/Citations obligatoires/i)).toBeDefined();
  });

  it('bouton rafraichir RAG est accessible', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByRole('button', { name: /rafraichir le statut rag/i })).toBeDefined();
  });
});

// =============================================================================
// RagPanel — etat indexe
// =============================================================================

describe('RagPanel — etat indexe', () => {
  it('affiche Reindexer quand l\'index existe', () => {
    mockHook({ status: INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByRole('button', { name: /reindexer/i })).toBeDefined();
  });

  it('affiche Supprimer index quand indexe', () => {
    mockHook({ status: INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByRole('button', { name: /supprimer l.index rag/i })).toBeDefined();
  });

  it('affiche le nombre de sources', async () => {
    mockHook({ status: INDEXED_STATUS });
    render(<RagPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Sources indexees/i)).toBeDefined();
    });
  });

  it('affiche le fallback lexical si mode=lexical', async () => {
    mockHook({ status: INDEXED_STATUS });
    render(<RagPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Fallback lexical/i)).toBeDefined();
    });
  });
});

// =============================================================================
// RagPanel — chargement
// =============================================================================

describe('RagPanel — chargement', () => {
  it('rend correctement en etat chargement', () => {
    mockHook({ status: null, loading: true });
    expect(() => render(<RagPanel />)).not.toThrow();
  });
});

// =============================================================================
// RagPanel — erreur
// =============================================================================

describe('RagPanel — erreur reseau', () => {
  it('affiche l\'erreur avec role alert', () => {
    mockHook({ status: NOT_INDEXED_STATUS, error: 'Connexion backend impossible' });
    render(<RagPanel />);
    expect(screen.getByRole('alert')).toBeDefined();
    expect(screen.getByText(/Connexion backend impossible/i)).toBeDefined();
  });
});

// =============================================================================
// RagPanel — accessibilite
// =============================================================================

describe('RagPanel — accessibilite', () => {
  it('a un aria-label sur la section', () => {
    mockHook({ status: NOT_INDEXED_STATUS });
    render(<RagPanel />);
    expect(screen.getByRole('region', { name: /RAG local/i })).toBeDefined();
  });
});
