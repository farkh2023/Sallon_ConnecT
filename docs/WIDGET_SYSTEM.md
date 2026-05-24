# Systeme de widgets — Sallon-ConnecT

Documentation du systeme de widgets dynamiques introduit en Phase 44 et stabilise en Phase 44B.

## Architecture

```
frontend/src/widgets/
├── core/
│   ├── widgetTypes.ts         Types, constantes CSS (WIDGET_COL_SPAN, WIDGET_SIZE_LABELS)
│   ├── widgetLayoutStore.ts   Persistance localStorage (save/load/clear/export/import)
│   └── useWidgetData.ts       Hook generique de donnees (useReducer, guard montage)
├── registry/
│   ├── widgetRegistry.ts      Map module-level, validation localOnly + id
│   └── widgetRegistrations.ts Import effet-de-bord enregistrant les 8 widgets systeme
├── layouts/
│   ├── DashboardLayout.tsx    Composant principal (drag & drop, persistance, grille)
│   ├── DashboardWithWidgets.tsx Point entree 'use client' + import registrations
│   ├── WidgetContainer.tsx    Conteneur draggable, boutons taille/masquer, badge LOCAL
│   ├── WidgetErrorBoundary.tsx Classe React isole crashes widget
│   ├── WidgetRenderer.tsx     Charge composant depuis registre
│   └── WidgetToolbar.tsx      Barre actions : Ajouter, Compact, Kiosque, Export, Import, Reset
└── examples/
    ├── SystemHealthWidget.tsx
    ├── NotificationsWidget.tsx
    ├── PluginsWidget.tsx
    ├── DiagnosticsWidget.tsx
    ├── SSEStatusWidget.tsx
    ├── BackupStatusWidget.tsx
    ├── ServiceStatusWidget.tsx
    └── UpdatesWidget.tsx
```

## Tailles disponibles

| Code   | Label | Colonnes (4 col layout) |
|--------|-------|------------------------|
| small  | S     | 1 colonne (sm+) |
| medium | M     | 2 colonnes (lg+) |
| large  | L     | 3 colonnes (lg+) |
| full   | XL    | 4 colonnes (pleine largeur) |

La grille est `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.

## Registre

```typescript
// Enregistrer un widget
registerWidget(manifest, ComponentFunction);

// Contraintes d'enregistrement
// - manifest.localOnly doit etre true (securite)
// - manifest.id ne doit pas etre vide
// - Tout widget non conforme est silencieusement ignore
```

### Manifeste minimal

```typescript
const manifest: WidgetManifest = {
  id:          'mon-widget',        // unique, alphanum + _ - .
  name:        'Mon Widget',
  version:     '1.0.0',
  description: 'Description courte.',
  component:   'MonWidget',
  permissions: [],                  // ou ['read:diagnostics', ...]
  defaultSize: 'medium',
  localOnly:   true,                // obligatoire
  category:    'system',
  refreshable: false,
};
```

### Permissions autorisees

- `read:diagnostics`
- `read:backups`
- `read:notifications`
- `read:scheduler`

## Persistance layout

- Cle localStorage : `sallon-connect-widget-layout-v1`
- Guard SSR : `typeof window !== 'undefined'`
- Resilience corruption : tout JSON invalide ou `widgets` absent → `null` (fallback buildDefault)
- Schema :

```json
{
  "version": "1.0",
  "updatedAt": "2026-05-23T06:00:00.000Z",
  "widgets": [
    { "widgetId": "system-health", "size": "medium", "visible": true, "order": 0 }
  ]
}
```

## Ecrire un widget

```typescript
'use client';
import { useWidgetData } from '../core/useWidgetData';
import type { WidgetProps } from '../core/widgetTypes';

interface MyData { value: number }

export function MonWidget({ size }: WidgetProps) {
  const { data, loading, error, refresh } = useWidgetData<MyData>('/api/mon-endpoint');
  const compact = size === 'small';

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">Mon widget</span>
        <button
          type="button"
          onClick={() => void refresh()}
          aria-label="Actualiser mon widget"
          className="text-[10px] text-slate-600 hover:text-slate-400"
        >
          ↻
        </button>
      </div>
      {loading && <p className="text-xs text-slate-500">Chargement...</p>}
      {error   && <p className="text-xs text-red-400 truncate" role="alert">{error}</p>}
      {!loading && !error && !data && <p className="text-xs text-slate-600">Aucune donnee.</p>}
      {data && (
        <p className={`font-bold ${compact ? 'text-lg' : 'text-2xl'}`}>{data.value}</p>
      )}
    </div>
  );
}
```

Puis enregistrer dans `widgetRegistrations.ts` :

```typescript
import { MonWidget }  from '../examples/MonWidget';
import { monManifest } from '../examples/MonWidget';
registerWidget(monManifest, MonWidget);
```

## Isolation erreurs

Chaque widget est entoure d'un `WidgetErrorBoundary` (classe React). Si le composant lance une exception :
- Un message "Erreur widget" s'affiche a la place
- Les autres widgets restent intacts
- Aucun crash global

## Accessibilite

- Boutons Masquer : `aria-label="Masquer {nom}"` (spec.)
- Boutons Taille : `aria-label="Redimensionner {s}"` (spec.)
- Boutons Refresh : `aria-label="Actualiser {widget}"` (spec.)
- Zone drag : `role="article"` + `draggable`
- Badge LOCAL : `hidden sm:inline` (masque mobile, visible desktop)
- Erreur widget : `role="alert"` sur les messages d'erreur

## Contraintes de securite

- `localOnly: true` obligatoire dans tout manifeste
- Aucun appel reseau externe depuis les widgets
- Aucun secret, token ou Bearer dans les reponses
- Aucun chemin absolu (C:\\Users\\...) dans les widgets
- Import JSON : valide uniquement (JSON invalide → null sans crash)

## Tests

```bash
pnpm test src/__tests__/widgets/
```

| Fichier | Tests |
|---------|-------|
| widgetRegistry.test.ts   | 10 tests (register, get, reject, clear) |
| widgetLayout.test.ts     | 16 tests (save/load, corruption, export/import) |
| DashboardLayout.test.tsx | 21 tests (rendu, masquer, drag, erreur, reset, a11y) |

*Mis a jour : 2026-05-23 (Phase 44B)*
