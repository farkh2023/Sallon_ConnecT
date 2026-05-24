# Guide utilisateur — Mémoire persistante IA locale

## Qu'est-ce que la mémoire IA ?

La mémoire persistante IA est un système de stockage local qui retient le contexte utilisateur entre les sessions : préférences, faits utiles, résumés de conversations, résultats agents et insights diagnostics. Tout reste sur votre machine, aucune donnée n'est envoyée vers le cloud.

**Règles fondamentales :**
- Tout item est `localOnly: true` — aucune synchronisation cloud
- Les secrets, tokens et chemins personnels sont automatiquement masqués
- Vous contrôlez entièrement ce qui est stocké, modifié ou supprimé
- La mémoire est désactivable à tout moment via `.env`

## Démarrage rapide

### 1. Activer la mémoire

```env
SALLON_AI_MEMORY_ENABLED=true
```

### 2. Ajouter un item manuellement

Dashboard → **Mémoire IA** → onglet **Ajouter** → choisissez type, scope et contenu → **Ajouter**.

Ou via API :
```bash
curl -X POST http://localhost:3000/api/ai/memory \
  -H "Content-Type: application/json" \
  -d '{"type":"note","scope":"user","content":"Je préfère les résumés courts.","source":"manual"}'
```

### 3. Rechercher dans la mémoire

Onglet **Recherche** → tapez votre requête → **Chercher**.

Ou via API :
```bash
curl -X POST http://localhost:3000/api/ai/memory/search \
  -H "Content-Type: application/json" \
  -d '{"query":"préférence résumé","topK":5}'
```

## Types d'items

| Type | Description |
|---|---|
| `preference` | Préférence utilisateur (format, langue, comportement) |
| `fact` | Fait utile mémorisé (config, contexte projet) |
| `summary` | Résumé d'échange ou de session |
| `workflow-result` | Résultat d'un workflow IA |
| `agent-result` | Résultat d'un agent IA |
| `diagnostic-insight` | Insight issu du diagnostic système |
| `note` | Note manuelle libre |

## Portées (scopes)

| Scope | Description |
|---|---|
| `user` | Concerne l'utilisateur spécifiquement |
| `project` | Lié au projet Sallon-ConnecT |
| `system` | Concerne le système (OS, matériel) |
| `session` | Temporaire, lié à la session courante |

## Importance

Échelle de 0 à 10. Les items avec importance ≥ 8 sont protégés des purges automatiques par âge.

## Recherche

La recherche est lexicale par défaut — tokenisation, normalisation et scoring par correspondance.

Activer les embeddings (requiert Ollama avec `nomic-embed-text`) :
```env
SALLON_AI_MEMORY_EMBEDDINGS_ENABLED=true
SALLON_EMBED_MODEL=nomic-embed-text
```

Filtres disponibles : `type`, `scope`, `source`, `tags`.

## Résumé automatique

Onglet **Recherche** → **Résumer** — génère un résumé de tous les items (ou d'une sélection) via l'IA locale (Ollama) avec fallback extractif si indisponible.

## Export / Import

**Exporter** : onglet **Export/Import** → **Exporter (JSON local)** → fichier créé dans `runtime/ai-memory/exports/`. Les secrets sont masqués dans l'export.

**Importer** : collez votre JSON `{ "items": [...] }` → **Importer**. Les items sont validés et `localOnly` est forcé à `true` avant insertion.

## Rétention

Configurez la durée de rétention dans `.env` :
```env
SALLON_AI_MEMORY_RETENTION_DAYS=90
SALLON_AI_MEMORY_MAX_ITEMS=1000
```

Onglet **Rétention** : vue de l'utilisation, répartition par type et scope.

## Effacer la mémoire

Onglet **Export/Import** → **Effacer toute la mémoire** → deux étapes de confirmation.

Via API :
```bash
curl -X POST http://localhost:3000/api/ai/memory/clear \
  -H "Content-Type: application/json" \
  -d '{"confirmation":"EFFACER_MEMOIRE"}'
```

## Intégration agents / RAG / workflows

- Les agents IA peuvent lire la mémoire avec permission `ai-memory-read`
- Les workflows peuvent écrire un résultat résumé avec permission `ai-memory-write`
- Le RAG peut inclure la mémoire comme source optionnelle (`SALLON_AI_MEMORY_INCLUDE_IN_RAG=true`)

## Limites connues

- Pas d'index vectoriel persistant (embeddings disponibles mais fallback lexical)
- Recherche sémantique limitée sans Ollama
- Max 4000 caractères par item
- Max 1000 items (configurable)
- Pas de chiffrement des fichiers de stockage (données locales uniquement)

## Dépannage

**La mémoire est désactivée** → `SALLON_AI_MEMORY_ENABLED=false` dans `.env` → passer à `true`.

**Item refusé à la création** → Vérifiez type, scope et contenu (non vide, ≤ 4000 chars).

**Recherche sans résultat** → Les tokens doivent correspondre au contenu ou aux tags.

**Export vide** → Aucun item en mémoire — ajoutez des items d'abord.
