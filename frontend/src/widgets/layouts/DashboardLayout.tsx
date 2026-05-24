'use client';

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { getAllWidgets }                      from '../registry/widgetRegistry';
import { loadLayout, saveLayout, clearLayout, exportLayoutJson, importLayoutJson } from '../core/widgetLayoutStore';
import { WidgetContainer } from './WidgetContainer';
import { WidgetToolbar }   from './WidgetToolbar';
import type { WidgetLayoutItem, WidgetSize, SavedDashboardLayout } from '../core/widgetTypes';
import { WIDGET_COL_SPAN } from '../core/widgetTypes';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';

interface Props {
  profileId?: string;
}

function buildDefault(): WidgetLayoutItem[] {
  return getAllWidgets().map((e, i) => ({
    widgetId: e.manifest.id,
    size:     e.manifest.defaultSize,
    visible:  true,
    order:    i,
  }));
}

function loadInitialLayout(profileId?: string): WidgetLayoutItem[] {
  const id = profileId || getStoredWorkspaceId();
  const saved = loadLayout(id);
  return saved && saved.widgets.length > 0 ? saved.widgets : buildDefault();
}

export function DashboardLayout({ profileId }: Props) {
  const [layout,  setLayout]  = useState<WidgetLayoutItem[]>(() => loadInitialLayout(profileId));
  const [compact, setCompact] = useState(false);
  const [kiosk,   setKiosk]   = useState(false);
  const [catalog, setCatalog] = useState(false);
  const [dragId,  setDragId]  = useState<string | null>(null);
  const [dropId,  setDropId]  = useState<string | null>(null);
  const [storedWorkspaceId, setStoredWorkspaceId] = useState(getStoredWorkspaceId);
  const workspaceId = profileId || storedWorkspaceId;

  useEffect(() => {
    if (profileId) return;
    const handleWorkspaceChange = () => {
      const next = getStoredWorkspaceId();
      setStoredWorkspaceId(next);
      setLayout(loadInitialLayout(next));
    };
    window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
    window.addEventListener('storage', handleWorkspaceChange);
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
      window.removeEventListener('storage', handleWorkspaceChange);
    };
  }, [profileId]);

  // Charge le layout sauvegardé ou le layout par défaut
  // Sauvegarde à chaque changement
  useEffect(() => {
    if (!layout.length) return;
    const toSave: SavedDashboardLayout = {
      version:   '1.0',
      updatedAt: new Date().toISOString(),
      widgets:   layout,
    };
    saveLayout(toSave, workspaceId);
  }, [layout, workspaceId]);

  const resizeWidget = useCallback((id: string, size: WidgetSize) => {
    setLayout(prev => prev.map(w => w.widgetId === id ? { ...w, size } : w));
  }, []);

  const hideWidget = useCallback((id: string) => {
    setLayout(prev => prev.map(w => w.widgetId === id ? { ...w, visible: false } : w));
  }, []);

  const showWidget = useCallback((id: string) => {
    setLayout(prev => {
      const exists = prev.find(w => w.widgetId === id);
      if (exists) return prev.map(w => w.widgetId === id ? { ...w, visible: true } : w);
      return [...prev, { widgetId: id, size: 'medium', visible: true, order: prev.length }];
    });
  }, []);

  const handleDragStart = useCallback((id: string) => setDragId(id), []);
  const handleDragOver  = useCallback((e: DragEvent, id: string) => {
    e.preventDefault();
    setDropId(id);
  }, []);
  const handleDrop = useCallback((e: DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDropId(null); return; }
    setLayout(prev => {
      const next = [...prev];
      const si   = next.findIndex(w => w.widgetId === dragId);
      const ti   = next.findIndex(w => w.widgetId === targetId);
      if (si === -1 || ti === -1) return prev;
      const tmp  = next[si].order;
      next[si]   = { ...next[si], order: next[ti].order };
      next[ti]   = { ...next[ti], order: tmp };
      return next;
    });
    setDragId(null);
    setDropId(null);
  }, [dragId]);
  const handleDragEnd = useCallback(() => { setDragId(null); setDropId(null); }, []);

  const resetLayout = useCallback(() => {
    clearLayout(workspaceId);
    setLayout(buildDefault());
  }, [workspaceId]);

  const handleExport = useCallback(() => {
    if (typeof window === 'undefined') return;
    const data: SavedDashboardLayout = { version: '1.0', updatedAt: new Date().toISOString(), widgets: layout };
    const blob = new Blob([exportLayoutJson(data)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url; a.download = 'sallon-connect-layout.json'; a.click();
    URL.revokeObjectURL(url);
  }, [layout]);

  const handleImport = useCallback((json: string) => {
    const imported = importLayoutJson(json);
    if (imported) setLayout(imported.widgets);
  }, []);

  const allEntries = getAllWidgets();
  const visible    = [...layout].filter(w => w.visible).sort((a, b) => a.order - b.order);
  const hidden     = layout.filter(w => !w.visible);

  return (
    <div className={kiosk ? 'fixed inset-0 z-50 overflow-auto bg-navy p-4 pt-14' : 'space-y-4'}>
      {kiosk && (
        <button
          type="button"
          onClick={() => setKiosk(false)}
          className="fixed right-4 top-4 z-50 rounded-lg border border-white/20 bg-navy/90 px-3 py-1.5 text-xs font-semibold text-slate-300 backdrop-blur"
        >
          Quitter mode kiosque
        </button>
      )}

      {!kiosk && (
        <WidgetToolbar
          compact={compact} kiosk={kiosk} catalogOpen={catalog}
          onToggleCompact={() => setCompact(c => !c)}
          onToggleKiosk={() => setKiosk(k => !k)}
          onToggleCatalog={() => setCatalog(c => !c)}
          onReset={resetLayout}
          onExport={handleExport}
          onImport={handleImport}
        />
      )}

      {/* Catalogue d'ajout */}
      {catalog && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="mb-3 text-xs font-semibold text-slate-400">Widgets disponibles</p>
          <div className="flex flex-wrap gap-2">
            {allEntries.map(({ manifest }) => {
              const isHidden = hidden.some(h => h.widgetId === manifest.id);
              return (
                <button
                  key={manifest.id}
                  type="button"
                  disabled={!isHidden}
                  onClick={() => { showWidget(manifest.id); setCatalog(false); }}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    isHidden
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : 'border-white/10 text-slate-600'
                  }`}
                >
                  {isHidden ? '+ ' : '✓ '}{manifest.name}
                </button>
              );
            })}
            {allEntries.length === 0 && (
              <p className="text-xs text-slate-600">Aucun widget enregistre.</p>
            )}
          </div>
        </div>
      )}

      {/* Grille widgets */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-sm font-medium text-slate-400">Aucun widget actif</p>
          <p className="mt-1 text-xs text-slate-600">
            Cliquez sur &ldquo;+ Ajouter widget&rdquo; pour composer votre dashboard.
          </p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${compact ? 'gap-2' : 'gap-4'}`}>
          {visible.map(item => {
            const entry = allEntries.find(e => e.manifest.id === item.widgetId);
            if (!entry) return null;
            return (
              <div key={`${workspaceId}:${item.widgetId}`} className={WIDGET_COL_SPAN[item.size]}>
                <WidgetContainer
                  layoutItem={item}
                  manifest={entry.manifest}
                  compact={compact}
                  isDragOver={dropId === item.widgetId}
                  onResize={size => resizeWidget(item.widgetId, size)}
                  onHide={() => hideWidget(item.widgetId)}
                  onDragStart={() => handleDragStart(item.widgetId)}
                  onDragOver={e  => handleDragOver(e, item.widgetId)}
                  onDrop={e      => handleDrop(e, item.widgetId)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
