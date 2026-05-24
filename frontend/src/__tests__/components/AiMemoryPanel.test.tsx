import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/hooks/useMemory', () => ({
  useMemory: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  apiGet:    vi.fn().mockResolvedValue({}),
  apiPost:   vi.fn().mockResolvedValue({ ok: true }),
  apiPatch:  vi.fn().mockResolvedValue({ ok: true }),
  apiDelete: vi.fn().mockResolvedValue({ ok: true }),
}));

import { useMemory } from '@/hooks/useMemory';
import { AiMemoryPanel } from '@/components/ai/AiMemoryPanel';
import type { MemoryItem, MemorySafetyFlags } from '@/lib/types';

const SAFETY: MemorySafetyFlags = {
  localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true,
  humanControlRequired: true, exportSanitized: true,
  memoryTypes: ['note', 'fact'], memoryScopes: ['user', 'project'],
  maxItems: 1000, maxItemChars: 4000, embeddingsEnabled: false, includeInRag: false,
};

const ITEM: MemoryItem = {
  id: 'mem_test1', type: 'note', scope: 'user', content: 'Item de test important',
  tags: ['test'], importance: 3, source: 'manual',
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  lastAccessedAt: new Date().toISOString(), expiresAt: null, localOnly: true, embeddingHash: null,
};

const DEFAULT_HOOK = {
  items: [ITEM],
  meta: { totalItems: 1, byType: { note: 1 }, byScope: { user: 1 }, updatedAt: null },
  safety: SAFETY,
  loading: false,
  error: null,
  enabled: true,
  loadItems:  vi.fn().mockResolvedValue(undefined),
  createItem: vi.fn().mockResolvedValue(true),
  updateItem: vi.fn().mockResolvedValue(true),
  deleteItem: vi.fn().mockResolvedValue(true),
  search:     vi.fn().mockResolvedValue([]),
  summarize:  vi.fn().mockResolvedValue({ ok: true, summary: 'Resume test.', method: 'extractive', items: 1 }),
  exportAll:  vi.fn().mockResolvedValue('memory-export.json'),
  clearAll:   vi.fn().mockResolvedValue(true),
};

beforeEach(() => {
  vi.mocked(useMemory).mockReturnValue({ ...DEFAULT_HOOK });
});

describe('AiMemoryPanel', () => {
  it('affiche le titre et les badges de securite', () => {
    render(<AiMemoryPanel />);
    expect(screen.getByText('Memoire persistante IA')).toBeTruthy();
    expect(screen.getByText('Local uniquement')).toBeTruthy();
  });

  it('affiche les 5 onglets de navigation', () => {
    render(<AiMemoryPanel />);
    expect(screen.getByText('Memoire')).toBeTruthy();
    expect(screen.getByText('Ajouter')).toBeTruthy();
    expect(screen.getByText('Recherche')).toBeTruthy();
    expect(screen.getByText('Export/Import')).toBeTruthy();
    expect(screen.getByText('Retention')).toBeTruthy();
  });

  it('affiche la liste des items en memoire', () => {
    render(<AiMemoryPanel />);
    expect(screen.getByText('Item de test important')).toBeTruthy();
  });

  it('bascule vers l\'onglet Ajouter', async () => {
    render(<AiMemoryPanel />);
    await userEvent.click(screen.getByText('Ajouter'));
    expect(screen.getByLabelText(/Contenu de l'item memoire/i)).toBeTruthy();
  });

  it('bascule vers l\'onglet Recherche', async () => {
    render(<AiMemoryPanel />);
    await userEvent.click(screen.getByText('Recherche'));
    expect(screen.getByLabelText(/Recherche dans la memoire/i)).toBeTruthy();
  });

  it('bascule vers l\'onglet Export/Import', async () => {
    render(<AiMemoryPanel />);
    await userEvent.click(screen.getByText('Export/Import'));
    expect(screen.getByText('Exporter la memoire')).toBeTruthy();
  });

  it('bascule vers l\'onglet Retention', async () => {
    render(<AiMemoryPanel />);
    await userEvent.click(screen.getByText('Retention'));
    expect(screen.getByText('Parametres de retention')).toBeTruthy();
  });

  it('affiche un message d\'erreur', () => {
    vi.mocked(useMemory).mockReturnValue({
      ...DEFAULT_HOOK,
      items: [],
      error: 'Erreur chargement memoire',
    });
    render(<AiMemoryPanel />);
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Erreur chargement memoire')).toBeTruthy();
  });

  it('affiche le badge Memoire active', () => {
    render(<AiMemoryPanel />);
    expect(screen.getByText('Memoire active')).toBeTruthy();
  });

  it('affiche le badge Memoire desactivee si disabled', () => {
    vi.mocked(useMemory).mockReturnValue({ ...DEFAULT_HOOK, enabled: false });
    render(<AiMemoryPanel />);
    expect(screen.getByText('Memoire desactivee')).toBeTruthy();
  });
});
