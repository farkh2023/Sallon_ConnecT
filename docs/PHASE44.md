# Phase 44 — Widgets dynamiques et dashboard modulaire

## Objectif

Ajouter un dashboard React modulaire et personnalisable avec 8 widgets systeme,
drag & drop, persistance localStorage, import/export de layout, mode compact,
mode kiosque, isolation erreurs par widget et support des widgets plugin.

## Architecture

### Systeme de types (`frontend/src/widgets/core/widgetTypes.ts`)

- `WidgetSize` : `small | medium | large | full`
- `WidgetCategory` : `system | backup | network | plugins | notifications | updates`
- `WidgetManifest` : id, name, version, description, component, permissions, defaultSize, localOnly, category, refreshable
- `WidgetProps` : widgetId, size
- `WidgetLayoutItem` : widgetId, size, visible, order
- `SavedDashboardLayout` : version, updatedAt, widgets[]
- `WIDGET_COL_SPAN` : mapping taille → classes CSS responsive

### Registre (`frontend/src/widgets/registry/`)

- `widgetRegistry.ts` : Map module-level, `registerWidget` / `getWidget` / `getAllWidgets` / `getWidgetCount` / `clearRegistry`
- Contrainte : `localOnly: true` obligatoire, id non vide — tout widget non conforme est silencieusement rejete
- `widgetRegistrations.ts` : import avec effet de bord enregistrant les 8 widgets systeme

### Persistance layout (`frontend/src/widgets/core/widgetLayoutStore.ts`)

- Cle localStorage : `sallon-connect-widget-layout-v1`
- Guard SSR : `typeof window !== 'undefined'`
- Fonctions : `saveLayout`, `loadLayout`, `clearLayout`, `exportLayoutJson`, `importLayoutJson`

### Hook donnees (`frontend/src/widgets/core/useWidgetData.ts`)

- Generic `useWidgetData<T>(path)` → `{ data, loading, error, refresh }`
- Pattern `useReducer` pour eviter les appels setState multiples dans un effect
- Guard montage (`useRef`) pour eviter les setState apres demontage

### Composants layout (`frontend/src/widgets/layouts/`)

| Fichier | Role |
|---|---|
| `WidgetErrorBoundary.tsx` | Classe React, isole les crashes de widget (affiche "Erreur widget") |
| `WidgetContainer.tsx` | Conteneur draggable (`role="article"`), boutons S/M/L/XL, bouton Masquer |
| `WidgetRenderer.tsx` | Charge le composant depuis le registre, placeholder si inconnu |
| `WidgetToolbar.tsx` | Barre d'actions : Ajouter, Compact, Kiosque, Exporter, Importer, Reinitialiser |
| `DashboardLayout.tsx` | Composant principal : etat layout, drag & drop, grille responsive 1/2/4 colonnes |
| `DashboardWithWidgets.tsx` | Point d'entree `'use client'` avec import enregistrements |

### 8 widgets systeme (`frontend/src/widgets/examples/`)

| Widget | Endpoint | Taille defaut |
|---|---|---|
| `SystemHealthWidget` | `GET /api/health` | medium |
| `NotificationsWidget` | `GET /api/notifications/stats` | small |
| `PluginsWidget` | `GET /api/plugins/list` | medium |
| `DiagnosticsWidget` | `GET /api/diagnostics/overview` | large |
| `SSEStatusWidget` | `GET /api/events/client-count` | small |
| `BackupStatusWidget` | `GET /api/backups/dashboard` | medium |
| `ServiceStatusWidget` | `GET /api/diagnostics/overview` | medium |
| `UpdatesWidget` | statique (v0.4.0 + commande PS1) | small |

### Route dashboard (`frontend/src/app/dashboard/page.tsx`)

- Route `/dashboard`
- Metadata : `title: "Dashboard — Sallon-ConnecT"`
- Importe `DashboardWithWidgets`

## Fonctionnalites

- **Grille responsive** : 1 colonne mobile, 2 colonnes tablette, 4 colonnes desktop
- **Drag & drop natif** : API HTML5, swap des champs `order`, sans bibliotheque externe
- **Persistance** : layout sauvegarde automatiquement dans localStorage a chaque changement
- **Restauration** : layout recharge au montage depuis localStorage ou buildDefault()
- **Catalogue** : vue des widgets masques avec bouton `+` pour les reafficher
- **Mode compact** : espacement reduit entre widgets
- **Mode kiosque** : plein ecran, bouton "Quitter" en overlay
- **Export** : telechargement `sallon-connect-layout.json`
- **Import** : chargement d'un layout JSON valide
- **Reinitialisation** : suppression localStorage + layout par defaut
- **Isolation erreurs** : chaque widget entoure d'un ErrorBoundary — un crash n'affecte pas les autres

## Securite

- `localOnly: true` obligatoire dans chaque manifeste — rejete silencieusement sinon
- Aucun appel reseau externe depuis les widgets
- Aucun secret, token ou Bearer dans les reponses des endpoints
- Aucun chemin absolu dans les widgets
- Import JSON valide uniquement — JSON invalide retourne null sans crash

## Tests

### Frontend (`pnpm test`) — 33 tests widget

**widgetRegistry.test.ts** (10 tests) :
- Enregistrement, get, getAllWidgets, clearRegistry, getWidgetCount
- Rejet `localOnly=false`, rejet id vide
- Widget plugin (localOnly=true) accepte, (localOnly=false) rejete

**widgetLayout.test.ts** (11 tests) :
- Save/load, null si vide, clearLayout
- Preservation visible/size/order
- exportLayoutJson JSON valide, importLayoutJson valide/invalide/widgets absent
- Round-trip save/export/import

**DashboardLayout.test.tsx** (12 tests) :
- Rendu sans crash avec registre vide
- Affichage "Aucun widget actif"
- Rendu d'un widget enregistre
- Bouton Masquer retire le widget
- Sauvegarde localStorage automatique
- Restauration layout sauvegarde (widget invisible)
- Drag & drop sans crash
- ErrorBoundary isole un widget qui crashe
- Les autres widgets restent visibles si l'un crashe
- Mode compact sans crash
- Widget plugin accepte

## Navigation

Lien "Dashboard" ajoute dans `TopNav.tsx` → `/dashboard`.

## Contraintes respectees

- Pas de cloud, pas de script distant
- Pas de secret dans les widgets ou le layout
- Isolation erreurs obligatoire (ErrorBoundary par widget)
- Responsive obligatoire (grille CSS Grid adaptative)
- Plugins Phase 43 non impactes
- ZIP portable non impacte

*Mis a jour : 2026-05-23*
