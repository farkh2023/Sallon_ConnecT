# Phase 46 — RAG local sécurisé sur documentation et logs

Date : 2026-05-23
Statut : **Fait**

## Objectif

Ajouter un RAG (Retrieval-Augmented Generation) local permettant a l'IA de repondre
a partir de la documentation Sallon-ConnecT, avec citations internes.
Aucun cloud, aucune cle API, index stocke dans `runtime/rag/`.

## Architecture backend (`server/src/ai/rag/`)

| Fichier | Role |
|---|---|
| `ragSafety.js` | Allowlist sources, path traversal, taille fichiers, masquage secrets, citations |
| `ragChunker.js` | Decoupage Markdown par titres H1-H6, overlap configurable |
| `ragEmbeddings.js` | Embeddings Ollama (`/api/embeddings`) + fallback score lexical |
| `ragStore.js` | Lecture/ecriture `runtime/rag/{index,chunks,metadata}.json` |
| `ragCitations.js` | Formatage citations, construction bloc contexte pour le prompt |
| `ragRetriever.js` | Retrieval vectoriel ou lexical, tri par score, top-K |
| `ragIndexer.js` | Orchestrateur : collecte fichiers, chunking, embeddings, sauvegarde |

## Endpoints (`/api/ai/rag`)

| Methode | Chemin | Description |
|---|---|---|
| GET | `/api/ai/rag/status` | Etat index, sources, chunks, mode, flags securite |
| POST | `/api/ai/rag/index` | Reindexation manuelle (docs/ + README/CHANGELOG/ROADMAP) |
| POST | `/api/ai/rag/search` | Recherche dans l'index, retourne citations avec scores |
| POST | `/api/ai/rag/ask` | Question + contexte documentaire → reponse IA + citations |
| POST | `/api/ai/rag/clear` | Suppression index (confirmation `EFFACER_INDEX` obligatoire) |

## Sources indexables

Autorisees par allowlist stricte :
- `docs/**/*.md`
- `README.md`
- `CHANGELOG.md`
- `ROADMAP.md`

Exclues systematiquement :
- `.env`, `.env.local`
- `node_modules/`, `.next/`, `runtime/`, `backups/`, `dist/`, `logs/`, `.git/`
- Extensions binaires (`.exe`, `.dll`, `.zip`, `.png`, `.pdf`, etc.)
- Certificats (`.pem`, `.key`, `.p12`, `.crt`, `.pfx`)
- Path traversal (`..`) et chemins absolus

## Chunking

- Decoupage par titres Markdown (H1-H6)
- `SALLON_RAG_CHUNK_SIZE` (defaut : 1200 chars)
- `SALLON_RAG_CHUNK_OVERLAP` (defaut : 150 chars)
- Metadonnees par chunk : id, source, heading, lineStart, lineEnd, hash, indexedAt

## Embeddings

- Modele Ollama configurable : `SALLON_RAG_EMBEDDING_MODEL=nomic-embed-text`
- Endpoint : `POST /api/embeddings` (localhost uniquement)
- Fallback lexical automatique si Ollama/modele indisponibles
- Mode rapporte dans `/api/ai/rag/status` : `embedding` ou `lexical`

## Stockage index

`runtime/rag/index.json`, `runtime/rag/chunks.json`, `runtime/rag/metadata.json`
(exclu de Git, des backups, et du ZIP portable)

## Securite RAG

- URL Ollama validee (localhost uniquement)
- Questions tronquees a 2000 chars, secrets masques avant envoi
- Citations sans chemins absolus (`maskCitationPath`)
- Clear avec confirmation `"EFFACER_INDEX"` obligatoire
- Fichiers > `SALLON_RAG_MAX_FILE_SIZE_MB` (defaut 2 Mo) refuses
- Events systemEventBus : `rag.index.started/completed/failed`, `rag.search.completed`, `rag.ask.completed`, `rag.clear.completed`

## Frontend

### Composants (`src/components/ai/`)

| Composant | Role |
|---|---|
| `RagStatusBadge` | Badge visuel : non indexe / nb chunks / mode |
| `RagCitationsList` | Liste citations avec source, heading, extrait, score |
| `RagSearchBox` | Recherche documentaire libre |
| `RagAskBox` | Question avec textarea, reponse + citations |
| `RagPanel` | Panneau complet : statut, indexer, onglets Ask/Search, sources |

### Widgets dashboard (`src/widgets/examples/`)

| Widget | ID | Taille par defaut |
|---|---|---|
| `RagStatusWidget` | `rag-status` | small |
| `RagAskWidget` | `rag-ask` | medium |
| `RagSourcesWidget` | `rag-sources` | medium |

Tous `localOnly: true`.

### Integration AiAssistantPanel

Bouton bascule "Documentation locale (RAG)" ouvre/ferme le `RagPanel` inline.

### Hook `useRag`

Methodes : `loadStatus`, `indexDocs`, `search`, `ask`, `clearIndex`, `clearResults`.
Etats : `status`, `searchResult`, `askResult`, `loading`, `error`.

## Variables d'environnement

```
SALLON_RAG_ENABLED=false
SALLON_RAG_EMBEDDING_MODEL=nomic-embed-text
SALLON_RAG_CHUNK_SIZE=1200
SALLON_RAG_CHUNK_OVERLAP=150
SALLON_RAG_MAX_FILE_SIZE_MB=2
SALLON_RAG_TOP_K=5
```

## Tests

### Backend (`tests/backend/aiRag.test.js`)

57 tests couvrant :
- 5 endpoints (status, index, search, ask, clear)
- `ragSafety` : allowlist, path traversal, taille fichier, sanitizeQuestion, maskCitationPath
- `ragChunker` : chunks, headings, chunk vide
- `ragCitations` : format, chemin absolu masque, buildContextBlock
- `ragEmbeddings` : lexicalScore, cosineSimilarity

### Frontend

- `frontend/src/__tests__/components/RagPanel.test.tsx` : 11 tests (etat vide, indexe, chargement, erreur, accessibilite)
- `frontend/src/__tests__/widgets/ragWidgets.test.tsx` : 14 tests (3 widgets, registre)

## Validations

| Etape | Resultat |
|---|---|
| `pnpm lint` | 0 erreur, 0 warning |
| `pnpm test` | 345 tests passes |
| `pnpm build` | Build statique propre |
| `npm run test:backend` | 345 tests passes |
| `pnpm test:windows` | 45 scripts PS1 valides |
| `pnpm release:build` | ZIP 0.88 MB, SHA256 verifie |

## Limites connues

- Embeddings vectoriels necessitent `ollama pull nomic-embed-text` (~270 Mo)
- Fallback lexical moins precis que le vectoriel pour des questions semantiques
- Index non mis a jour automatiquement apres modification de la documentation
- La recherche lexicale necessite des termes exacts presents dans les chunks
