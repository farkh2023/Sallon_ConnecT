'use client';

import { loadWidget } from '../core/widgetLoader';
import type { WidgetSize } from '../core/widgetTypes';

interface Props {
  widgetId: string;
  size:     WidgetSize;
}

export function WidgetRenderer({ widgetId, size }: Props) {
  const loaded = loadWidget(widgetId);

  if (!loaded) {
    return (
      <div className="flex h-full min-h-[60px] items-center justify-center text-xs text-slate-600">
        Widget &ldquo;{widgetId}&rdquo; non enregistre.
      </div>
    );
  }

  const { component: WidgetComponent } = loaded;
  return <WidgetComponent widgetId={widgetId} size={size} />;
}
