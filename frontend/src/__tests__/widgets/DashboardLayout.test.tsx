import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardLayout } from '@/widgets/layouts/DashboardLayout';
import { registerWidget, clearRegistry } from '@/widgets/registry/widgetRegistry';
import type { WidgetManifest, WidgetProps } from '@/widgets/core/widgetTypes';

// Widget statique (sans appel API)
function MockWidget({ size }: WidgetProps) {
  return <div data-testid="mock-widget">Widget-{size}</div>;
}

// Widget qui crashe (test isolation ErrorBoundary)
function CrashWidget(_p: WidgetProps): null {
  throw new Error('Widget crash intentionnel');
}

const MANIFEST: WidgetManifest = {
  id: 'mock-widget', name: 'Mock Widget', version: '1.0.0',
  description: 'Widget de test.', component: 'MockWidget',
  permissions: [], defaultSize: 'medium', localOnly: true,
  category: 'system', refreshable: false,
};

const CRASH_MANIFEST: WidgetManifest = {
  id: 'crash-widget', name: 'Crash Widget', version: '1.0.0',
  description: 'Se plante.', component: 'CrashWidget',
  permissions: [], defaultSize: 'small', localOnly: true,
  category: 'system', refreshable: false,
};

beforeEach(() => {
  clearRegistry();
  localStorage.clear();
});

describe('DashboardLayout — rendu de base', () => {
  it('ne plante pas avec un registre vide', () => {
    expect(() => render(<DashboardLayout />)).not.toThrow();
  });

  it('affiche l\'etat vide quand aucun widget n\'est enregistre', async () => {
    render(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.getByText(/Aucun widget actif/i)).toBeDefined();
    });
  });

  it('rend un widget enregistre', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0);
    });
  });

  it('ne plante pas sans widgets (responsive minimal)', () => {
    expect(() => render(<DashboardLayout />)).not.toThrow();
    expect(screen.queryAllByTestId('mock-widget').length).toBe(0);
  });
});

describe('DashboardLayout — gestion widgets', () => {
  it('masque un widget apres clic sur le bouton fermer', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);

    await waitFor(() => {
      expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0);
    });

    const hideBtn = screen.getByRole('button', { name: /Masquer Mock Widget/i });
    fireEvent.click(hideBtn);

    await waitFor(() => {
      expect(screen.queryAllByTestId('mock-widget').length).toBe(0);
    });
  });

  it('sauvegarde le layout dans localStorage', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0);
    });
    expect(localStorage.getItem('sallon-connect-widget-layout-v1')).not.toBeNull();
  });

  it('restaure un layout sauvegarde (widget invisible)', async () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', JSON.stringify({
      version: '1.0', updatedAt: new Date().toISOString(),
      widgets: [{ widgetId: 'mock-widget', size: 'medium', visible: false, order: 0 }],
    }));
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.queryAllByTestId('mock-widget').length).toBe(0);
    });
  });
});

describe('DashboardLayout — drag & drop', () => {
  it('reordonne deux widgets sans crash', async () => {
    registerWidget(MANIFEST, MockWidget);
    registerWidget({ ...MANIFEST, id: 'mock-2', name: 'Mock 2' }, MockWidget);
    render(<DashboardLayout />);

    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBe(2));

    const articles = screen.getAllByRole('article');
    fireEvent.dragStart(articles[0]);
    fireEvent.dragOver(articles[1]);
    fireEvent.drop(articles[1]);
    fireEvent.dragEnd(articles[0]);

    expect(screen.getAllByTestId('mock-widget').length).toBe(2);
  });
});

describe('DashboardLayout — isolation erreurs widget', () => {
  it('isole un widget qui crashe (ErrorBoundary)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerWidget(CRASH_MANIFEST, CrashWidget as typeof MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => { expect(screen.getByText(/Erreur/i)).toBeDefined(); });
    spy.mockRestore();
  });

  it('les autres widgets restent visibles si l\'un crashe', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    registerWidget(MANIFEST,       MockWidget);
    registerWidget(CRASH_MANIFEST, CrashWidget as typeof MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0);
      expect(screen.getByText(/Erreur/i)).toBeDefined();
    });
    spy.mockRestore();
  });
});

describe('DashboardLayout — mode compact', () => {
  it('bascule en mode compact sans crash', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /Compact/i }));
    expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0);
  });
});

describe('DashboardLayout — localStorage corrompu', () => {
  it('ne plante pas si localStorage contient du JSON invalide', async () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', '{malformed}');
    registerWidget(MANIFEST, MockWidget);
    expect(() => render(<DashboardLayout />)).not.toThrow();
    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));
  });

  it('repond au layout par defaut si localStorage corrompu', async () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', '{"version":"1.0","updatedAt":"x"}');
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));
  });
});

describe('DashboardLayout — reset layout', () => {
  it('reinitialise le layout et affiche a nouveau un widget masque', async () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', JSON.stringify({
      version: '1.0', updatedAt: new Date().toISOString(),
      widgets: [{ widgetId: 'mock-widget', size: 'medium', visible: false, order: 0 }],
    }));
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);

    await waitFor(() => expect(screen.queryAllByTestId('mock-widget').length).toBe(0));

    fireEvent.click(screen.getByRole('button', { name: /Reinitialiser/i }));

    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));
  });
});

describe('DashboardLayout — accessibilite', () => {
  it('les boutons principaux ont des labels lisibles par les lecteurs d\'ecran', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));

    expect(screen.getByRole('button', { name: /Compact/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Reinitialiser/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Ajouter widget/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Exporter/i })).toBeDefined();
  });

  it('le bouton Masquer porte un aria-label specifique au widget', async () => {
    registerWidget(MANIFEST, MockWidget);
    render(<DashboardLayout />);
    await waitFor(() => expect(screen.getAllByTestId('mock-widget').length).toBeGreaterThan(0));
    expect(screen.getByRole('button', { name: /Masquer Mock Widget/i })).toBeDefined();
  });
});

describe('DashboardLayout — plugins widgets', () => {
  it('accepte un widget fourni par un plugin local', async () => {
    const pluginManifest: WidgetManifest = {
      id: 'plugin-test-widget', name: 'Plugin Widget', version: '1.0.0',
      description: 'Widget plugin test.', component: 'PluginTestWidget',
      permissions: ['read:diagnostics'], defaultSize: 'medium',
      localOnly: true, category: 'plugins', refreshable: false,
    };
    function PluginWidget(_p: WidgetProps) {
      return <div data-testid="plugin-widget">plugin</div>;
    }
    registerWidget(pluginManifest, PluginWidget);
    render(<DashboardLayout />);
    await waitFor(() => { expect(screen.getAllByTestId('plugin-widget').length).toBeGreaterThan(0); });
  });
});
