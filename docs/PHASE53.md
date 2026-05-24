# Phase 53 - Isolation complete workspace RAG / KB / agents / workflows

## Objectif

La Phase 53 finalise l'isolation locale par workspace pour les donnees IA qui restaient globales apres la Phase 52 : RAG, Knowledge Base, agents, workflows, runs et exports. Le workspace `default` reste compatible avec les chemins legacy.

## Backend

`server/src/workspaces/workspaceContext.js` expose maintenant les helpers suivants :

- `getWorkspaceRuntimePath(workspaceId)`
- `getRagPath(workspaceId)`
- `getKnowledgePath(workspaceId)`
- `getAgentsPath(workspaceId)`
- `getWorkflowsPath(workspaceId)`
- `getWorkflowRunsPath(workspaceId)`
- `getAgentRunsPath(workspaceId)`

Les stores suivants utilisent ces chemins :

- `server/src/ai/rag/ragStore.js`
- `server/src/ai/knowledge/knowledgeStore.js`
- `server/src/ai/agents/agentMemory.js`
- `server/src/ai/workflows/workflowStore.js`

Les routes RAG, Knowledge, Agents, Workflows et Search acceptent `workspaceId` en header `X-Workspace-Id`, query ou body. Si absent, elles utilisent le workspace courant.

## Chemins runtime

Workspaces non-default :

```text
runtime/workspaces/<id>/rag/
runtime/workspaces/<id>/knowledge/
runtime/workspaces/<id>/agents/memory.json
runtime/workspaces/<id>/agents/runs/
runtime/workspaces/<id>/workflows/definitions.json
runtime/workspaces/<id>/workflows/runs/
runtime/workspaces/<id>/workflows/exports/
```

Workspace `default` :

- conserve `runtime/rag/`, `runtime/knowledge/`, `runtime/agents/`, `runtime/workflows/` quand `SALLON_WORKSPACE_LEGACY_FALLBACK=true` ;
- n'effectue aucune migration destructive automatique.

## Export/import complet

L'export workspace version `2.0` inclut :

- memory ;
- rag ;
- knowledge ;
- agents et runs ;
- workflows, runs et definitions ;
- dashboards ;
- command history locale si presente ;
- plugins settings ;
- metadata.

Les exports masquent secrets, tokens, mots de passe, cles API et chemins absolus. Un checksum SHA-256 est ajoute aux metadonnees.

L'import refuse les IDs invalides, `localOnly=false`, `isDefault=true`, les versions incompatibles, les noms de fichiers non surs et les run IDs invalides.

## Observabilite

Evenements ajoutes :

- `workspace.rag.indexed`
- `workspace.knowledge.indexed`
- `workspace.agent.run.created`
- `workspace.workflow.run.created`
- `workspace.migration.completed`
- `workspace.isolation.violation.blocked`

## Tests

Suite ajoutee :

- `tests/backend/workspaceIsolation.test.js`

Elle verifie :

- RAG A/B sans fuite ;
- Knowledge Base A/B sans fuite ;
- agents runs A/B sans fuite ;
- workflows definitions/runs A/B sans fuite ;
- export complet sans donnees du workspace voisin ;
- import complet valide ;
- fallback legacy du workspace `default` ;
- workspaceId invalide et path traversal bloques.

## Limites connues

La command history frontend reste stockee dans `localStorage`, donc elle est scopee et exportee uniquement si des fichiers backend existent dans `search-history/`. Aucun cloud, aucune synchronisation externe et aucune migration destructive automatique ne sont introduits.
