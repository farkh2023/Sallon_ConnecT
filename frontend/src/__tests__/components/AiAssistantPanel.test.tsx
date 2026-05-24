import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock du hook useAiAssistant pour éviter les appels réseau
vi.mock('@/hooks/useAiAssistant', () => ({
  useAiAssistant: vi.fn(),
}));

import { useAiAssistant } from '@/hooks/useAiAssistant';
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel';
import type { AiStatusResponse } from '@/lib/types';

const SAFETY = {
  localOnly: true, noCloudAllowed: true, noAutoExecution: true,
  ollamaLocalOnly: true, maxInputChars: 12000, secretMaskingEnabled: true,
  dangerousCommandBlocking: true, suggestionsAreDryRunOnly: true,
};

function mockHook(overrides: Partial<ReturnType<typeof useAiAssistant>>) {
  (useAiAssistant as ReturnType<typeof vi.fn>).mockReturnValue({
    status:              null,
    messages:            [],
    loading:             false,
    error:               null,
    loadStatus:          vi.fn(),
    sendMessage:         vi.fn(),
    analyzeDiagnostics:  vi.fn(),
    suggestCommand:      vi.fn(),
    clearMessages:       vi.fn(),
    ...overrides,
  });
}

const DISABLED_STATUS: AiStatusResponse = {
  enabled: false, provider: 'ollama', model: 'qwen2.5:7b',
  available: false, reason: 'ai_disabled', safety: SAFETY,
};

const UNAVAILABLE_STATUS: AiStatusResponse = {
  enabled: true, provider: 'ollama', model: 'qwen2.5:7b',
  available: false, reason: 'ollama_indisponible', safety: SAFETY,
};

beforeEach(() => { vi.clearAllMocks(); });

describe('AiAssistantPanel — etat desactive', () => {
  it('rend sans crash', () => {
    mockHook({ status: DISABLED_STATUS });
    expect(() => render(<AiAssistantPanel />)).not.toThrow();
  });

  it('affiche le badge IA desactivee', async () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/IA desactivee/i)).toBeDefined();
    });
  });

  it('affiche les instructions d\'activation', async () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/SALLON_AI_ENABLED/)).toBeDefined();
    });
  });

  it('n\'a pas de bouton Executer ou Restaurer', () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    expect(screen.queryByRole('button', { name: /executer/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /restaurer/i })).toBeNull();
  });
});

describe('AiAssistantPanel — Ollama indisponible', () => {
  it('affiche l\'avertissement Ollama', async () => {
    mockHook({ status: UNAVAILABLE_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Ollama non disponible/i)).toBeDefined();
    });
  });

  it('affiche la raison d\'indisponibilite', async () => {
    mockHook({ status: UNAVAILABLE_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/ollama_indisponible/i)).toBeDefined();
    });
  });
});

describe('AiAssistantPanel — badges securite', () => {
  it('affiche le badge Local IA uniquement', async () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getAllByText(/Local IA uniquement/i).length).toBeGreaterThan(0);
    });
  });

  it('affiche Aucun cloud', async () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/Aucun cloud/i)).toBeDefined();
    });
  });

  it('affiche Suggestions dry-run seulement', async () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    await waitFor(() => {
      expect(screen.getByText(/dry-run/i)).toBeDefined();
    });
  });
});

describe('AiAssistantPanel — accessibilite', () => {
  it('le panel a un aria-label', () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    expect(screen.getByRole('region', { name: /assistant ia local/i })).toBeDefined();
  });

  it('le bouton rafraichir statut est accessible', () => {
    mockHook({ status: DISABLED_STATUS });
    render(<AiAssistantPanel />);
    expect(screen.getByRole('button', { name: /rafraichir le statut ia/i })).toBeDefined();
  });
});

describe('AiAssistantPanel — chargement', () => {
  it('rend correctement en etat chargement', () => {
    mockHook({ status: null, loading: true });
    expect(() => render(<AiAssistantPanel />)).not.toThrow();
  });
});
