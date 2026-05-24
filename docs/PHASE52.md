# Phase 52 - Profils utilisateur locaux et espaces de travail

## Objectif

La Phase 52 ajoute des workspaces locaux pour isoler les profils d'usage, la memoire IA, l'historique Command Center et les layouts dashboard/widgets. Le workspace `default` reste compatible avec les donnees runtime existantes.

## Backend

Module ajoute : `server/src/workspaces/`

- `workspaceTypes.js` : modele, settings, limites et validation.
- `workspaceSafety.js` : validation stricte des IDs, masquage secrets, flags local-only.
- `workspaceStore.js` : profils, workspace courant, creation, edition, switch, suppression protegee.
- `workspaceContext.js` : chemins de contexte par workspace.
- `workspaceExport.js` : export/import JSON local avec masquage.
- `workspaceMigration.js` : initialisation du workspace `default`.

Endpoints :

- `GET /api/workspaces/status`
- `GET /api/workspaces`
- `POST /api/workspaces`
- `GET /api/workspaces/current`
- `POST /api/workspaces/switch`
- `GET /api/workspaces/:id`
- `PUT /api/workspaces/:id`
- `DELETE /api/workspaces/:id`
- `POST /api/workspaces/:id/export`
- `POST /api/workspaces/import`

## Frontend

Composants ajoutes :

- `WorkspacesPanel`
- `WorkspaceSwitcher`
- `WorkspaceCard`
- `WorkspaceEditor`
- `WorkspaceImportExport`
- `WorkspaceSafetyNotice`

La route `/workspaces` expose la gestion complete : liste, creation, edition, switch, export/import et suppression avec confirmation.

## Widgets

Widgets ajoutes et enregistres :

- `workspace-status`
- `workspace-switcher`
- `workspace-summary`

## Integrations

- Memoire IA : `memoryStore` et `memoryExport` utilisent `workspaceContext`. Le workspace `default` conserve `runtime/ai-memory`, les nouveaux workspaces utilisent `runtime/workspaces/<id>/memory/`.
- Command Center : l'historique frontend localStorage est scope par workspace.
- Dashboard/widgets : les layouts localStorage sont scopes par workspace.
- Command Center : commandes `open.workspaces`, `workspace.switch`, `workspace.export`, `workspace.create`. Elles ouvrent le gestionnaire local et ne suppriment rien.

## Securite

- `localOnly=true` force dans les profils, exports et reponses safety.
- IDs limites a `[a-zA-Z0-9_-]`, 40 caracteres maximum, sans traversal ni noms Windows reserves.
- Suppression du workspace courant refusee.
- Suppression du workspace `default` refusee sans confirmation `SUPPRIMER_WORKSPACE_DEFAULT`.
- Export sans secrets ni chemins personnels.
- Import strict : `localOnly=false`, `isDefault=true`, version invalide et ID invalide sont refuses.
- Aucun cloud et aucun chemin sensible retourne par les endpoints.

## Observabilite

Evenements publies via le bus SSE local :

- `workspace.created`
- `workspace.updated`
- `workspace.switched`
- `workspace.exported`
- `workspace.imported`
- `workspace.delete.rejected`
- `workspace.deleted`

## Limites connues

L'abstraction `workspaceContext` expose les chemins pour RAG, knowledge, workflows, agents, dashboards, plugins et search-history. Pour reduire le risque sur les phases 46-51, l'integration runtime complete est limitee a la memoire IA, l'historique Command Center et les layouts widgets. Les autres modules restent compatibles avec leurs stockages actuels et peuvent etre bascules progressivement vers `workspaceContext`.
