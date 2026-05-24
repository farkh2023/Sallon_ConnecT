# Phase 47 — Agents IA locaux orchestres

## Objectif

Architecture d'agents IA locaux orchestres, capable de travailler ensemble sur des taches internes Sallon-ConnecT, sans cloud, sans execution automatique dangereuse, avec supervision, tracabilite et validation humaine.

## Architecture

```text
server/src/ai/agents/
  agentTypes.js        — manifestes et agents integres (5 agents)
  agentRegistry.js     — registre en memoire, CRUD agents
  agentRunner.js       — execution d'un agent (outils + IA)
  agentOrchestrator.js — orchestration sequentielle multi-agents
  agentMemory.js       — persistance locale runtime/agents/
  agentSafety.js       — allowlist/blocklist outils, validation, masquage
  agentTools.js        — implementations des 9 outils autorises
  agentPrompts.js      — prompts systeme par agent
```

## Agents integres

| Agent | Mission |
|---|---|
| diagnostic-agent | Diagnostics systeme, SSE, service, plugins, widgets |
| security-agent | Risques securite, chemins, permissions plugins |
| backup-agent | Sauvegardes, update, rollback, integrite snapshots |
| docs-agent | Reponses documentation locale via RAG avec citations |
| command-agent | Suggestions de commandes sures (dry-run uniquement) |

## Outils autorises

- diagnostics.read
- rag.search
- rag.ask
- plugins.list
- backups.status
- updates.status
- service.status
- notifications.create
- commands.suggestSafe

## Outils interdits

- shell.execute
- file.delete
- restore.apply
- update.apply
- network.external
- secrets.read

## Securite

- localOnly=true pour tous les agents
- dryRun=true par defaut — aucune action automatique
- Validation humaine obligatoire pour toute action reelle
- Secrets masques dans tous les inputs/outputs
- Context limite a 8000 chars par agent
- Timeout configurable par agent (defaut 45s)
- maxSteps limite (defaut 6)
- Citations obligatoires pour docs-agent
- Logs locaux uniquement

## Endpoints

| Methode | Route | Role |
|---|---|---|
| GET | /api/ai/agents | Liste tous les agents |
| GET | /api/ai/agents/:id | Details d'un agent |
| POST | /api/ai/agents/run | Lance une orchestration |
| GET | /api/ai/agents/runs | Historique des runs |
| GET | /api/ai/agents/runs/:runId | Details d'un run |
| POST | /api/ai/agents/runs/clear | Efface l'historique (confirmation: "EFFACER_RUNS") |

## Format de sortie d'un run

```json
{
  "runId": "abc123",
  "status": "completed",
  "task": "analyser le systeme",
  "agentsUsed": ["diagnostic-agent"],
  "steps": [...],
  "recommendations": [...],
  "citations": [...],
  "rejectedActions": [...],
  "safetySummary": {
    "localOnly": true,
    "dryRun": true,
    "noAutoExecution": true,
    "agentsRun": 1,
    "agentsFailed": 0,
    "rejectedTotal": 0
  },
  "summary": "Synthese finale...",
  "dryRun": true
}
```

## Memoire locale

- `runtime/agents/memory.json` — index des 50 derniers runs
- `runtime/agents/runs/<runId>.json` — details de chaque run

Aucun secret, aucun chemin absolu dans la memoire.

## Variables d'environnement

```env
SALLON_AGENTS_ENABLED=false
SALLON_AGENTS_MAX_STEPS=6
SALLON_AGENTS_TIMEOUT_MS=45000
SALLON_AGENTS_MEMORY_ENABLED=true
SALLON_AGENTS_DRY_RUN_DEFAULT=true
```

## Composants frontend

- AgentsPanel — panneau principal orchestration
- AgentCard — carte selectionnable par agent
- AgentRunForm — formulaire de tache
- AgentRunTimeline — timeline d'execution
- AgentRecommendations — recommandations + citations + rejets
- AgentSafetySummary — synthese de securite

## Widgets

- agents-status — statut des agents actifs
- agent-run — lancement de tache rapide (dry-run)
- agent-recommendations — derniere run et historique

## Evenements observabilite

- agent.run.started
- agent.step.started
- agent.step.completed
- agent.step.failed
- agent.action.rejected
- agent.run.completed
- agent.run.failed

## Limites connues

- Les agents sont dependants de la disponibilite d'Ollama (SALLON_AI_ENABLED=true).
- Si Ollama est indisponible, les agents collectent les donnees mais ne peuvent pas synthetiser par IA.
- Le mode lexical RAG est utilise en fallback si les embeddings ne sont pas disponibles.
- Les agents ne s'executent pas en parallele (sequentiel uniquement).
- maxSteps=6 en production — augmenter avec precaution.

## Exemple d'utilisation

```bash
# Lister les agents
curl http://localhost:3000/api/ai/agents

# Lancer une tache
curl -X POST http://localhost:3000/api/ai/agents/run \
  -H "Content-Type: application/json" \
  -d '{"task":"Analyser l'\''etat du systeme","dryRun":true}'
```
