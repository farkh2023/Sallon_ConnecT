# Phase 49 — Mémoire persistante IA et contexte utilisateur local

## Vue d'ensemble

Phase 49 introduit une mémoire persistante IA locale permettant de conserver un contexte utilisateur, des préférences, des résumés, des résultats agents/workflows et des insights diagnostics. Tout est stocké localement dans `runtime/ai-memory/`, sans cloud, avec contrôle utilisateur total.

## Architecture

```
memoryTypes.js     — types, constantes, validation (7 types, 4 scopes, 5 sources)
memorySafety.js    — masquage secrets, sanitisation, getMemorySafety()
memoryStore.js     — CRUD JSON local (memory.json + index.json + metadata.json)
memoryIndexer.js   — tokenisation + scoring pour recherche lexicale
memoryRetriever.js — recherche lexicale + fallback embeddings (Ollama optionnel)
memorySummarizer.js — résumé IA local ou extractif
memoryRetention.js — purge par âge/type/count, items importants protégés
memoryExport.js    — export/import JSON sans secrets
routes/aiMemory.js — 11 endpoints REST avec ordering sécurisé
```

## Modèle MemoryItem

```json
{
  "id": "mem_abc123",
  "type": "preference | fact | summary | workflow-result | agent-result | diagnostic-insight | note",
  "scope": "user | project | system | session",
  "content": "contenu masqué si besoin",
  "tags": ["ai", "workflow"],
  "importance": 1,
  "source": "chat | agent | workflow | manual | diagnostic",
  "createdAt": "2026-05-23T...",
  "updatedAt": "2026-05-23T...",
  "lastAccessedAt": "2026-05-23T...",
  "expiresAt": null,
  "localOnly": true,
  "embeddingHash": null
}
```

## Stockage

```
runtime/ai-memory/
├── memory.json      — tous les items
├── index.json       — index léger (snippets, tags, type, scope)
├── metadata.json    — stats (totalItems, byType, byScope)
└── exports/         — fichiers d'export horodatés
```

## Endpoints REST (11)

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/memory/status` | Statut, safety flags, retention |
| GET | `/api/ai/memory` | Liste avec filtres (type, scope, source, tags) |
| POST | `/api/ai/memory` | Créer un item |
| GET | `/api/ai/memory/:id` | Détail d'un item |
| PUT | `/api/ai/memory/:id` | Modifier un item |
| DELETE | `/api/ai/memory/:id` | Supprimer un item |
| POST | `/api/ai/memory/search` | Recherche lexicale (+ embeddings optionnels) |
| POST | `/api/ai/memory/summarize` | Résumé IA ou extractif |
| POST | `/api/ai/memory/export` | Export JSON local (secrets masqués) |
| POST | `/api/ai/memory/import` | Import JSON validé |
| POST | `/api/ai/memory/clear` | Effacer tout (confirmation "EFFACER_MEMOIRE") |

## Sécurité

- `localOnly: true` sur tout item
- Masquage automatique : Bearer tokens, mots de passe, secrets, chemins personnels
- Validation type/scope/source/importance stricte
- IDs : `[a-zA-Z0-9_-]` uniquement
- Clear : confirmation `"EFFACER_MEMOIRE"` obligatoire
- Export : secrets masqués, `embeddingHash` retiré
- Import validé et sanitisé avant insertion
- Gate `SALLON_AI_MEMORY_ENABLED=false` par défaut
- Payload max 4000 caractères par item

## Recherche

- Lexicale toujours disponible (tokenisation UTF-8, normalisation NFD)
- Embeddings Ollama optionnels (`SALLON_AI_MEMORY_EMBEDDINGS_ENABLED=true`)
- Fallback automatique si Ollama absent
- Score basé sur correspondance exacte (2pts) + partielle (1pt) + importance (0.1×)
- Filtres : type, scope, source, tags

## Rétention

- `purgeExpired()` — supprime les items expirés
- `purgeByAge(days)` — supprime les anciens (items importance ≥ 8 protégés)
- `purgeByType(type)` — supprime tous les items d'un type
- `enforceMaxItems()` — purge les moins importants si max atteint

## Variables d'environnement

```env
SALLON_AI_MEMORY_ENABLED=false
SALLON_AI_MEMORY_MAX_ITEMS=1000
SALLON_AI_MEMORY_MAX_ITEM_CHARS=4000
SALLON_AI_MEMORY_EMBEDDINGS_ENABLED=false
SALLON_AI_MEMORY_RETENTION_DAYS=90
SALLON_AI_MEMORY_INCLUDE_IN_RAG=false
```

## Permissions plugins (3 nouvelles)

- `ai-memory-read` — lecture des items
- `ai-memory-write` — création/modification/suppression
- `ai-memory-search` — recherche dans la mémoire

## Observabilité SSE (9 événements)

`memory.item.created`, `memory.item.updated`, `memory.item.deleted`, `memory.search.completed`, `memory.summary.created`, `memory.export.completed`, `memory.import.completed`, `memory.clear.completed`, `memory.safety.masked`

## Frontend

- `AiMemoryPanel` — 5 onglets : Mémoire, Ajouter, Recherche, Export/Import, Rétention
- `MemoryStatusBadge`, `MemoryList`, `MemoryEditor`, `MemorySearchBox`
- `MemoryImportExport`, `MemoryRetentionSettings`
- `useMemory` hook (8 méthodes)
- 3 widgets : `MemoryStatusWidget`, `MemorySearchWidget`, `MemoryRecentWidget`

## Tests

- `tests/backend/aiMemory.test.js` — 30+ tests backend
- `frontend/src/__tests__/components/AiMemoryPanel.test.tsx` — 9 tests
- `frontend/src/__tests__/widgets/memoryWidgets.test.tsx` — 8 tests
