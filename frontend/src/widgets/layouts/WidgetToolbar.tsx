'use client';

import { useRef } from 'react';

interface Props {
  compact:       boolean;
  kiosk:         boolean;
  catalogOpen:   boolean;
  onToggleCompact:  () => void;
  onToggleKiosk:    () => void;
  onToggleCatalog:  () => void;
  onReset:          () => void;
  onExport:         () => void;
  onImport:         (json: string) => void;
}

export function WidgetToolbar({
  compact, kiosk, catalogOpen,
  onToggleCompact, onToggleKiosk, onToggleCatalog,
  onReset, onExport, onImport,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') onImport(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleCatalog}
          aria-expanded={catalogOpen}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            catalogOpen
              ? 'border-sky-400/40 bg-sky-400/15 text-sky-300'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          + Ajouter widget
        </button>

        <button
          type="button"
          onClick={onToggleCompact}
          aria-pressed={compact}
          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
            compact
              ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
              : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
          }`}
        >
          Compact
        </button>

        <button
          type="button"
          onClick={onToggleKiosk}
          aria-pressed={kiosk}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
        >
          Mode kiosque
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
        >
          Exporter
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
        >
          Importer
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileChange}
          aria-label="Importer un layout JSON"
        />

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
        >
          Reinitialiser
        </button>
      </div>
    </div>
  );
}
