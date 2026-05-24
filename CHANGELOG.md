# Changelog

Toutes les modifications notables de ce projet sont documentees ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) — versionnement [SemVer](https://semver.org/).

---

## [Unreleased] — 2026-05-24

### Phase 53 - Isolation complete workspace RAG / KB / agents / workflows

#### Backend
- `workspaceContext` expose les helpers runtime RAG, Knowledge, agents, workflows, agent runs et workflow runs.
- Stores RAG, Knowledge Base, agents et workflows migres vers `runtime/workspaces/<id>/...` avec fallback legacy pour `default`.
- Routes RAG, Knowledge, Agents, Workflows et Search acceptent `X-Workspace-Id`, query/body `workspaceId` et renvoient `workspaceId`.
- Export workspace `2.0` complet : memory, rag, knowledge, agents, workflows, dashboards, command history, plugins settings, metadata et checksum SHA-256.
- Migration legacy non destructive avec rapport et `SALLON_WORKSPACE_MIGRATION_AUTO=false` par defaut.
- Evenements ajoutes : `workspace.rag.indexed`, `workspace.knowledge.indexed`, `workspace.agent.run.created`, `workspace.workflow.run.created`, `workspace.migration.completed`, `workspace.isolation.violation.blocked`.

#### Frontend
- Les appels API envoient le workspace actif via `X-Workspace-Id`.
- Hooks RAG, Knowledge, Agents, Workflows et Memory rafraichissent leurs donnees apres switch workspace.
- Dashboard widgets remonte les widgets au changement de workspace pour eviter les caches croises.

#### Tests et docs
- Suite backend anti-fuite `workspaceIsolation.test.js`.
- Test frontend workspace-aware hooks.
- Documentation : `docs/PHASE53.md`, `docs/WORKSPACE_ISOLATION.md`.
- `.env.example` : `SALLON_WORKSPACE_ISOLATION_STRICT`, `SALLON_WORKSPACE_LEGACY_FALLBACK`, `SALLON_WORKSPACE_MIGRATION_AUTO`.

### Phase 52 — Profils utilisateur locaux et espaces de travail

#### Backend
- Nouveau module `server/src/workspaces/` : types, safety, store, context, export/import, migration.
- 10 endpoints `/api/workspaces` : status, list, create, current, switch, get, update, delete, export, import.
- Validation stricte des IDs, blocage traversal, noms Windows reserves refuses.
- Suppression du workspace courant refusee ; suppression `default` protegee par `SUPPRIMER_WORKSPACE_DEFAULT`.
- Export/import JSON local avec masquage secrets et refus de `localOnly=false`.
- `workspaceContext` expose memory, rag, knowledge, workflows, agents, dashboards, plugins et search-history.
- Memoire IA backend raccordee au workspace courant, avec compatibilite `default` sur `runtime/ai-memory/`.

#### Frontend
- Route `/workspaces`.
- Hook `useWorkspaces`.
- Composants : WorkspacesPanel, WorkspaceSwitcher, WorkspaceCard, WorkspaceEditor, WorkspaceImportExport, WorkspaceSafetyNotice.
- TopNav : affichage du workspace actif et lien Workspaces.
- Historique Command Center et layouts widgets scopes par workspace via localStorage.

#### Widgets et Command Center
- 3 widgets : WorkspaceStatusWidget, WorkspaceSwitcherWidget, WorkspaceSummaryWidget.
- Commandes : `open.workspaces`, `workspace.switch`, `workspace.export`, `workspace.create`.
- Aucune suppression via commande rapide.

#### Tests et docs
- Backend : tests `workspaces.test.js` sur endpoints reels, protections delete, export sans secret, import invalide et paths safe.
- Frontend : tests WorkspacesPanel, WorkspaceSwitcher et widgets workspaces.
- Documentation : `docs/PHASE52.md`, `docs/WORKSPACES.md`.
- `.env.example` : `SALLON_WORKSPACES_ENABLED`, `SALLON_DEFAULT_WORKSPACE`, `SALLON_WORKSPACE_MAX_COUNT`.

### Phase 51 — Recherche globale intelligente + Command Center

#### Backend
- Module `server/src/search/` : 6 fichiers (globalSearchTypes, globalSearchSafety, globalSearchIndexer, globalSearchRetriever, commandRegistry, commandCenter).
- 5 endpoints `/api/search` : status, commands, search, preview, run.
- 15 commandes sures : 10 navigation, 2 action dry-run, 2 search, 1 utility.
- 6 actions bloquees : shell.execute, restore.apply, update.apply, delete, network.external, secrets.read.
- Recherche lexicale multi-sources (commands, knowledge, memory) avec tokenisation NFD.
- Suggestions Ollama optionnelles avec timeout 5s et fallback.
- Path traversal bloque, secrets masques, localOnly:true.
- 7 evenements SSE (search.started/completed/failed, command.previewed/executed/rejected, history.cleared).

#### Frontend
- Hook useGlobalSearch : results, groups, commands, history, 7 methodes.
- Composants : CommandCenterModal (Ctrl+K + nav clavier), GlobalSearchBox, SearchResultsList (groupes), CommandPreviewPanel, RecentSearches (localStorage), SavedCommands.
- 3 widgets : GlobalSearchWidget, CommandCenterWidget, RecentSearchesWidget.
- Types Phase 51 ajoutes dans types.ts (SearchResult, SearchCommand, SearchResponse, etc.).

#### Tests
- Backend : 12+ tests dans tests/backend/globalSearch.test.js.
- Frontend : 10 tests CommandCenterModal + 7 tests searchWidgets.

#### Documentation
- docs/PHASE51.md et docs/COMMAND_CENTER.md ajoutes.
- .env.example : section Phase 51 avec 4 variables search.

### Phase 50 — Base de connaissances locale unifiee

#### Backend
- Module `server/src/ai/knowledge/` : 9 fichiers (knowledgeTypes, knowledgeSafety, knowledgeStore, knowledgeEntities, knowledgeRelations, knowledgeGraph, knowledgeIndexer, knowledgeRetriever, knowledgeSummaries).
- 8 endpoints `/api/ai/knowledge` : status, list, get, search, graph, summarize, reindex, clear.
- 8 types d'items : memory, rag, workflow, agent, diagnostic, plugin, event, note.
- 7 types de relations : related-to, derived-from, referenced-by, causes, solves, extends, summarizes.
- Recherche lexicale (tokenisation NFD, scoring, citations) + embeddings Ollama optionnel avec fallback.
- Graphe de connaissances : noeuds, liens, auto-liaison par entites.
- Resumes par categorie via Ollama avec fallback extractif.
- Extraction automatique d'entites depuis contenu/titre.
- Stockage local runtime/knowledge/ (items.json + metadata.json).
- Clear exige confirmation "EFFACER_KNOWLEDGE_BASE".
- Path traversal bloque, secrets masques, localOnly=true obligatoire.
- Gate SALLON_KNOWLEDGE_ENABLED=false par defaut.
- 7 evenements SSE (knowledge.index.started/completed, search, graph, summary, clear, entity.linked).

#### Frontend
- Hook useKnowledge : items, meta, safety, loading, error, enabled, 7 methodes.
- Composants : KnowledgeBasePanel (4 onglets), KnowledgeSearchBox, KnowledgeResultsList, KnowledgeEntityCard, KnowledgeFilters, KnowledgeGraphView, KnowledgeSummaryPanel.
- 3 widgets dashboard : KnowledgeStatusWidget, KnowledgeSearchWidget, KnowledgeGraphWidget.
- Types Phase 50 ajoutes dans types.ts (KnowledgeItem, KnowledgeRelation, KnowledgeGraphResponse, etc.).

#### Tests
- Backend : 15+ tests dans tests/backend/aiKnowledge.test.js.
- Frontend : 12 tests KnowledgeBasePanel + 8 tests knowledgeWidgets.

#### Documentation
- docs/PHASE50.md et docs/KNOWLEDGE_BASE.md ajoutes.
- .env.example : section Phase 50 avec 4 variables knowledge.

### Phase 49 — Mémoire persistante IA et contexte utilisateur local

#### Backend
- Module `server/src/ai/memory/` : 8 fichiers (memoryTypes, memorySafety, memoryStore, memoryIndexer, memoryRetriever, memorySummarizer, memoryRetention, memoryExport).
- 11 endpoints `/api/ai/memory` : status, list, create, get, update, delete, search, summarize, export, import, clear.
- 7 types d'items : preference, fact, summary, workflow-result, agent-result, diagnostic-insight, note.
- Recherche lexicale (tokenisation NFD, scoring, filtres) + fallback embeddings Ollama optionnel.
- Rétention : purge par âge/type/count, items importance >= 8 protégés.
- Export/import JSON avec masquage secrets.
- Stockage : runtime/ai-memory/ (memory.json + index.json + metadata.json + exports/).
- Clear exige confirmation "EFFACER_MEMOIRE".
- Gate SALLON_AI_MEMORY_ENABLED=false par defaut.
- 9 evenements SSE (memory.item.created/updated/deleted, search/summary/export/import/clear/safety).

#### Frontend
- Hook useMemory : items, meta, safety, loading, error, enabled, 8 methodes.
- Composants : AiMemoryPanel (5 onglets), MemoryStatusBadge, MemoryList, MemoryEditor, MemorySearchBox, MemoryImportExport, MemoryRetentionSettings.
- 3 widgets dashboard : MemoryStatusWidget, MemorySearchWidget, MemoryRecentWidget (tous localOnly=true).
- Types Phase 49 ajoutes dans types.ts.
- 3 nouvelles permissions plugins : ai-memory-read, ai-memory-write, ai-memory-search.

#### Tests
- Backend : 30+ tests dans tests/backend/aiMemory.test.js.
- Frontend : 9 tests AiMemoryPanel + 8 tests memoryWidgets.

#### Documentation
- docs/PHASE49.md et docs/AI_MEMORY.md ajoutes.
- .env.example : section Phase 49 avec 6 variables memoire.

### Phase 48 — Workflows IA visuels et automatisations locales

#### Backend
- Module `server/src/ai/workflows/` : 7 fichiers (workflowTypes, workflowSafety, workflowTemplates, workflowStore, workflowRegistry, workflowRunner, workflowScheduler).
- 11 endpoints `/api/ai/workflows` : list, templates, runs, run detail, clear, get, create, update, delete, run, import, export.
- 9 types de noeuds autorises, 6 interdits (shell-execute, restore-apply, delete-files, etc.).
- 6 templates integres : diagnostic-review, security-check, backup-health-check, update-readiness-check, plugin-audit, documentation-qa.
- Validation DAG : detection de cycles (DFS) + tri topologique (Kahn).
- Persistance locale runtime/workflows/ (definitions.json + runs/ + exports/).
- Suppression requiert confirmation "SUPPRIMER", clear runs requiert "EFFACER_RUNS_WORKFLOWS".
- dryRun=true force sur tous les runs, localOnly=true obligatoire.
- 10 evenements SSE (workflow.run.started/completed/failed, workflow.node.*, workflow.action.rejected).
- Gate SALLON_WORKFLOWS_ENABLED=false par defaut.

#### Frontend
- Hook useWorkflows : workflows, templates, runs, runResult, loading, error, 8 methodes.
- Composants : WorkflowsPanel (4 onglets), WorkflowList, WorkflowTemplatesPanel, WorkflowEditor, WorkflowImportExport, WorkflowRunPanel, WorkflowRunTimeline, WorkflowCanvas, WorkflowNodeCard.
- 3 widgets dashboard : WorkflowsStatusWidget, WorkflowRunWidget, WorkflowTemplatesWidget (tous localOnly=true).
- Types Phase 48 ajoutes dans types.ts.

#### Tests
- Backend : 30+ tests dans tests/backend/aiWorkflows.test.js.
- Frontend : 9 tests WorkflowsPanel + 8 tests workflowWidgets.

#### Documentation
- docs/PHASE48.md et docs/LOCAL_WORKFLOWS.md ajoutes.
- .env.example : section Phase 48 avec 6 variables workflows.

### Phase 47 — Agents IA locaux orchestres

#### Backend
- Module `server/src/ai/agents/` : 8 fichiers (agentTypes, agentRegistry, agentRunner, agentOrchestrator, agentMemory, agentSafety, agentTools, agentPrompts).
- 6 nouveaux endpoints `/api/ai/agents` : list, get by id, run, runs list, run detail, clear runs.
- 5 agents integres : diagnostic-agent, security-agent, backup-agent, docs-agent, command-agent.
- 9 outils autorises en lecture seule (diagnostics, rag, plugins, backups, updates, service, notifications, commands).
- 6 outils interdits : shell.execute, file.delete, restore.apply, update.apply, network.external, secrets.read.
- Orchestration sequentielle avec passage de contexte entre agents.
- Memoire locale dans runtime/agents/ (memory.json + runs/<runId>.json).
- dryRun=true par defaut, validation humaine obligatoire pour toute action.
- 7 evenements systemEventBus : agent.run.started/completed/failed, agent.step.started/completed/failed, agent.action.rejected.

#### Frontend
- Hook useAgents : agents, runs, runResult, loading, error, 4 methodes.
- Composants : AgentsPanel, AgentCard, AgentRunForm, AgentRunTimeline, AgentRecommendations, AgentSafetySummary.
- 3 widgets dashboard : AgentsStatusWidget, AgentRunWidget, AgentRecommendationsWidget (tous localOnly=true).
- Types Phase 47 ajoutes dans types.ts.

#### Tests
- Backend : 27 tests dans tests/backend/aiAgents.test.js.
- Frontend : 10 tests AgentsPanel + 8 tests agentWidgets.

#### Documentation
- docs/PHASE47.md et docs/LOCAL_AGENTS.md ajoutes.
- .env.example : section Phase 47 avec 5 variables agents.

### Phase 46 — RAG local securise sur documentation et logs

#### Backend
- Module `server/src/ai/rag/` : 7 fichiers (ragSafety, ragChunker, ragEmbeddings, ragStore, ragCitations, ragRetriever, ragIndexer).
- 5 nouveaux endpoints `/api/ai/rag` : status, index, search, ask, clear.
- Indexation docs/**/*.md + README/CHANGELOG/ROADMAP par allowlist stricte.
- Chunking Markdown par titres H1-H6 avec overlap configurable (defaut 1200/150 chars).
- Embeddings Ollama (`/api/embeddings`) avec fallback lexical automatique.
- Secrets masques avant indexation et dans les citations.
- Clear index avec confirmation `"EFFACER_INDEX"` obligatoire.
- 6 evenements systemEventBus : rag.index.started/completed/failed, rag.search.completed, rag.ask.completed, rag.clear.completed.

#### Frontend
- Composants : RagStatusBadge, RagCitationsList, RagSearchBox, RagAskBox, RagPanel.
- Hook useRag : status, searchResult, askResult, loading, error, 6 methodes.
- 3 widgets dashboard : RagStatusWidget, RagAskWidget, RagSourcesWidget (tous localOnly=true).
- Integration dans AiAssistantPanel : bouton bascule "Documentation locale (RAG)".
- RAG types ajoutes dans types.ts.

#### Tests
- Backend : 57 tests dans tests/backend/aiRag.test.js.
- Frontend : 25 tests dans RagPanel.test.tsx et ragWidgets.test.tsx.
- Total : 345 tests frontend passes, 345 tests backend passes.

#### Documentation
- docs/PHASE46.md et docs/LOCAL_RAG.md ajoutes.
- .env.example : section Phase 46 avec 6 variables RAG.

### Phase 45 — IA locale integree (Ollama, modeles locaux)

#### Backend
- Module `server/src/ai/` : 6 fichiers (aiSafety, ollamaClient, localAiClient, aiPromptTemplates, aiDiagnosticsAssistant, aiLogAnalyzer).
- Route `/api/ai` : 6 endpoints (status, models, chat, diagnose, analyze-logs, suggest-command).
- IA desactivee par defaut (`SALLON_AI_ENABLED=false`).
- URL Ollama validee par regex — localhost / 127.0.0.1 uniquement, toute URL externe bloquee.
- Blocage commandes dangereuses : rm -rf, Remove-Item -Recurse -Force, del /s, Stop-Computer, shutdown, format, reg delete, curl/wget/iwr externe.
- Masquage secrets avant envoi a l'IA et dans les reponses (Bearer, password=, token=, api_key=, secret=, C:\Users\).
- Troncature input a 12 000 caracteres.
- Permissions plugin etendues : ai-read, ai-chat, ai-diagnostics.

#### Frontend
- Composants : AiStatusBadge, AiChatBox, AiDiagnosticsActions, AiAssistantPanel.
- Hook useAiAssistant : statut, messages, loading, error, 5 methodes.
- 3 widgets dashboard : LocalAiStatusWidget, AiDiagnosticsWidget, AiLogSummaryWidget (tous localOnly=true).
- Route /ai avec page dediee, lien "IA locale" dans TopNav.
- Suggestions dry-run uniquement — bouton "Copier" seul, aucun bouton "Executer".

#### Tests
- Backend : 40+ tests dans tests/backend/ai.test.js.
- Frontend : 31 tests dans AiAssistantPanel.test.tsx et aiWidgets.test.tsx.
- Total : 316 tests frontend passes, 288 tests backend passes.

#### Documentation
- docs/PHASE45.md et docs/LOCAL_AI.md ajoutes.
- docs/RELEASE_CHECKLIST.md : section 23 Phase 45 ajoutee.

### Phase 44B — Nettoyage ESLint widgets + polish dashboard

#### Corrections ESLint
- `eslint.config.mjs` : ajout de `argsIgnorePattern: '^_'` et `varsIgnorePattern: '^_'` — convention standard pour les parametres intentionnellement inutilises.
- `useBackupDashboard.ts` : suppression de l'import inutilise `buildApiUrl`.
- `useRestoreAssistant.ts` : suppression du generic `<T>` inutilise sur la fonction `safe`.
- Resultat : `pnpm lint` passe a 0 erreur, 0 warning (etait 0 erreur, 8 warnings).

#### Polish widgets
- `SSEStatusWidget` : utilisation du prop `size` pour le mode compact (compact = `small`) ; meilleure hierarchie visuelle ; etat vide explicite "Aucune donnee SSE" ; `role="alert"` sur les messages d'erreur.
- `UpdatesWidget` : utilisation du prop `size` pour masquer la commande PS1 en mode `small`.
- Tous les boutons refresh (↻) portent desormais un `aria-label` specifique par widget.

#### Tests nouveaux (10 ajouts, total 287 frontend)
- `widgetLayout.test.ts` : 5 tests localStorage — JSON invalide, widgets absent, widgets null, cle absente, saveLayout sans crash.
- `DashboardLayout.test.tsx` : 5 tests — corruption localStorage (2), reset layout (1), accessibilite boutons (2).

#### Documentation
- `docs/WIDGET_SYSTEM.md` : nouveau guide complet du systeme de widgets (architecture, tailles, manifeste, securite, tests).
- `docs/RELEASE_CHECKLIST.md` : section 22 Phase 44B ajoutee.
- `docs/INDEX.md` : liens Phase 44 et WIDGET_SYSTEM.md ajoutes.

---

## [0.4.0] — 2026-05-22 — Release locale stable

### Ajoute

**Phase 42 — Assistant de restauration securise**
- Wizard 6 etapes : snapshot, integrite SHA256, dry-run, score de risque, checklist, commande.
- 2 services backend : restoreAssistantSafety, restoreAssistantService (jamais restore-backup.ps1).
- 4 endpoints : /assistant, /dry-run, /risk, /command — lecture seule, aucune execution.
- 11 composants React dans restore-assistant/, hook useRestoreAssistant.
- Checklist 6 points obligatoires avant affichage commande PowerShell.
- Score risque : low/medium/high/blocked selon validite, age, type, fichiers.
- Commande manuelle uniquement : bouton Copier, aucun bouton "Restaurer maintenant".
- Integration Phase 41 : bouton "Preparer restauration" ouvre maintenant le wizard complet.
- Tests : 21 cas backend + 10 cas frontend.

**Phase 41 — Tableau de bord visuel des sauvegardes**
- Interface visuelle `/sauvegardes` : creation, verification, export ZIP, preparation de restauration, suppression.
- 3 services backend + 7 endpoints sous `/api/backups`.
- 14 composants React dans `frontend/src/components/backups/`.
- Hook `useBackupDashboard` avec chargement automatique et protection montage.
- Securite : IDs valides par regex, chemins masques, aucun secret expose, "SUPPRIMER" obligatoire.
- Restauration : commande PowerShell manuelle uniquement, aucune auto-restauration.
- Tests : 18 cas backend (jest) + 6 cas frontend (vitest).
- Lien "Sauvegardes" dans TopNav, topics et commandes dans le centre d'aide.

**Phase 40 — Sauvegarde/restauration complete utilisateur**
- `create-backup.ps1` : snapshot horodaté (quick/full), metadata.json, checksum.json SHA256, rapport texte, export ZIP optionnel.
- `list-backups.ps1` : liste tous les snapshots avec type, version, taille, validité.
- `verify-backup.ps1` : recalcule SHA256, compare checksum.json, états valid/corrupted/incomplete.
- `restore-backup.ps1` : vérifie intégrité, demande confirmation, arrête service/tray, backup pré-restauration automatique, rapport restore.
- `delete-backup.ps1` : confirmation obligatoire (oui ou SUPPRIMER TOUT).
- `export-backup.ps1` : archive ZIP avec SHA256, chiffrement optionnel via 7-Zip AES-256.
- Endpoint `GET /api/diagnostics/backup` : liste snapshots, dernier backup, taille, validité.
- Tray : item "Ouvrir les sauvegardes" ouvre `backups/snapshots/` dans l'explorateur.
- `apply-update.ps1` : crée snapshot Phase 40 avant chaque mise à jour.
- Scripts backup inclus dans le ZIP portable (scripts/windows/backup/).
- Documentation `docs/PHASE40.md` et `docs/BACKUP_RESTORE.md`.

**Phase 26 — Stabilisation aide et etat systeme**
- Centre d'aide consolide avec statut systeme plus explicite.
- Etats backend `checking`, `online`, `offline`, `degraded`.
- Tests frontend renforces autour des panneaux d'aide et du statut local.

**Phase 27/28 — Observabilite et evenements systeme**
- Panneau d'evenements systeme avec filtres severity/source.
- Bus d'evenements frontend local, marque lu/non-lu et exports.
- Integration dans `ObservabilityPanel`.

**Phase 29 — Persistance locale**
- Persistance localStorage des evenements systeme.
- Retention locale bornee, nettoyage silencieux et export JSON/CSV.
- Tests stockage et bus local.

**Phase 30 — SSE local securise**
- Endpoint `GET /api/events/stream`.
- Endpoint `GET /api/events/client-count`.
- Origines limitees a `localhost:3000` et `localhost:3001`.
- Deduplication frontend, heartbeat ignore et fallback local.

**Phase 31 — Centre de notifications intelligent**
- Notifications locales derivees des evenements systeme.
- Grouping, deduplication, compteur non-lus et filtres.
- Aucun appel cloud, aucun secret stocke.

**Phase 32 — Diagnostic avance**
- Endpoint `GET /api/diagnostics/overview`.
- Snapshot frontend avec Backend, SSE, Scheduler, Backup, Notifications, Stockage local et Securite.
- Score global 0-100, etat erreur propre, export JSON local.
- Tests frontend hook/dashboard et tests backend diagnostics.

**Phase 33 — Release locale stable**
- Scripts `scripts/windows/release/build-release.ps1`, `verify-release.ps1`, `start-release.ps1`.
- Generation checksum SHA256, metadata release et rapport local.
- Verification ZIP local-only, exclusions cache/temp/logs/node_modules/.env.
- README, ROADMAP et notes de release `v0.4.0`.

**Phase 35 — Installateur Windows autonome (Inno Setup)**
- Script Inno Setup 6 `scripts/windows/installer/Sallon-ConnecT.iss` complet.
- `build-installer.ps1` : detection ISCC, lint/tests/build avant compilation, SHA256 post-compilation.
- `verify-installer.ps1` : 11 verifications (taille, SHA256, version, exclusions secrets).
- `uninstall-check.ps1` : verification proprete post-desinstallation.
- Installation sans admin dans `%LOCALAPPDATA%\Sallon-ConnecT`.
- Verification Node.js et creation `.env` automatiques a l'installation.
- Documentation `INSTALLER_WINDOWS.md`.

**Phase 36 — Service Windows + demarrage automatique**
- `install-service.ps1` : dual-mode NSSM (admin) / Task Scheduler (sans admin, recommande).
- `start-service.ps1`, `stop-service.ps1`, `restart-service.ps1`, `remove-service.ps1`, `service-status.ps1`.
- Watchdog : redemarrage automatique en cas de crash (3 tentatives, delai 1 min).
- Endpoint `GET /api/diagnostics/service` : mode, statut, PID, uptime.
- Integration Inno Setup (tache optionnelle `installservice`).
- Documentation `WINDOWS_SERVICE.md`.

**Phase 39 — Auto-update local securise**
- `check-update.ps1` : verifie GitHub release vs version locale, affiche changelog et assets.
- `download-update.ps1` : telecharge ZIP + sha256, valide URL GitHub, verifie SHA256, ecrit verification.json.
- `apply-update.ps1` : backup systematique, confirmation obligatoire, copie selective (preserve logs/runtime/backups/.env/data/), rapport apply.
- `rollback-update.ps1` : restaure depuis runtime/update-backups/, listage et confirmation.
- `update-status.ps1` : statut versions, telechargements, backups.
- Tray : item "Verifier mise a jour..." dans le menu clic-droit.
- Aucun auto-update, aucune telemetrie, SHA256 obligatoire avant apply.
- Documentation `SECURE_UPDATE.md`.

**Phase 38 — Assistant premier lancement**
- `check-environment.ps1` : diagnostic complet (Node.js, npm, ports, backend, frontend, SSE, service, tray, dossiers).
- `first-run.ps1` : wizard interactif — choix mode (portable / Task Scheduler / NSSM), activation tray, ouverture dashboard.
- `first-run-status.ps1` : statut du premier lancement et environnement actuel.
- Rapport genere : `runtime/first-run-report.json` et `logs/first-run-report.txt`.
- Integration Inno Setup : tache optionnelle `firstrun`, raccourci Menu Demarrer "Assistant premier lancement".
- Aucune elevation admin automatique — bascule portable si NSSM sans droits.
- Aucun secret, aucun chemin sensible dans le rapport.
- Documentation `FIRST_RUN.md`.

**Phase 37 — Interface tray Windows**
- `Sallon-ConnecT-Tray.ps1` : application tray PowerShell + Windows Forms NotifyIcon.
- `start-tray.ps1`, `stop-tray.ps1`, `tray-status.ps1`.
- Menu clic-droit 8 actions, double-clic ouvre dashboard.
- Polling health `/api/health` toutes les 5s, icones systeme par etat.
- Notifications Windows locales avec throttle 60s par type.
- Protection instance unique via fichier PID dans `%TEMP%`.
- Integration Inno Setup (tache optionnelle `trayicon`).
- Aucune dependance externe, aucun appel cloud, pas d'Electron.
- Documentation `WINDOWS_TRAY.md`.

### Change

- Version projet alignee sur `0.4.0`.
- Packaging portable renforce avec exclusions cache/temp et scripts release Windows inclus.
- Documentation principale orientee release locale stable.
- Tests packaging et validation PowerShell couvrent les nouveaux scripts.

### Securite

- Aucune protection local-only supprimee.
- Diagnostics et exports limites aux champs non sensibles.
- SSE limite aux origines locales.
- ZIP portable verifie contre `.env`, `frontend/.env.local`, `node_modules`, `.next`, caches, runtime JSON, logs bruts, backups prives et cles/certificats.

### Validation

- Frontend : 228 tests.
- Backend : 114 tests.
- `pnpm lint` : OK.
- `pnpm build` : OK.
- Packaging ZIP : OK.

---

## [0.1.0] — 2026-05-17 — Premier prototype local complet

### Ajoute

**Infrastructure (Phases 1–4)**
- Serveur Express backend sur port 3000
- Ancien frontend HTML statique conserve
- Frontend Next.js 16 sur port 3001 (`frontend/`)
- API appareils, scan reseau, services multimedias
- Donnees JSON locales (`data/`)

**Integrations locales (Phases 5–11)**
- Orchestrateur de scenarios intelligents (cinema, travail, famille)
- Diagnostic ADB en lecture seule
- Decouverte DLNA/UPnP passive
- SmartThings Samsung TV opt-in securise
- Scenes SmartThings avec confirmation explicite
- Commandes TV avec whitelist d'actions
- Streaming assiste indexe localement

**Qualite et observabilite (Phases 12–19)**
- Notifications locales avec moteur de regles
- Scheduler de taches planifiees safelist uniquement
- Dashboard observabilite en temps reel
- Graphes temporels Recharts
- Export JSON/CSV non sensible des snapshots
- Packaging Windows portable
- Suite de tests backend, frontend, packaging et PowerShell
- Snapshots d'observabilite avec buckets non sensibles

**Profils et securite (Phase 20)**
- 5 profils par defaut : owner, family, guest, tv, diagnostic
- Permissions locales par profil
- Basculement rapide dans la TopNav
- Audit trail local des changements de profil

**Sauvegarde locale (Phases 21–21B)**
- ZIP locaux avec manifest SHA256
- Dry-run obligatoire avant restauration
- Rollback automatique avant restauration
- Code de confirmation explicite
- Exclusion automatique des secrets, dependances, logs bruts et builds
- Isolation des tests runtime

**Publication GitHub (Phase 22)**
- Scripts release initiaux
- Documentation complete
- VERSION 0.1.0, versionnement SemVer
- `.gitignore` complet verifie

### Securite

- Aucun secret commite.
- Chemins absolus masques dans les reponses API.
- Audit runtime non versionne.
- `node_modules`, `.next`, runtime, logs et backups exclus.
- SmartThings opt-in desactive par defaut.

---

[0.4.0]: https://github.com/farkh2023/Sallon-ConnecT/releases/tag/v0.4.0
[0.1.0]: https://github.com/farkh2023/Sallon-ConnecT/releases/tag/v0.1.0
