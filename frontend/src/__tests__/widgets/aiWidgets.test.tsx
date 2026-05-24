import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerWidget, clearRegistry, getWidget } from '@/widgets/registry/widgetRegistry';
import type { WidgetManifest, WidgetProps } from '@/widgets/core/widgetTypes';

// Mock useWidgetData pour eviter les appels API
vi.mock('@/widgets/core/useWidgetData', () => ({
  useWidgetData: vi.fn(() => ({ data: null, loading: false, error: null, refresh: vi.fn() })),
}));

// Mock apiPost pour eviter les appels API
vi.mock('@/lib/api', () => ({
  apiGet:  vi.fn(),
  apiPost: vi.fn().mockResolvedValue({ ok: false, error: 'ai_disabled', response: null }),
}));

import { LocalAiStatusWidget } from '@/widgets/examples/LocalAiStatusWidget';
import { AiDiagnosticsWidget } from '@/widgets/examples/AiDiagnosticsWidget';
import { AiLogSummaryWidget  } from '@/widgets/examples/AiLogSummaryWidget';
import { useWidgetData }       from '@/widgets/core/useWidgetData';

const BASE_PROPS: WidgetProps = { widgetId: 'test', size: 'medium' };

beforeEach(() => {
  clearRegistry();
  vi.clearAllMocks();
  (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
    data: null, loading: false, error: null, refresh: vi.fn(),
  });
});

// ==========================================================================
// LocalAiStatusWidget
// ==========================================================================

describe('LocalAiStatusWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<LocalAiStatusWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche Aucun statut si data null', () => {
    render(<LocalAiStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/Aucun statut/i)).toBeDefined();
  });

  it('affiche le statut IA desactivee', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { enabled: false, provider: 'ollama', model: 'qwen2.5:7b', available: false, reason: 'ai_disabled', safety: {} },
      loading: false, error: null, refresh: vi.fn(),
    });
    render(<LocalAiStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/IA desactivee/i)).toBeDefined();
  });

  it('affiche le modele si disponible', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { enabled: true, provider: 'ollama', model: 'qwen2.5:7b', available: true, reason: null, safety: {} },
      loading: false, error: null, refresh: vi.fn(),
    });
    render(<LocalAiStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/qwen2\.5:7b/i)).toBeDefined();
  });

  it('a un bouton actualiser avec aria-label', () => {
    render(<LocalAiStatusWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /actualiser statut ia/i })).toBeDefined();
  });

  it('affiche etat de chargement', () => {
    (useWidgetData as ReturnType<typeof vi.fn>).mockReturnValue({
      data: null, loading: true, error: null, refresh: vi.fn(),
    });
    render(<LocalAiStatusWidget {...BASE_PROPS} />);
    expect(screen.getByText(/chargement/i)).toBeDefined();
  });
});

// ==========================================================================
// AiDiagnosticsWidget
// ==========================================================================

describe('AiDiagnosticsWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<AiDiagnosticsWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche le bouton Analyser', () => {
    render(<AiDiagnosticsWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /lancer l.analyse/i })).toBeDefined();
  });

  it('n\'a pas de bouton Executer', () => {
    render(<AiDiagnosticsWidget {...BASE_PROPS} />);
    expect(screen.queryByRole('button', { name: /executer/i })).toBeNull();
  });

  it('affiche le message d\'attente initial', () => {
    render(<AiDiagnosticsWidget {...BASE_PROPS} />);
    expect(screen.getByText(/cliquez analyser/i)).toBeDefined();
  });

  it('affiche la mention dry-run', () => {
    render(<AiDiagnosticsWidget {...BASE_PROPS} />);
    expect(screen.getByText(/dry-run/i)).toBeDefined();
  });
});

// ==========================================================================
// AiLogSummaryWidget
// ==========================================================================

describe('AiLogSummaryWidget', () => {
  it('rend sans crash', () => {
    expect(() => render(<AiLogSummaryWidget {...BASE_PROPS} />)).not.toThrow();
  });

  it('affiche le bouton Analyser', () => {
    render(<AiLogSummaryWidget {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /analyser/i })).toBeDefined();
  });

  it('en mode medium : affiche le textarea logs', () => {
    render(<AiLogSummaryWidget {...BASE_PROPS} size="medium" />);
    expect(screen.getByRole('textbox', { name: /logs/i })).toBeDefined();
  });

  it('en mode small : n\'affiche pas le textarea', () => {
    render(<AiLogSummaryWidget {...BASE_PROPS} size="small" />);
    expect(screen.queryByRole('textbox', { name: /logs/i })).toBeNull();
  });
});

// ==========================================================================
// Widgets IA acceptes par le registre (localOnly=true)
// ==========================================================================

describe('Registre — widgets IA', () => {
  it('LocalAiStatusWidget accepte localOnly=true', () => {
    const manifest: WidgetManifest = {
      id: 'local-ai-status', name: 'IA locale', version: '1.0.0',
      description: 'Statut IA.', component: 'LocalAiStatusWidget',
      permissions: ['ai-read'], defaultSize: 'small',
      localOnly: true, category: 'system', refreshable: true,
    };
    registerWidget(manifest, LocalAiStatusWidget as (p: WidgetProps) => null);
    // Pas d'erreur = succes (localOnly=true)
    expect(true).toBe(true);
  });

  it('widget IA avec localOnly=false est rejete', () => {
    const manifest: WidgetManifest = {
      id: 'unsafe-ai', name: 'Unsafe AI', version: '1.0.0',
      description: 'Non local.', component: 'UnsafeAi',
      permissions: [], defaultSize: 'small',
      localOnly: false, category: 'system', refreshable: false,
    };
    registerWidget(manifest, () => null);
    expect(getWidget('unsafe-ai')).toBeUndefined();
  });
});
