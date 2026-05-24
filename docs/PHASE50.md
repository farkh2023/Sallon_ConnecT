# Phase 50 — Base de connaissances locale unifiee

## Objectif

Creer une base de connaissances locale fusionnant memoire IA, RAG, workflows, agents, diagnostics, plugins, evenements systeme et documentation dans un graphe de connaissances local consultable.

## Modules backend

| Fichier | Role |
|---|---|
| `knowledgeTypes.js` | Types, constantes, validation |
| `knowledgeSafety.js` | Masquage secrets, flags securite |
| `knowledgeStore.js` | CRUD local (`runtime/knowledge/`) |
| `knowledgeEntities.js` | Extraction entites |
| `knowledgeRelations.js` | Gestion relations entre items |
| `knowledgeGraph.js` | Construction graphe, voisins |
| `knowledgeIndexer.js` | Index lexical multi-sources |
| `knowledgeRetriever.js` | Recherche lexicale + embeddings |
| `knowledgeSummaries.js` | Resumes par categorie via Ollama |

## Endpoints

| Methode | Route | Description |
|---|---|---|
| GET | `/api/ai/knowledge/status` | Statut + meta |
| GET | `/api/ai/knowledge` | Liste items (filtres: type, source, tag, entity) |
| GET | `/api/ai/knowledge/:id` | Detail item |
| POST | `/api/ai/knowledge/search` | Recherche lexicale/embedding |
| POST | `/api/ai/knowledge/graph` | Graphe relations |
| POST | `/api/ai/knowledge/summarize` | Resumes par categorie |
| POST | `/api/ai/knowledge/reindex` | Reindexation |
| POST | `/api/ai/knowledge/clear` | Effacement (confirmation obligatoire) |

## Securite

- `localOnly: true` sur tous les items
- Secrets masques (Bearer, token, password, chemins utilisateur)
- Path traversal bloque (validation ID strict)
- Clear necessite `confirmation: "EFFACER_KNOWLEDGE_BASE"`
- Aucun appel cloud
- Citations sans chemins sensibles

## Types d'items

`memory`, `rag`, `workflow`, `agent`, `diagnostic`, `plugin`, `event`, `note`

## Types de relations

`related-to`, `derived-from`, `referenced-by`, `causes`, `solves`, `extends`, `summarizes`

## Composants frontend

- `KnowledgeBasePanel` — panneau principal (4 onglets)
- `KnowledgeSearchBox` — champ de recherche
- `KnowledgeResultsList` — liste des resultats
- `KnowledgeEntityCard` — carte d'un item
- `KnowledgeFilters` — filtres type/tag/entite
- `KnowledgeGraphView` — vue tabulaire du graphe
- `KnowledgeSummaryPanel` — resumes par categorie

## Widgets

- `KnowledgeStatusWidget` (small) — statut et compteur
- `KnowledgeSearchWidget` (medium) — recherche inline
- `KnowledgeGraphWidget` (medium) — generation graphe

## Configuration

```env
SALLON_KNOWLEDGE_ENABLED=false
SALLON_KNOWLEDGE_EMBEDDINGS_ENABLED=false
SALLON_KNOWLEDGE_MAX_ITEMS=10000
SALLON_KNOWLEDGE_TOP_K=8
```

## Limitations

- Graphe visuel (force-directed) non implemente — vue tabulaire uniquement
- Import/export desactive (futur-ready)
- Embeddings optionnels (Ollama requis)
- Reindexation manuelle uniquement (pas de watch automatique)
