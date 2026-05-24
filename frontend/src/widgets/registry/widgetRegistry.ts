import type { ComponentType } from 'react';
import type { WidgetManifest, WidgetProps } from '../core/widgetTypes';

export interface RegistryEntry {
  manifest:  WidgetManifest;
  component: ComponentType<WidgetProps>;
}

const _registry = new Map<string, RegistryEntry>();

export function registerWidget(
  manifest:  WidgetManifest,
  component: ComponentType<WidgetProps>,
): void {
  if (!manifest.id || manifest.localOnly !== true) return;
  _registry.set(manifest.id, { manifest, component });
}

export function getWidget(id: string): RegistryEntry | undefined {
  return _registry.get(id);
}

export function getAllWidgets(): RegistryEntry[] {
  return Array.from(_registry.values());
}

export function getWidgetCount(): number {
  return _registry.size;
}

export function clearRegistry(): void {
  _registry.clear();
}
