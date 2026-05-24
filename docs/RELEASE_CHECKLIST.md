# Release Checklist - Sallon-ConnecT v0.4.0

Checklist finale pour une release utilisateur Windows local-only.

## 1. Installation propre

- [ ] Tester dans un nouveau dossier hors depot Git.
- [ ] Extraire le ZIP portable sans copier `.env`.
- [ ] Confirmer l'absence initiale de `node_modules/` et `frontend/.next/`.
- [ ] Lancer `scripts\windows\release\start-release.ps1`.
- [ ] Verifier que les dependances absentes ou incompletes sont reparees.
- [ ] Verifier que le frontend repond sur `http://localhost:3001`.
- [ ] Verifier que le backend repond sur `http://localhost:3000/api/health`.
- [ ] Verifier que le statut signale clairement `.env` absent comme warning non bloquant.

## 2. Scripts Windows

- [ ] `scripts\windows\release\start-release.ps1` lance backend et frontend.
- [ ] `scripts\windows\release\build-release.ps1` execute lint, tests, build, packaging, verification et checksums.
- [ ] `scripts\windows\release\verify-release.ps1` valide structure ZIP, exclusions et scan secrets.
- [ ] `scripts\windows\status-sallon-connect.ps1` affiche ports, HTTP, dossiers et dernier log.
- [ ] `scripts\windows\stop-sallon-connect.ps1` arrete les processus ou avertit si un PID reste actif.
- [ ] Raccourci Bureau cree et cible valide.
- [ ] Raccourcis Menu Demarrer crees et cibles valides.
- [ ] Redemarrage propre valide apres arret.

## 3. Reseau et ports

- [ ] Port `3000` libre avant demarrage ou occupe par Sallon-ConnecT valide.
- [ ] Port `3001` libre avant demarrage ou occupe par Sallon-ConnecT valide.
- [ ] Si un autre service occupe `3000`, le script affiche le PID et refuse le faux backend.
- [ ] Si un autre service occupe `3001`, le script affiche le PID et refuse le faux frontend.
- [ ] Aucun crash silencieux : erreur lisible et chemin logs indique.

## 4. SSE local

- [ ] `GET /api/events/client-count` repond.
- [ ] `GET /api/events/stream` renvoie `sse.connected` depuis `http://localhost:3001`.
- [ ] Une origine externe recoit `403`.
- [ ] Le flux reste limite a `localhost:3000` et `localhost:3001`.
- [ ] Le fallback UI reste comprehensible si EventSource est indisponible.

## 5. Notifications

- [ ] `GET /api/notifications/stats` repond.
- [ ] Les notifications de demarrage et scheduler sont visibles.
- [ ] Les messages sont locaux et sans push externe obligatoire.
- [ ] Les messages sensibles sont masques.
- [ ] Les filtres et etats non lus restent coherents.

## 6. Diagnostics et observabilite

- [ ] `GET /api/diagnostics/overview` retourne `status=ok`.
- [ ] `security.localOnly=true`.
- [ ] `firebase=false`, `cloudServices=false`, `externalPush=false`.
- [ ] `GET /api/observability/overview` repond.
- [ ] Les logs exposes sont masques ou resumes.
- [ ] Les exports JSON restent locaux et non sensibles.

## 7. UX utilisateur

- [ ] Messages de lancement clairs : Node, dependances, build, PIDs, URLs.
- [ ] Message clair si Node est absent ou trop ancien.
- [ ] Message clair si un port est occupe.
- [ ] Etat loading visible dans les panneaux frontend.
- [ ] Erreurs frontend comprehensibles et non techniques quand possible.
- [ ] Terminologie utilisateur limitee : local, diagnostic, notification, observabilite.
- [ ] Centre d'aide disponible sur `/aide`.

## 8. Securite

- [ ] Aucun `.env` reel dans le ZIP.
- [ ] Aucun `.env.local`.
- [ ] Aucun token, password, secret ou API key probable.
- [ ] Aucun `node_modules/`.
- [ ] Aucun `frontend/.next/`.
- [ ] Aucun `runtime/*.json`.
- [ ] Aucun log brut `logs/*.log`, `logs/*.txt`, `logs/*.json`.
- [ ] Aucun backup prive `backups/*.zip` ou `backups/*.json`.
- [ ] Aucun certificat ou cle : `.pem`, `.key`, `.p12`, `.crt`.
- [ ] Diagnostics sans contenu sensible.

## 9. Packaging

- [ ] `pnpm release:build` genere un nouveau ZIP portable.
- [ ] `pnpm release:verify` valide le ZIP.
- [ ] `dist/Sallon-ConnecT-v0.4.0-sha256.txt` genere.
- [ ] `dist/Sallon-ConnecT-v0.4.0-release.json` genere.
- [ ] Rapport release present dans `dist/`.
- [ ] Taille ZIP et SHA256 reportes dans le livrable final.

## 10. Validations finales

Executer :

```powershell
pnpm lint
pnpm test
pnpm build
pnpm test:backend
pnpm test:windows
pnpm release:build
```

Resultat attendu :

- lint OK ;
- tests frontend OK ;
- tests backend OK ;
- build OK ;
- scripts Windows syntaxiquement valides ;
- packaging et verification release OK.

## 11. Installateur Windows (Phase 35)

- [ ] Inno Setup 6.x installe (`winget install JRSoftware.InnoSetup`).
- [ ] `scripts/windows/installer/Sallon-ConnecT.iss` present et valide.
- [ ] `scripts/windows/installer/build-installer.ps1` execute sans erreur.
- [ ] `dist/Sallon-ConnecT-Setup-0.4.0.exe` genere.
- [ ] SHA256 calcule et checksum cree dans `dist/`.
- [ ] `verify-installer.ps1` passe sans erreur critique.
- [ ] Aucun `.env`, token ou secret dans le `.exe`.
- [ ] Raccourcis Menu Demarrer crees correctement.
- [ ] Installation propre dans `%LOCALAPPDATA%\Sallon-ConnecT` validee.
- [ ] `npm install` et build frontend executes par le post-install.
- [ ] Desinstallation propre validee avec `uninstall-check.ps1`.
- [ ] ZIP portable non impacte par la Phase 35.

## 12. Service Windows (Phase 36)

- [ ] `scripts/windows/service/install-service.ps1 -UseTaskScheduler` execute sans erreur.
- [ ] `scripts/windows/service/service-status.ps1` retourne mode et statut corrects.
- [ ] `scripts/windows/service/start-service.ps1` demarre le backend et confirme `/api/health`.
- [ ] `scripts/windows/service/stop-service.ps1` arrete le backend et libere le port 3000.
- [ ] `scripts/windows/service/restart-service.ps1` redемarre proprement.
- [ ] `scripts/windows/service/remove-service.ps1` supprime la tache sans impacter les donnees.
- [ ] `GET /api/diagnostics/service` repond avec `mode` et `status`.
- [ ] ZIP portable non impacte par la Phase 36.

## 13. Tray Windows (Phase 37)

- [ ] `scripts/windows/tray/start-tray.ps1` lance le processus tray en arriere-plan.
- [ ] `scripts/windows/tray/tray-status.ps1` retourne PID et memoire.
- [ ] Icone visible dans la zone de notification Windows.
- [ ] Menu clic-droit : 8 actions disponibles.
- [ ] Double-clic gauche ouvre `http://localhost:3001`.
- [ ] Polling toutes les 5s : icone change selon etat backend.
- [ ] Notifications locales emises (pas de push externe).
- [ ] `scripts/windows/tray/stop-tray.ps1` ferme le tray proprement.
- [ ] Backend non impacte par l'arret du tray.
- [ ] ZIP portable non impacte par la Phase 37.

## 15. Assistant premier lancement (Phase 38)

- [ ] `scripts/windows/first-run/check-environment.ps1` detecte Node.js, npm, ports, backend, frontend, SSE.
- [ ] `check-environment.ps1 -Json` retourne JSON valide.
- [ ] `scripts/windows/first-run/first-run.ps1` s'execute en mode interactif.
- [ ] `first-run.ps1 -Unattended` genere le rapport sans interaction.
- [ ] `first-run.ps1 -Unattended -Mode task-scheduler` configure le service.
- [ ] `runtime/first-run-report.json` genere sans chemins sensibles ni secrets.
- [ ] `logs/first-run-report.txt` genere avec contenu lisible.
- [ ] `first-run-status.ps1` affiche rapport precedent et environnement actuel.
- [ ] Raccourci Menu Demarrer "Assistant premier lancement" present dans installateur.
- [ ] Tache `firstrun` dans installateur (decochee par defaut).
- [ ] Aucune elevation admin automatique (NSSM sans admin bascule en portable).
- [ ] ZIP portable non impacte par la Phase 38.

## 16. Auto-update securise (Phase 39)

- [ ] `scripts/windows/update/check-update.ps1` affiche version locale, distante et assets.
- [ ] URL validee : `https://github.com/farkh2023/` uniquement.
- [ ] Extensions validees : .zip, .txt, .json seulement.
- [ ] `download-update.ps1` telecharge et ecrit verification.json avec SHA256.
- [ ] `apply-update.ps1` refuse si SHA256 invalide.
- [ ] `apply-update.ps1` demande confirmation avant apply.
- [ ] Backup cree dans `runtime/update-backups/` avant chaque apply.
- [ ] Fichiers preserves : logs/, runtime/, backups/, .env, data/.
- [ ] `rollback-update.ps1 -List` liste les backups disponibles.
- [ ] `rollback-update.ps1` restaure les fichiers de la version precedente.
- [ ] `update-status.ps1` affiche versions telechargees et backups.
- [ ] Item "Verifier mise a jour..." present dans le menu tray.
- [ ] Aucun auto-update, aucune telemetrie, aucun secret dans rapports.
- [ ] ZIP portable non impacte par la Phase 39.

## 17. Sauvegarde/restauration (Phase 40)

- [ ] `scripts/windows/backup/create-backup.ps1` cree un snapshot horodaté dans `backups/snapshots/`.
- [ ] `list-backups.ps1` liste les snapshots avec type, version, taille.
- [ ] `verify-backup.ps1` recalcule SHA256 et retourne valid/corrupted/incomplete.
- [ ] `restore-backup.ps1` demande confirmation, arrete service/tray, cree backup pre-restauration.
- [ ] `delete-backup.ps1` demande confirmation avant suppression.
- [ ] `export-backup.ps1` cree ZIP avec SHA256. Chiffrement optionnel (7-Zip).
- [ ] `GET /api/diagnostics/backup` repond avec liste et dernier snapshot.
- [ ] Tray : item "Ouvrir les sauvegardes" ouvre `backups/snapshots/`.
- [ ] `apply-update.ps1` cree snapshot Phase 40 avant mise a jour.
- [ ] Aucun secret dans les snapshots (.env non copie).
- [ ] `backups/snapshots/` exclu du ZIP portable.
- [ ] Documentation `docs/PHASE40.md` et `docs/BACKUP_RESTORE.md` presentes.

## 18. Tableau de bord visuel des sauvegardes (Phase 41)

- [ ] Page `/sauvegardes` accessible et affiche les snapshots.
- [ ] Boutons "Backup rapide" et "Backup complet" declenchent la creation.
- [ ] Verification SHA256 affiche les resultats par fichier.
- [ ] Export ZIP produit `ok: true` en reponse.
- [ ] Suppression impossible sans taper "SUPPRIMER".
- [ ] Restauration : seule la commande PS1 est affichee, aucun bouton auto.
- [ ] IDs avec `..` ou `/` rejetes par l'API (400).
- [ ] Aucun chemin `C:\Users\` dans les reponses API.
- [ ] Aucun secret / token / .env dans les reponses.
- [ ] `GET /api/backups/safety` retourne tous les flags `true`.
- [ ] Tests backend : 18 cas passes (`npm run test:backend`).
- [ ] Tests frontend : 6 cas passes (`npm run test:frontend` ou `pnpm test:frontend`).
- [ ] Lien "Sauvegardes" present dans TopNav.
- [ ] Documentation `docs/PHASE41.md` presente.

## 19. Assistant de restauration securise (Phase 42)

- [ ] Bouton "Preparer restauration" ouvre le wizard a 6 etapes.
- [ ] Etape 1 : infos snapshot affichees, bloque si invalide.
- [ ] Etape 2 : resultats integrite SHA256 affiches, bloque si echec.
- [ ] Etape 3 : dry-run affiche wouldRestore/wouldReplace/wouldKeep/excluded.
- [ ] Etape 4 : score de risque low/medium/high/blocked.
- [ ] Etape 5 : 6 cases checklist toutes obligatoires.
- [ ] Etape 6 : commande PowerShell avec bouton Copier — aucun bouton "Restaurer maintenant".
- [ ] `GET /api/backups/:id/restore/assistant` retourne status ready/blocked.
- [ ] `POST /api/backups/:id/restore/dry-run` retourne les 4 listes.
- [ ] `POST /api/backups/:id/restore/risk` retourne level + score.
- [ ] `GET /api/backups/:id/restore/command` retourne manualOnly:true.
- [ ] IDs invalides (.. / \ espace) rejetes 400.
- [ ] Aucune reponse ne contient C:\Users\ ou .env ou Bearer.
- [ ] runRestoreBackup n'existe pas dans le runner.
- [ ] Tests backend : 21 cas passes.
- [ ] Tests frontend : 10 cas passes.
- [ ] Documentation docs/PHASE42.md presente.

## 20. Plugins locaux (Phase 43)

- [ ] Page `/plugins` accessible sans erreur.
- [ ] `GET /api/plugins/safety` retourne tous les flags `true`.
- [ ] `GET /api/plugins/list` retourne `plugins` tableau + `total` nombre.
- [ ] Plugin exemple `plugins/example-plugin/` present et manifeste valide.
- [ ] Boutons Activer / Desactiver fonctionnels.
- [ ] IDs avec `..`, `/`, `\`, `!` rejetes 400.
- [ ] Aucun chemin `C:\Users\` dans les reponses.
- [ ] Aucun secret / token / Bearer dans les reponses.
- [ ] Erreur de plugin isolee : n'affecte pas le reste de l'application.
- [ ] Lien "Plugins" present dans TopNav.
- [ ] Tests backend : 21 cas passes (`npm run test:backend`).
- [ ] Documentation `docs/PHASE43.md` presente.

## 21. Widgets dynamiques et dashboard modulaire (Phase 44)

- [ ] Page `/dashboard` accessible et affiche les widgets actifs.
- [ ] 8 widgets enregistres au demarrage (SystemHealth, Notifications, Plugins, Diagnostics, SSEStatus, BackupStatus, ServiceStatus, Updates).
- [ ] Widget non reconnu affiche un placeholder, ne crashe pas.
- [ ] Erreur dans un widget isolee par ErrorBoundary — les autres restent visibles.
- [ ] Bouton "Masquer" retire le widget de la grille.
- [ ] Bouton "+ Ajouter widget" ouvre le catalogue et restaure le widget.
- [ ] Boutons S/M/L/XL redimensionnent le widget.
- [ ] Drag & drop reordonne les widgets sans crash.
- [ ] Bouton "Compact" bascule le mode compact.
- [ ] Bouton "Mode kiosque" passe en plein ecran, "Quitter" revient a la normale.
- [ ] Bouton "Exporter" telecharge `sallon-connect-layout.json`.
- [ ] Bouton "Importer" charge un layout JSON valide.
- [ ] Bouton "Reinitialiser" revient au layout par defaut.
- [ ] Layout sauvegarde dans `localStorage` cle `sallon-connect-widget-layout-v1`.
- [ ] Layout restaure au rechargement de la page.
- [ ] Un widget plugin (localOnly=true) est accepte et affiche.
- [ ] Un widget plugin (localOnly=false) est rejete par le registre.
- [ ] Aucun cloud, aucun script distant, aucun secret dans les widgets.
- [ ] Lien "Dashboard" present dans TopNav.
- [ ] Tests frontend : 33 cas passes (`pnpm test`).
- [ ] Documentation `docs/PHASE44.md` presente.

## 22. Nettoyage ESLint widgets + polish dashboard (Phase 44B)

- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Convention `argsIgnorePattern: '^_'` documentee dans `eslint.config.mjs`.
- [ ] `buildApiUrl` retire de l'import de `useBackupDashboard.ts`.
- [ ] Generic `<T>` inutile retire de `useRestoreAssistant.ts`.
- [ ] Tous les boutons refresh portent un `aria-label` specifique.
- [ ] SSEStatusWidget et UpdatesWidget utilisent `size` pour le mode responsive.
- [ ] Layout restaure en mode par defaut si localStorage corrompu.
- [ ] Bouton "Reinitialiser" remet le layout par defaut (widget masque redevient visible).
- [ ] Tests frontend : 287 cas passes (`pnpm test`) — 10 nouveaux tests widget.
- [ ] Tests widgetLayout : 5 tests de corruption localStorage.
- [ ] Tests DashboardLayout : 5 tests supplementaires (reset, corruption, accessibilite).
- [ ] Documentation `docs/WIDGET_SYSTEM.md` presente.
- [ ] `CHANGELOG.md` mis a jour avec section Phase 44B.

## 23. IA locale integree — Ollama (Phase 45)

- [ ] `GET /api/ai/status` retourne `enabled:false` par defaut (sans .env IA).
- [ ] `SALLON_AI_ENABLED=true` active l'IA, `false` la desactive proprement.
- [ ] URL Ollama limitee a `127.0.0.1` / `localhost` — URL externe bloquee avant appel.
- [ ] Commandes dangereuses bloquees : rm -rf, Remove-Item -Recurse, del /s, Stop-Computer, etc.
- [ ] Secrets masques dans inputs et reponses : Bearer, password=, token=, C:\Users\.
- [ ] Aucun bouton "Executer" — suggestions dry-run avec bouton "Copier" uniquement.
- [ ] Widget "IA locale" (local-ai-status) visible dans le dashboard.
- [ ] Widget "Diagnostic IA" (ai-diagnostics) visible dans le dashboard.
- [ ] Widget "Analyse logs IA" (ai-log-summary) visible dans le dashboard.
- [ ] Route `/ai` accessible (lien "IA locale" dans TopNav).
- [ ] Panneau `AiAssistantPanel` : 4 badges securite, statut, chat, diagnostics.
- [ ] `GET /api/ai/models` retourne liste vide si Ollama inactif (pas de crash).
- [ ] `POST /api/ai/chat` retourne `ok:false, reason:ai_disabled` sans crash.
- [ ] `POST /api/ai/diagnose` retourne `ok:false` si IA desactivee.
- [ ] `POST /api/ai/analyze-logs` retourne 400 si `logs` absent.
- [ ] `POST /api/ai/suggest-command` retourne 400 si `task` absent.
- [ ] Permissions plugin : ai-read, ai-chat, ai-diagnostics acceptees.
- [ ] Tests backend : 40+ cas passes (`npm run test:backend`).
- [ ] Tests frontend : 31 cas passes pour les composants et widgets IA (`pnpm test`).
- [ ] `pnpm lint` : 0 erreur, 0 warning avec les nouveaux fichiers IA.
- [ ] Documentation `docs/PHASE45.md` presente.
- [ ] Documentation `docs/LOCAL_AI.md` presente.

## 24. RAG local securise — documentation et logs (Phase 46)

- [ ] `GET /api/ai/rag/status` retourne structure complete (indexed, chunkCount, sources, mode, safety).
- [ ] `POST /api/ai/rag/index` indexe README, CHANGELOG, ROADMAP et docs/ sans erreur.
- [ ] Allowlist sources : docs/**/*.md, README.md, CHANGELOG.md, ROADMAP.md seulement.
- [ ] `.env` rejete par isSourceAllowed — non inclus dans l'index.
- [ ] `runtime/`, `backups/`, `node_modules/` rejetes.
- [ ] Path traversal (`../`) rejete par isSourceAllowed.
- [ ] Fichiers > 2 Mo refuses a l'indexation.
- [ ] `POST /api/ai/rag/search` retourne chunks avec scores.
- [ ] Citations ne reveloent aucun chemin absolu ni `C:\Users\`.
- [ ] `POST /api/ai/rag/ask` retourne citations + reponse IA (ou ok:false si IA desactivee).
- [ ] `POST /api/ai/rag/clear` retourne 400 sans confirmation.
- [ ] `POST /api/ai/rag/clear` retourne ok:true avec `EFFACER_INDEX`.
- [ ] Index stocke dans `runtime/rag/` (exclu du ZIP portable et de Git).
- [ ] Fallback lexical si Ollama embeddings indisponible — badge "Fallback lexical" visible.
- [ ] 3 widgets RAG enregistres avec localOnly=true : rag-status, rag-ask, rag-sources.
- [ ] RagPanel : bouton Indexer, onglets Ask/Search, sources, badges securite.
- [ ] Integration AiAssistantPanel : bouton bascule "Documentation locale (RAG)".
- [ ] Secrets masques avant indexation et dans les citations.
- [ ] Tests backend : 57 cas passes (`npm run test:backend`).
- [ ] Tests frontend : 25 cas passes (`pnpm test`).
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Documentation `docs/PHASE46.md` presente.
- [ ] Documentation `docs/LOCAL_RAG.md` presente.

## 25. Phase 47 — Agents IA locaux orchestres

- [ ] `GET /api/ai/agents` retourne la liste des 5 agents integres avec safety.
- [ ] Tous les agents ont localOnly=true et dryRun=true.
- [ ] `POST /api/ai/agents/run` refuse si SALLON_AGENTS_ENABLED=false (503).
- [ ] `POST /api/ai/agents/run` sans task retourne 400.
- [ ] run retourne runId, steps, recommendations, citations, rejectedActions, safetySummary.
- [ ] dryRun=true force dans tous les runs.
- [ ] shell.execute retourne allowed:false.
- [ ] file.delete retourne allowed:false.
- [ ] restore.apply retourne allowed:false.
- [ ] network.external retourne allowed:false.
- [ ] secrets.read retourne allowed:false.
- [ ] `POST /api/ai/agents/runs/clear` sans confirmation retourne 400.
- [ ] `POST /api/ai/agents/runs/clear` avec "EFFACER_RUNS" retourne ok:true.
- [ ] Memoire locale dans runtime/agents/ (exclu de Git et ZIP portable).
- [ ] 3 widgets agents enregistres avec localOnly=true : agents-status, agent-run, agent-recommendations.
- [ ] AgentsPanel : badge dry-run visible, etat vide, liste agents, formulaire, timeline, recommandations, rejets.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend : 27 cas passes.
- [ ] Tests frontend : 18 cas passes.
- [ ] Documentation `docs/PHASE47.md` presente.
- [ ] Documentation `docs/LOCAL_AGENTS.md` presente.

## 26. Phase 48 — Workflows IA visuels et automatisations locales

- [ ] `GET /api/ai/workflows` retourne la liste des workflows avec safety.
- [ ] `GET /api/ai/workflows/templates` retourne les 6 templates integres.
- [ ] Tous les workflows ont localOnly=true et dryRun=true.
- [ ] `POST /api/ai/workflows/:id/run` refuse si SALLON_WORKFLOWS_ENABLED=false (503).
- [ ] `POST /api/ai/workflows/:id/run` force dryRun=true dans le resultat.
- [ ] Types de noeuds interdits (shell-execute, restore-apply, etc.) rejetes a la validation.
- [ ] Cycles detectes et rejetes (DFS + Kahn).
- [ ] `DELETE /api/ai/workflows/:id` sans confirmation retourne 400.
- [ ] `DELETE /api/ai/workflows/:id` avec "SUPPRIMER" retourne ok:true.
- [ ] `POST /api/ai/workflows/runs/clear` sans confirmation retourne 400.
- [ ] `POST /api/ai/workflows/runs/clear` avec "EFFACER_RUNS_WORKFLOWS" retourne ok:true.
- [ ] Import refuse localOnly=false ou dryRun=false.
- [ ] Payload max 64KB respecte.
- [ ] IDs valides uniquement [a-zA-Z0-9_-].
- [ ] runtime/workflows/ exclu de Git et ZIP portable.
- [ ] 3 widgets workflows enregistres : workflows-status, workflow-run, workflow-templates.
- [ ] WorkflowsPanel : 4 onglets, badges securite, dry-run, liste, templates, editeur, import/export.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend aiWorkflows : >= 25 cas passes.
- [ ] Tests frontend WorkflowsPanel + workflowWidgets : >= 17 cas passes.
- [ ] Documentation `docs/PHASE48.md` presente.
- [ ] Documentation `docs/LOCAL_WORKFLOWS.md` presente.
- [ ] `.env.example` inclut SALLON_WORKFLOWS_ENABLED et variantes.

## 27. Phase 49 — Mémoire persistante IA et contexte utilisateur local

- [ ] `GET /api/ai/memory/status` retourne safety, retention, enabled.
- [ ] `GET /api/ai/memory` retourne la liste avec meta et safety.localOnly=true.
- [ ] `POST /api/ai/memory` refuse type/scope invalides (400).
- [ ] `POST /api/ai/memory` retourne 503 si SALLON_AI_MEMORY_ENABLED=false.
- [ ] `DELETE /api/ai/memory/:id` retourne 404 si item inconnu.
- [ ] `POST /api/ai/memory/search` refuse query vide (400).
- [ ] `POST /api/ai/memory/search` retourne resultats avec _score.
- [ ] `POST /api/ai/memory/clear` refuse sans confirmation (400).
- [ ] `POST /api/ai/memory/clear` avec "EFFACER_MEMOIRE" retourne ok:true.
- [ ] `POST /api/ai/memory/import` refuse payload sans items (400).
- [ ] Export masque Bearer tokens, passwords, chemins personnels.
- [ ] IDs valides uniquement [a-zA-Z0-9_-].
- [ ] runtime/ai-memory/ exclu de Git et ZIP portable.
- [ ] 3 widgets memoire enregistres : memory-status, memory-search, memory-recent.
- [ ] AiMemoryPanel : 5 onglets, badges securite, liste, ajout, recherche, export/import, retention.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend aiMemory : >= 25 cas passes.
- [ ] Tests frontend AiMemoryPanel + memoryWidgets : >= 17 cas passes.
- [ ] Documentation `docs/PHASE49.md` presente.
- [ ] Documentation `docs/AI_MEMORY.md` presente.
- [ ] `.env.example` inclut SALLON_AI_MEMORY_ENABLED et variantes.

## 28. Phase 50 — Base de connaissances locale unifiee

- [ ] `GET /api/ai/knowledge/status` retourne safety, meta, enabled.
- [ ] `GET /api/ai/knowledge` retourne la liste avec meta et safety.localOnly=true.
- [ ] `POST /api/ai/knowledge/search` refuse query vide (400).
- [ ] `POST /api/ai/knowledge/search` retourne resultats avec _score et citations.
- [ ] `POST /api/ai/knowledge/graph` retourne nodes, edges, totalNodes, totalEdges.
- [ ] `POST /api/ai/knowledge/summarize` retourne resume par categorie.
- [ ] `POST /api/ai/knowledge/reindex` retourne 503 si SALLON_KNOWLEDGE_ENABLED=false.
- [ ] `POST /api/ai/knowledge/clear` refuse sans confirmation (400).
- [ ] `POST /api/ai/knowledge/clear` avec "EFFACER_KNOWLEDGE_BASE" retourne ok:true.
- [ ] Path traversal bloque — IDs valides uniquement [a-zA-Z0-9_-].
- [ ] Secrets masques dans toutes les reponses.
- [ ] runtime/knowledge/ exclu de Git et ZIP portable.
- [ ] 3 widgets knowledge enregistres : knowledge-status, knowledge-search, knowledge-graph.
- [ ] KnowledgeBasePanel : 4 onglets, badges securite, recherche, graphe, resumes.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend aiKnowledge : >= 15 cas passes.
- [ ] Tests frontend KnowledgeBasePanel + knowledgeWidgets : >= 15 cas passes.
- [ ] Documentation `docs/PHASE50.md` presente.
- [ ] Documentation `docs/KNOWLEDGE_BASE.md` presente.
- [ ] `.env.example` inclut SALLON_KNOWLEDGE_ENABLED et variantes.

## 29. Phase 51 — Recherche globale intelligente + Command Center

- [ ] `GET /api/search/status` retourne safety flags et compteurs.
- [ ] `GET /api/search/commands` retourne les commandes sures Phase 51 et Phase 52.
- [ ] `POST /api/search` refuse query vide (400).
- [ ] `POST /api/search` retourne resultats groupes par type.
- [ ] `POST /api/search/commands/:id/preview` retourne localOnly=true.
- [ ] `POST /api/search/commands/:id/run` refuse commandes interdites (400).
- [ ] `POST /api/search/commands/open.dashboard/run` retourne action navigate.
- [ ] Path traversal bloque sur IDs commandes.
- [ ] Secrets masques dans toutes les reponses.
- [ ] CommandCenterModal : Ctrl+K ouvre, Echap ferme, navigation clavier.
- [ ] RecentSearches : historique localStorage, effacement confirme.
- [ ] SavedCommands : commandes rapides visibles.
- [ ] 3 widgets enregistres : global-search, command-center, recent-searches.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend globalSearch : >= 12 cas passes.
- [ ] Tests frontend CommandCenterModal + searchWidgets : >= 15 cas passes.
- [ ] Documentation `docs/PHASE51.md` presente.
- [ ] Documentation `docs/COMMAND_CENTER.md` presente.
- [ ] `.env.example` inclut SALLON_SEARCH_ENABLED et variantes.

## 30. Phase 52 - Profils utilisateur locaux et workspaces

- [ ] `GET /api/workspaces/status` retourne enabled, current, total et safety.localOnly=true.
- [ ] `GET /api/workspaces` liste les profils sans chemin sensible.
- [ ] `POST /api/workspaces` cree un profil local valide.
- [ ] `POST /api/workspaces/switch` bascule vers un workspace existant.
- [ ] `GET /api/workspaces/current` retourne le profil actif.
- [ ] `PUT /api/workspaces/:id` renomme/met a jour les settings.
- [ ] `DELETE /api/workspaces/:id` refuse le workspace courant.
- [ ] `DELETE /api/workspaces/default` refuse sans `SUPPRIMER_WORKSPACE_DEFAULT`.
- [ ] `POST /api/workspaces/:id/export` masque secrets et chemins personnels.
- [ ] `POST /api/workspaces/import` refuse payload invalide, `localOnly=false` et traversal.
- [ ] `workspaceContext` retourne des chemins dans `runtime/workspaces/<id>/` pour les workspaces non-default.
- [ ] Memoire IA utilise le workspace courant, `default` garde `runtime/ai-memory/`.
- [ ] Historique Command Center localStorage scope par workspace.
- [ ] Layouts widgets localStorage scopes par workspace.
- [ ] Route `/workspaces` accessible.
- [ ] TopNav affiche le workspace actif.
- [ ] 3 widgets enregistres : workspace-status, workspace-switcher, workspace-summary.
- [ ] Command Center expose open.workspaces, workspace.switch, workspace.export, workspace.create.
- [ ] Aucune suppression via Command Center.
- [ ] `pnpm lint` : 0 erreur, 0 warning.
- [ ] Tests backend workspaces : >= 10 cas passes.
- [ ] Tests frontend WorkspacesPanel + widgets : >= 10 cas passes.
- [ ] Documentation `docs/PHASE52.md` presente.
- [ ] Documentation `docs/WORKSPACES.md` presente.
- [ ] `.env.example` inclut SALLON_WORKSPACES_ENABLED, SALLON_DEFAULT_WORKSPACE, SALLON_WORKSPACE_MAX_COUNT.

## 31. Phase 53 - Isolation complete workspace RAG / KB / agents / workflows

- [ ] `workspaceContext` expose getRagPath, getKnowledgePath, getAgentsPath, getWorkflowsPath, getAgentRunsPath, getWorkflowRunsPath.
- [ ] RAG utilise le workspace courant ou `workspaceId` explicite et ne lit pas les donnees d'un autre workspace.
- [ ] Knowledge Base utilise le workspace courant ou `workspaceId` explicite et ne lit pas les donnees d'un autre workspace.
- [ ] Agents runs stockes dans `runtime/workspaces/<id>/agents/runs/`.
- [ ] Workflows definitions/runs/exports stockes dans `runtime/workspaces/<id>/workflows/`.
- [ ] Les APIs RAG/KB/agents/workflows/search acceptent `X-Workspace-Id`, query/body `workspaceId` et refusent les IDs invalides.
- [ ] Export workspace `2.0` inclut memory, rag, knowledge, agents, workflows, dashboards, command history, plugins settings, metadata.
- [ ] Export workspace ne contient aucun secret, chemin absolu ou donnees d'un autre workspace.
- [ ] Import workspace `2.0` valide version, checksum, fichiers JSON, run IDs et `localOnly=true`.
- [ ] Migration legacy default non destructive, fallback legacy actif par defaut.
- [ ] Frontend envoie `X-Workspace-Id` et refresh RAG/KB/agents/workflows/memory apres switch.
- [ ] Widgets dashboard sont remountes au changement de workspace pour eviter les caches croises.
- [ ] Evenements workspace.rag.indexed, workspace.knowledge.indexed, workspace.agent.run.created, workspace.workflow.run.created, workspace.migration.completed et workspace.isolation.violation.blocked publies.
- [ ] Tests backend `workspaceIsolation.test.js` passent.
- [ ] Tests frontend workspace-aware hooks passent.
- [ ] Documentation `docs/PHASE53.md` presente.
- [ ] Documentation `docs/WORKSPACE_ISOLATION.md` presente.
- [ ] `.env.example` inclut SALLON_WORKSPACE_ISOLATION_STRICT, SALLON_WORKSPACE_LEGACY_FALLBACK, SALLON_WORKSPACE_MIGRATION_AUTO.

## 14. GitHub Release

- [ ] Tag `v0.4.0` publie.
- [ ] ZIP portable joint a la release.
- [ ] Checksum SHA256 joint ou documente.
- [ ] Notes de release coherentes avec `docs/releases/v0.4.0.md`.
- [ ] Aucune action cloud ajoutee par la release.
- [ ] Aucune publication automatique sans validation humaine.
