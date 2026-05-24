import type { ComponentType } from 'react';
import { getWidget } from '../registry/widgetRegistry';
import type { WidgetManifest, WidgetProps } from './widgetTypes';

export interface LoadedWidget {
  manifest:  WidgetManifest;
  component: ComponentType<WidgetProps>;
}

export function loadWidget(id: string): LoadedWidget | null {
  const entry = getWidget(id);
  if (!entry) return null;
  return { manifest: entry.manifest, component: entry.component };
}
