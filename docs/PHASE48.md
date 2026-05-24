# Phase 48 — Workflows IA visuels et automatisations locales

## Vue d'ensemble

Phase 48 introduit un système de workflows IA séquentiels sous forme de DAG (Directed Acyclic Graph), permettant d'enchaîner des agents, du RAG, des diagnostics, des notifications et des actions locales sécurisées. Tout est dry-run par défaut, local-only, sans cloud.

## Architecture

```
workflowTypes.js     — types, validation, détection de cycles (DFS + Kahn)
workflowSafety.js    — sanitisation, limites, getWorkflowSafety()
workflowTemplates.js — 6 templates built-in
workflowStore.js     — persistance JSON (definitions, runs, exports)
workflowRegistry.js  — CRUD + seed des templates
workflowRunner.js    — exécution séquentielle + 10 événements SSE
workflowScheduler.js — scheduler manuel uniquement par défaut
routes/aiWorkflows.js — 11 endpoints REST
```

## Types de nœuds autorisés (9)

| Type | Description |
|---|---|
| `agent` | Appelle un agent IA local |
| `rag-search` | Recherche dans l'index RAG |
| `rag-ask` | Pose une question au RAG |
| `diagnostic` | Lecture diagnostics système |
| `notification` | Création notification locale |
| `condition` | Branchement conditionnel (dry-run) |
| `delay` | Pause configurable (max 10s) |
| `safe-command-suggestion` | Suggestion de commande sûre |
| `plugin-tool` | Appel outil plugin local |

## Types de nœuds interdits (6)

`shell-execute`, `restore-apply`, `update-apply`, `delete-files`, `network-external`, `secrets-read`

## Templates built-in (6)

1. `diagnostic-review` — Revue diagnostique complète
2. `security-check` — Vérification sécurité
3. `backup-health-check` — Santé des sauvegardes
4. `update-readiness-check` — Prêt pour mise à jour
5. `plugin-audit` — Audit des plugins
6. `documentation-qa` — QA documentation via RAG

## Endpoints REST

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/workflows` | Liste workflows + safety |
| GET | `/api/ai/workflows/templates` | Templates disponibles |
| GET | `/api/ai/workflows/runs` | Historique des runs |
| GET | `/api/ai/workflows/runs/:runId` | Détail d'un run |
| POST | `/api/ai/workflows/runs/clear` | Effacer runs (confirmation requise) |
| GET | `/api/ai/workflows/:id` | Détail workflow |
| POST | `/api/ai/workflows` | Créer workflow |
| PUT | `/api/ai/workflows/:id` | Modifier workflow |
| DELETE | `/api/ai/workflows/:id` | Supprimer (confirmation "SUPPRIMER") |
| POST | `/api/ai/workflows/:id/run` | Lancer un workflow |
| POST | `/api/ai/workflows/import` | Importer JSON |
| GET | `/api/ai/workflows/:id/export` | Exporter JSON |

## Sécurité

- `localOnly: true` et `dryRun: true` obligatoires sur tout workflow
- Validation topologique (cycles interdits, IDs uniques, types allowlistés)
- Payload max 64 KB
- IDs : `[a-zA-Z0-9_-]` uniquement
- Suppression : confirmation `"SUPPRIMER"` obligatoire
- Clear runs : confirmation `"EFFACER_RUNS_WORKFLOWS"` obligatoire
- Tous les outputs passent par `sanitizeWorkflowOutput()`
- Gate `SALLON_WORKFLOWS_ENABLED=false` par défaut

## Variables d'environnement

```env
SALLON_WORKFLOWS_ENABLED=false
SALLON_WORKFLOWS_DRY_RUN_DEFAULT=true
SALLON_WORKFLOWS_MAX_NODES=25
SALLON_WORKFLOWS_MAX_STEPS=30
SALLON_WORKFLOWS_TIMEOUT_MS=120000
SALLON_WORKFLOWS_SCHEDULER_ENABLED=false
```

## Observabilité SSE (10 événements)

`workflow.run.started`, `workflow.node.started`, `workflow.node.completed`, `workflow.node.failed`, `workflow.action.rejected`, `workflow.condition.evaluated`, `workflow.delay.executed`, `workflow.run.completed`, `workflow.run.failed`, `workflow.safety.violation`

## Frontend

- `WorkflowsPanel` — panel complet (4 onglets : Workflows, Templates, Creer, Import/Export)
- `WorkflowList`, `WorkflowTemplatesPanel`, `WorkflowEditor`, `WorkflowImportExport`
- `WorkflowRunPanel`, `WorkflowRunTimeline`, `WorkflowCanvas`, `WorkflowNodeCard`
- `useWorkflows` hook
- 3 widgets : `WorkflowsStatusWidget`, `WorkflowRunWidget`, `WorkflowTemplatesWidget`

## Tests

- `tests/backend/aiWorkflows.test.js` — 30+ tests backend
- `frontend/src/__tests__/components/WorkflowsPanel.test.tsx` — 9 tests
- `frontend/src/__tests__/widgets/workflowWidgets.test.tsx` — 8 tests
