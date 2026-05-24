import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/widgets/core/useWidgetData', () => ({
  useWidgetData: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn().mockResolvedValue({ ok: true, results: [], total: 0 }),
}));

import { useWidgetData } from '@/widgets/core/useWidgetData';
import { MemoryStatusWidget } from '@/widgets/examples/MemoryStatusWidget';
import { MemoryRecentWidget } from '@/widgets/examples/MemoryRecentWidget';
import { MemorySearchWidget } from '@/widgets/examples/MemorySearchWidget';
import type { MemoryStatusResponse, MemoryListResponse } from '@/lib/types';

function mockWidgetData<T>(overrides: { data?: T; loading?: boolean; error?: string | null; refresh?: () => void }) {
  (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
    data: null, loading: false, error: null, refresh: vi.fn(), ...overrides,
  });
}

// ── MemoryStatusWidget ────────────────────────────────────────────────────────

describe('MemoryStatusWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'en-tete "Memoire IA locale"', () => {
    render(<MemoryStatusWidget size="small" />);
    expect(screen.getByText('Memoire IA locale')).toBeTruthy();
  });

  it('affiche "Chargement..." pendant le chargement', () => {
    mockWidgetData({ loading: true });
    render(<MemoryStatusWidget size="small" />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('affiche le statut si memoire active', () => {
    const data: MemoryStatusResponse = {
      ok: true, enabled: true,
      safety: { localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true,
                humanControlRequired: true, exportSanitized: true,
                memoryTypes: [], memoryScopes: [], maxItems: 1000, maxItemChars: 4000,
                embeddingsEnabled: false, includeInRag: false },
      retention: { totalItems: 5, maxItems: 1000, retentionDays: 90, byType: {}, byScope: {} },
    };
    mockWidgetData({ data });
    render(<MemoryStatusWidget size="small" />);
    expect(screen.getByText('Active')).toBeTruthy();
    expect(screen.getByText('5 / 1000 items')).toBeTruthy();
  });

  it('affiche une erreur', () => {
    mockWidgetData({ error: 'Erreur memoire' });
    render(<MemoryStatusWidget size="small" />);
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('affiche le badge local-only', () => {
    const data: MemoryStatusResponse = {
      ok: true, enabled: false,
      safety: { localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true,
                humanControlRequired: true, exportSanitized: true,
                memoryTypes: [], memoryScopes: [], maxItems: 1000, maxItemChars: 4000,
                embeddingsEnabled: false, includeInRag: false },
      retention: { totalItems: 0, maxItems: 1000, retentionDays: 90, byType: {}, byScope: {} },
    };
    mockWidgetData({ data });
    render(<MemoryStatusWidget size="small" />);
    expect(screen.getByText('local-only')).toBeTruthy();
  });
});

// ── MemoryRecentWidget ────────────────────────────────────────────────────────

describe('MemoryRecentWidget', () => {
  beforeEach(() => mockWidgetData({ data: null }));

  it('affiche l\'en-tete "Memoire recente"', () => {
    render(<MemoryRecentWidget size="small" />);
    expect(screen.getByText('Memoire recente')).toBeTruthy();
  });

  it('affiche "Chargement..." pendant le chargement', () => {
    mockWidgetData({ loading: true });
    render(<MemoryRecentWidget size="small" />);
    expect(screen.getByText('Chargement...')).toBeTruthy();
  });

  it('affiche le nombre total d\'items', () => {
    const now = new Date().toISOString();
    const data: MemoryListResponse = {
      items: [
        { id: 'mem1', type: 'note', scope: 'user', content: 'Item recent',
          tags: [], importance: 1, source: 'manual', createdAt: now, updatedAt: now,
          lastAccessedAt: now, expiresAt: null, localOnly: true, embeddingHash: null },
      ],
      total: 1,
      meta: { totalItems: 1, byType: { note: 1 }, byScope: { user: 1 }, updatedAt: null },
      safety: { localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true,
                humanControlRequired: true, exportSanitized: true,
                memoryTypes: [], memoryScopes: [], maxItems: 1000, maxItemChars: 4000,
                embeddingsEnabled: false, includeInRag: false },
    };
    mockWidgetData({ data });
    render(<MemoryRecentWidget size="small" />);
    expect(screen.getByText('1 item')).toBeTruthy();
    expect(screen.getByText('Item recent')).toBeTruthy();
  });
});

// ── MemorySearchWidget ────────────────────────────────────────────────────────

describe('MemorySearchWidget', () => {
  it('affiche l\'en-tete', () => {
    render(<MemorySearchWidget size="medium" />);
    expect(screen.getByText('Recherche memoire IA')).toBeTruthy();
  });

  it('affiche le champ de recherche', () => {
    render(<MemorySearchWidget size="medium" />);
    expect(screen.getByLabelText(/Requete de recherche memoire/i)).toBeTruthy();
  });

  it('le bouton de recherche est desactive si requete vide', () => {
    render(<MemorySearchWidget size="medium" />);
    const btn = screen.getByLabelText('Rechercher dans la memoire');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
