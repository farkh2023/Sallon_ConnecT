# Base de connaissances locale — Guide

## Architecture

La base de connaissances locale (KB) est un graphe de connaissances stocke exclusivement en local dans `runtime/knowledge/`. Elle fusionne toutes les sources de connaissance du projet.

## Sources indexees

| Source | Type KB |
|---|---|
| Memoire persistante IA | `memory` |
| Chunks RAG | `rag` |
| Runs workflows | `workflow` |
| Runs agents | `agent` |
| Diagnostics systeme | `diagnostic` |
| Plugins actifs | `plugin` |
| Evenements importants | `event` |
| Notes et documentation | `note` |

## Modele KnowledgeItem

```json
{
  "id": "kb_...",
  "type": "memory | rag | workflow | ...",
  "title": "Titre",
  "content": "contenu",
  "sourceId": "identifiant source",
  "tags": ["ia", "workflow"],
  "entities": ["ollama", "agent"],
  "relations": [
    { "targetId": "kb_...", "type": "related-to" }
  ],
  "importance": 1,
  "createdAt": "...",
  "updatedAt": "...",
  "localOnly": true
}
```

## Recherche

### Lexicale (toujours disponible)

- Tokenisation NFD (diacritiques supprimes)
- Score : match exact = 2pts, partiel = 1pt, +0.1*importance
- Filtres : type, source, tag, entite

### Embeddings (optionnel, Ollama requis)

- Active via `SALLON_KNOWLEDGE_EMBEDDINGS_ENABLED=true`
- Fallback automatique vers lexical si Ollama absent

## Graphe de connaissances

Le graphe expose :
- **Noeuds** : chaque KnowledgeItem
- **Liens** : relations entre items (related-to, derived-from, etc.)
- **Entites** : extraites automatiquement du contenu

## Securite

- Stockage local uniquement (`runtime/knowledge/`)
- Secrets masques dans tout export
- Path traversal bloque (IDs alphanumeriques uniquement)
- Effacement protege par confirmation explicite
- Aucune donnee transmise vers l'exterieur

## Endpoints

```
GET  /api/ai/knowledge/status
GET  /api/ai/knowledge[?type=&source=&tag=&entity=]
GET  /api/ai/knowledge/:id
POST /api/ai/knowledge/search  { query, filters?, topK? }
POST /api/ai/knowledge/graph   { filters? }
POST /api/ai/knowledge/summarize { category? }
POST /api/ai/knowledge/reindex
POST /api/ai/knowledge/clear   { confirmation: "EFFACER_KNOWLEDGE_BASE" }
```

## Resumes par categorie

Les resumes sont generes par Ollama si disponible, sinon par extraction des passages les plus importants.

Categories : `project`, `workflows`, `memory`, `diagnostics`, `agents`, `plugins`

## Depannage

| Probleme | Solution |
|---|---|
| KB vide apres reindex | Verifier que `SALLON_KNOWLEDGE_ENABLED=true` |
| Embeddings inactifs | Verifier `SALLON_KNOWLEDGE_EMBEDDINGS_ENABLED=true` et Ollama |
| Effacement refuse | Envoyer `confirmation: "EFFACER_KNOWLEDGE_BASE"` |
| Item non trouve | Verifier l'ID (alphanumerique + tiret + underscore uniquement) |
