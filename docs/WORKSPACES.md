# Workspaces locaux

Les workspaces sont des espaces locaux qui separent les usages sans cloud ni compte externe. Ils servent a isoler les preferences et une partie du contexte IA tout en conservant le workspace `default` compatible avec les donnees existantes.

## Stockage

```text
runtime/workspaces/
  profiles.json
  current.json
  <workspaceId>/
    settings.json
    memory/
    rag/
    knowledge/
    workflows/
    agents/
    dashboards/
    search-history/
    plugins.json
    metadata.json
```

Le workspace `default` garde les emplacements historiques pour les donnees critiques deja creees, notamment `runtime/ai-memory/`.

Depuis la Phase 53, les workspaces non-default isolent aussi :

- `rag/`
- `knowledge/`
- `agents/memory.json`
- `agents/runs/`
- `workflows/definitions.json`
- `workflows/runs/`
- `workflows/exports/`

## Utilisation

Interface :

- ouvrir `/workspaces` ;
- creer un profil ;
- renommer ou modifier les settings ;
- activer un workspace ;
- exporter/importer un workspace ;
- supprimer un workspace non courant avec confirmation.

API :

```http
GET    /api/workspaces/status
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/current
POST   /api/workspaces/switch
GET    /api/workspaces/:id
PUT    /api/workspaces/:id
DELETE /api/workspaces/:id
POST   /api/workspaces/:id/export
POST   /api/workspaces/import
```

## Import/export

L'export produit un JSON dans `runtime/workspaces/exports/`. Depuis la version `2.0`, il contient le profil, les settings, memory, RAG, Knowledge Base, agents, workflows, dashboards, command history locale si presente, plugins settings et metadata. Les secrets et chemins personnels sont masques et un checksum SHA-256 est ajoute.

L'import refuse :

- payload sans `profile` ;
- `localOnly=false` ;
- `isDefault=true` ;
- ID invalide ou traversal ;
- version incompatible.

## Securite

- Aucun appel cloud.
- Aucun secret expose.
- Aucun chemin utilisateur expose dans les reponses API.
- Suppression du workspace courant bloquee.
- Suppression du workspace `default` exige `SUPPRIMER_WORKSPACE_DEFAULT`.
- Les commandes rapides ne proposent aucune suppression.

## Integrations

Integre actuellement :

- memoire IA backend ;
- RAG backend ;
- Knowledge Base backend ;
- agents IA runs backend ;
- workflows definitions/runs/exports backend ;
- historique Command Center frontend ;
- layouts dashboard/widgets frontend ;
- affichage du workspace actif dans la TopNav ;
- 3 widgets workspaces.

Les plugins disposent d'un fichier settings par workspace via `workspaceContext`, sans synchronisation cloud.
