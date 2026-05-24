import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerWidget, getWidget, getAllWidgets,
  getWidgetCount, clearRegistry,
} from '@/widgets/registry/widgetRegistry';
import type { WidgetManifest, WidgetProps } from '@/widgets/core/widgetTypes';

const BASE: WidgetManifest = {
  id: 'test-widget', name: 'Test Widget', version: '1.0.0',
  description: 'Widget de test.', component: 'TestWidget',
  permissions: [], defaultSize: 'medium', localOnly: true,
  category: 'system', refreshable: false,
};

function Noop(_p: WidgetProps) { return null; }

beforeEach(() => clearRegistry());

describe('widgetRegistry — enregistrement', () => {
  it('enregistre un widget valide', () => {
    registerWidget(BASE, Noop);
    expect(getWidgetCount()).toBe(1);
  });

  it('get retourne le widget enregistre', () => {
    registerWidget(BASE, Noop);
    const entry = getWidget('test-widget');
    expect(entry).toBeDefined();
    expect(entry!.manifest.name).toBe('Test Widget');
  });

  it('get retourne undefined pour un ID inconnu', () => {
    expect(getWidget('unknown')).toBeUndefined();
  });

  it('getAllWidgets retourne tous les widgets', () => {
    registerWidget(BASE, Noop);
    registerWidget({ ...BASE, id: 'widget-2' }, Noop);
    expect(getAllWidgets().length).toBe(2);
  });

  it('rejette localOnly=false', () => {
    registerWidget({ ...BASE, localOnly: false }, Noop);
    expect(getWidget('test-widget')).toBeUndefined();
  });

  it('rejette id vide', () => {
    registerWidget({ ...BASE, id: '' }, Noop);
    expect(getWidget('')).toBeUndefined();
  });

  it('clearRegistry vide le registre', () => {
    registerWidget(BASE, Noop);
    clearRegistry();
    expect(getWidgetCount()).toBe(0);
  });

  it('getWidgetCount retourne 0 apres clear', () => {
    registerWidget(BASE, Noop);
    registerWidget({ ...BASE, id: 'w2' }, Noop);
    clearRegistry();
    expect(getWidgetCount()).toBe(0);
  });
});

describe('widgetRegistry — plugin widget', () => {
  it('un widget plugin (localOnly=true) est accepte', () => {
    const pluginManifest: WidgetManifest = {
      id: 'plugin-widget', name: 'Plugin Widget', version: '1.0.0',
      description: 'Widget fourni par un plugin.', component: 'PluginWidget',
      permissions: ['read:diagnostics'], defaultSize: 'medium',
      localOnly: true, category: 'plugins', refreshable: true,
    };
    registerWidget(pluginManifest, Noop);
    expect(getWidget('plugin-widget')).toBeDefined();
  });

  it('un widget plugin avec localOnly=false est rejete (securite)', () => {
    const unsafeManifest: WidgetManifest = {
      id: 'unsafe-plugin', name: 'Unsafe', version: '1.0.0',
      description: 'Widget non local.', component: 'Unsafe',
      permissions: [], defaultSize: 'medium',
      localOnly: false, category: 'plugins', refreshable: false,
    };
    registerWidget(unsafeManifest, Noop);
    expect(getWidget('unsafe-plugin')).toBeUndefined();
  });
});
