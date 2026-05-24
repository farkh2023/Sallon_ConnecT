'use client';

import type { DragEvent } from 'react';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { WidgetRenderer }      from './WidgetRenderer';
import type { WidgetLayoutItem, WidgetManifest, WidgetSize } from '../core/widgetTypes';
import { WIDGET_SIZE_LABELS } from '../core/widgetTypes';

const SIZES: WidgetSize[] = ['small', 'medium', 'large', 'full'];

interface Props {
  layoutItem:   WidgetLayoutItem;
  manifest:     WidgetManifest;
  compact:      boolean;
  isDragOver:   boolean;
  onResize:     (size: WidgetSize) => void;
  onHide:       () => void;
  onDragStart:  () => void;
  onDragOver:   (e: DragEvent) => void;
  onDrop:       (e: DragEvent) => void;
  onDragEnd:    () => void;
}

export function WidgetContainer({
  layoutItem, manifest, compact, isDragOver,
  onResize, onHide,
  onDragStart, onDragOver, onDrop, onDragEnd,
}: Props) {
  return (
    <article
      role="article"
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group flex flex-col overflow-hidden rounded-xl border transition-all ${
        compact ? 'min-h-[120px]' : 'min-h-[160px]'
      } ${
        isDragOver
          ? 'border-sky-400/60 bg-sky-400/5 ring-2 ring-sky-400/20'
          : 'border-white/10 bg-white/[0.04] hover:border-white/20'
      }`}
    >
      {/* Header */}
      <div className="flex cursor-grab items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 active:cursor-grabbing">
        <div className="flex min-w-0 items-center gap-2">
          <span className="select-none text-slate-600" aria-hidden>⠿</span>
          <span className="truncate text-sm font-medium text-slate-300">{manifest.name}</span>
          {manifest.localOnly && (
            <span className="hidden rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-bold text-emerald-400 sm:inline">
              LOCAL
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {SIZES.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onResize(s)}
              aria-label={`Redimensionner ${s}`}
              className={`rounded px-1.5 py-0.5 text-[9px] font-bold transition ${
                layoutItem.size === s
                  ? 'bg-sky-500/30 text-sky-300'
                  : 'text-slate-600 hover:text-slate-300'
              }`}
            >
              {WIDGET_SIZE_LABELS[s]}
            </button>
          ))}
          <button
            type="button"
            onClick={onHide}
            aria-label={`Masquer ${manifest.name}`}
            className="rounded px-1.5 py-0.5 text-[9px] text-slate-600 transition hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-auto ${compact ? 'p-2' : 'p-3'}`}>
        <WidgetErrorBoundary widgetId={manifest.id} widgetName={manifest.name}>
          <WidgetRenderer widgetId={manifest.id} size={layoutItem.size} />
        </WidgetErrorBoundary>
      </div>
    </article>
  );
}
