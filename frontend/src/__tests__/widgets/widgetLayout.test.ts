import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveLayout, loadLayout, clearLayout,
  exportLayoutJson, importLayoutJson,
} from '@/widgets/core/widgetLayoutStore';
import type { SavedDashboardLayout } from '@/widgets/core/widgetTypes';

const MOCK: SavedDashboardLayout = {
  version:   '1.0',
  updatedAt: '2024-01-01T00:00:00.000Z',
  widgets:   [
    { widgetId: 'system-health', size: 'medium', visible: true,  order: 0 },
    { widgetId: 'notifications', size: 'small',  visible: false, order: 1 },
  ],
};

beforeEach(() => clearLayout());

describe('widgetLayoutStore — persistance', () => {
  it('sauvegarde et recharge le layout', () => {
    saveLayout(MOCK);
    const loaded = loadLayout();
    expect(loaded).not.toBeNull();
    expect(loaded!.widgets).toHaveLength(2);
    expect(loaded!.version).toBe('1.0');
  });

  it('loadLayout retourne null si rien de sauvegarde', () => {
    expect(loadLayout()).toBeNull();
  });

  it('clearLayout supprime le layout sauvegarde', () => {
    saveLayout(MOCK);
    clearLayout();
    expect(loadLayout()).toBeNull();
  });

  it('preserves le statut visible/invisible', () => {
    saveLayout(MOCK);
    const loaded = loadLayout();
    expect(loaded!.widgets[1].visible).toBe(false);
  });

  it('preserves la taille des widgets', () => {
    saveLayout(MOCK);
    const loaded = loadLayout();
    expect(loaded!.widgets[0].size).toBe('medium');
  });

  it('preserves l\'ordre des widgets', () => {
    saveLayout(MOCK);
    const loaded = loadLayout();
    expect(loaded!.widgets[1].order).toBe(1);
  });
});

describe('widgetLayoutStore — localStorage corruption', () => {
  it('loadLayout retourne null si localStorage contient du JSON invalide', () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', '{invalid}]');
    expect(loadLayout()).toBeNull();
  });

  it('loadLayout retourne null si widgets est absent du JSON', () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', JSON.stringify({ version: '1.0', updatedAt: '2024' }));
    expect(loadLayout()).toBeNull();
  });

  it('loadLayout retourne null si widgets est null', () => {
    localStorage.setItem('sallon-connect-widget-layout-v1', JSON.stringify({ version: '1.0', updatedAt: '2024', widgets: null }));
    expect(loadLayout()).toBeNull();
  });

  it('loadLayout retourne null si cle absente', () => {
    expect(loadLayout()).toBeNull();
  });

  it('saveLayout ne plante pas si ecriture echoue', () => {
    expect(() => saveLayout(MOCK)).not.toThrow();
  });
});

describe('widgetLayoutStore — import/export', () => {
  it('exportLayoutJson produit un JSON valide', () => {
    const json = exportLayoutJson(MOCK);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('importLayoutJson parse un layout valide', () => {
    const json     = exportLayoutJson(MOCK);
    const imported = importLayoutJson(json);
    expect(imported).not.toBeNull();
    expect(imported!.widgets).toHaveLength(2);
  });

  it('importLayoutJson retourne null pour JSON invalide', () => {
    expect(importLayoutJson('invalid json ][')).toBeNull();
  });

  it('importLayoutJson retourne null si widgets absent', () => {
    expect(importLayoutJson('{"version":"1.0","updatedAt":"2024"}')).toBeNull();
  });

  it('round-trip save / export / import', () => {
    saveLayout(MOCK);
    const loaded   = loadLayout()!;
    const json     = exportLayoutJson(loaded);
    const imported = importLayoutJson(json);
    expect(imported!.widgets).toHaveLength(MOCK.widgets.length);
    expect(imported!.widgets[0].widgetId).toBe('system-health');
  });
});
