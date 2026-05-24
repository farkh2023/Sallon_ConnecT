# Phase 51 — Recherche globale intelligente + Command Center

## Objectif

Creer une recherche globale intelligente et un Command Center permettant de rechercher, naviguer et lancer des actions sures dans toute la plateforme Sallon-ConnecT via une interface unifiee.

## Architecture backend

| Fichier | Role |
|---|---|
| `globalSearchTypes.js` | Types, constantes, validation query |
| `globalSearchSafety.js` | Masquage secrets, blocklist actions, flags securite |
| `globalSearchIndexer.js` | Index global multi-sources (commandes, knowledge, memoire) |
| `globalSearchRetriever.js` | Recherche lexicale + suggestions Ollama optionnelles |
| `commandRegistry.js` | 15 commandes rapides sures |
| `commandCenter.js` | Preview et execution commandes (safe only) |

## Endpoints

| Methode | Route | Description |
|---|---|---|
| GET | `/api/search/status` | Statut, compteurs, safety flags |
| GET | `/api/search/commands` | Liste toutes les commandes |
| POST | `/api/search` | Recherche globale |
| POST | `/api/search/commands/:id/preview` | Apercu d'une commande |
| POST | `/api/search/commands/:id/run` | Execution commande sure |

## Commandes disponibles

| ID | Categorie | Description |
|---|---|---|
| open.dashboard | navigation | Ouvrir le dashboard |
| open.plugins | navigation | Ouvrir les plugins |
| open.workflows | navigation | Ouvrir les workflows IA |
| open.agents | navigation | Ouvrir les agents IA |
| open.memory | navigation | Ouvrir la memoire IA |
| open.knowledge | navigation | Ouvrir la base de connaissances |
| open.rag | navigation | Ouvrir le RAG local |
| open.diagnostics | navigation | Ouvrir les diagnostics |
| open.backups | navigation | Ouvrir les sauvegardes |
| open.updates | navigation | Ouvrir les mises a jour |
| run.diagnostics.dry | action | Diagnostics en dry-run |
| run.workflow.dry | action | Workflow en simulation |
| search.knowledge | search | Rechercher dans la KB |
| search.memory | search | Rechercher dans la memoire |
| copy.command | utility | Copier dans presse-papiers |

## Securite

- `localOnly: true` sur tous les resultats
- Actions bloquees : `shell.execute`, `restore.apply`, `update.apply`, `delete`, `network.external`, `secrets.read`
- Validation stricte des IDs commandes (alphanumerique + `.` + `-` uniquement)
- Path traversal bloque
- Secrets masques dans toutes les reponses
- Historique local uniquement (localStorage)
- Aucun cloud

## Frontend

- `CommandCenterModal` — modal principal avec Ctrl+K, debounce, navigation clavier
- `GlobalSearchBox` — champ de recherche unifie
- `SearchResultsList` — resultats groupes par type avec selection clavier
- `CommandPreviewPanel` — apercu et execution commande
- `RecentSearches` — historique local avec effacement confirme
- `SavedCommands` — raccourcis vers commandes rapides

## Widgets

- `GlobalSearchWidget` (medium) — recherche inline
- `CommandCenterWidget` (small) — bouton Ctrl+K + modal
- `RecentSearchesWidget` (small) — historique localStorage

## Raccourcis clavier

| Raccourci | Action |
|---|---|
| Ctrl+K | Ouvrir/fermer Command Center |
| Echap | Fermer le modal |
| ↑ ↓ | Naviguer dans les resultats |
| Entree | Selectionner le resultat en surbrillance |

## Limitations

- Debounce 300ms (configurable)
- Index rechargement manuel (pas de watch automatique)
- Suggestions Ollama optionnelles et best-effort (timeout 5s)
- Graphe force-directed non implemente — navigation lineaire uniquement
