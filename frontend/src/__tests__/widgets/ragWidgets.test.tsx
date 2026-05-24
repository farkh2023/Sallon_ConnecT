import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerWidget, clearRegistry, getWidget } from '@/widgets/registry/widgetRegistry';
import type { WidgetManifest, WidgetProps } from '@/widgets/core/widgetTypes';

vi.mock('@/widgets/core/useWidgetData', () => ({
  useWidgetData: vi.fn(() => ({ data: null, loading: false, error: null, refresh: vi.fn() })),
}));

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn().mockResolvedValue({ ok: false, error: 'rag_disabled', response: null }),
}));

import { RagStatusWidget  } from '@/widgets/examples/RagStatusWidget';
import { RagAskWidget     } from '@/widgets/examples/RagAskWidget';
import { RagSourcesWidget } from '@/widgets/examples/RagSourcesWidget';
import { useWidgetData }    from '@/widgets/core/useWidgetData';

const BASE_PROPS: WidgetProps = { widgetId: 'test', size: 'medium' };

beforeEach(() => {
  clearRegistry();
  vi.clearAllMocks();
  (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
    data: null, loading: false, error: null, refresh: vi.fn(),
  });
});

// =============================================================================
// RagStatusWidget
// =============================================================================

describe('RagStatusWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<RagStatusWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche Aucun statut RAG si data null', () => {
    render(<RagStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/Aucun statut RAG/i)).toBeDefined();
  });

  it('affiche Non indexe si indexed=false', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        indexed: false, chunkCount: 0, sources: [], mode: null,
        embeddingModel: null, indexedAt: null, checksum: null, ragVersion: null,
        aiEnabled: false, safety: {},
      },
      loading: false, error: null, refresh: vi.fn(),
    });
    render(<RagStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/Non indexe/i)).toBeDefined();
  });

  it('affiche le nombre de chunks si indexe', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        indexed: true, chunkCount: 42, mode: 'lexical',
        sources: [{ path: 'README.md', chunks: 42, size: 1000 }],
        embeddingModel: null, indexedAt: '2026-05-23T00:00:00.000Z',
        checksum: 'abc', ragVersion: '46', aiEnabled: false, safety: {},
      },
      loading: false, error: null, refresh: vi.fn(),
    });
    render(<RagStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/42 chunks/i)).toBeDefined();
  });

  it('a un bouton actualiser avec aria-label', () => {
    render(<RagStatusWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /actualiser statut rag/i })).toBeDefined();
  });

  it('affiche etat de chargement', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null, loading: true, error: null, refresh: vi.fn(),
    });
    render(<RagStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });
});

// =============================================================================
// RagAskWidget
// =============================================================================

describe('RagAskWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<RagAskWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche le bouton Demander', () => {
    render(<RagAskWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /lancer la question rag/i })).toBeDefined();
  });

  it('en mode medium : affiche l\'input question', () => {
    render(<RagAskWidget {...BASE_PROPS} size="medium" />);
    expect(screen.getByRole('textbox', { name: /question pour le rag/i })).toBeDefined();
  });

  it('en mode small : n\'affiche pas l\'input', () => {
    render(<RagAskWidget {...BASE_PROPS} size="small" />);
    expect(screen.queryByRole('textbox', { name: /question pour le rag/i })).toBeNull();
  });
});

// =============================================================================
// RagSourcesWidget
// =============================================================================

describe('RagSourcesWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<RagSourcesWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche Aucun index RAG si non indexe', () => {
    render(<RagSourcesWidget {...BASE_PROPS} />);
    expect(screen.getByText(/Aucun index RAG/i)).toBeDefined();
  });

  it('affiche les sources si indexe', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        indexed: true, chunkCount: 5, mode: 'lexical',
        sources: [{ path: 'README.md', chunks: 5, size: 1000 }],
        embeddingModel: null, indexedAt: '2026-05-23T00:00:00.000Z',
        checksum: 'abc', ragVersion: '46', aiEnabled: false, safety: {},
      },
      loading: false, error: null, refresh: vi.fn(),
    });
    render(<RagSourcesWidget {...BASE_PROPS} />);
    expect(screen.getByText(/1 source/i)).toBeDefined();
  });

  it('a un bouton actualiser avec aria-label', () => {
    render(<RagSourcesWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /actualiser sources rag/i })).toBeDefined();
  });
});

// =============================================================================
// Registre — widgets RAG (localOnly=true)
// =============================================================================

describe('Registre — widgets RAG', () => {
  it('RagStatusWidget accepte localOnly=true', () => {
    const manifest: WidgetManifest = {
      id: 'rag-status', name: 'RAG statut', version: '1.0.0',
      description: 'Statut RAG.', component: 'RagStatusWidget',
      permissions: ['ai-read'], defaultSize: 'small',
      localOnly: true, category: 'system', refreshable: true,
    };
    expect(() => registerWidget(manifest, RagStatusWidget as (p: WidgetProps) => null)).not.toThrow();
  });

  it('widget RAG avec localOnly=false est rejete', () => {
    const manifest: WidgetManifest = {
      id: 'unsafe-rag', name: 'Unsafe RAG', version: '1.0.0',
      description: 'Non local.', component: 'UnsafeRag',
      permissions: [], defaultSize: 'small',
      localOnly: false, category: 'system', refreshable: false,
    };
    registerWidget(manifest, () => null);
    expect(getWidget('unsafe-rag')).toBeUndefined();
  });
});
