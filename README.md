# Sallon-ConnecT

[![Tests](https://github.com/farkh2023/Sallon-ConnecT/actions/workflows/tests.yml/badge.svg)](https://github.com/farkh2023/Sallon-ConnecT/actions/workflows/tests.yml)
[![Version](https://img.shields.io/badge/version-0.4.0-blue)](VERSION)
[![Node](https://img.shields.io/badge/node-%3E%3D22.13-brightgreen)](https://nodejs.org/)
[![Local First](https://img.shields.io/badge/cloud-none-lightgrey)](docs/SECURITY_MODEL.md)

Sallon-ConnecT est un hub local pour piloter, observer et diagnostiquer les services d'un salon connecte depuis une interface Next.js et une API Express. La release locale stable `v0.4.0` consolide l'observabilite, le flux SSE, les notifications, les diagnostics avances et le packaging Windows portable.

Le projet est local-first : aucune telemetrie, aucun cloud obligatoire, aucun secret dans Git.

## Fonctionnalites

| Domaine | Capacites |
|---|---|
| Backend Express | API locale, health check, routes modulaires, SSE local |
| Frontend Next.js | Dashboard, PWA, mode TV, profils, centre d'aide |
| Observabilite | Health, runtime, logs, snapshots, graphes temporels |
| Evenements systeme | Bus local, persistance localStorage, exports JSON/CSV |
| Notifications | Centre intelligent local, grouping, filtres, masquage |
| Diagnostics | Score global, cartes Backend/SSE/Scheduler/Backup/Notifications/Stockage/Securite |
| Scheduler | Taches locales autorisees par allowlist |
| Backup / restore | ZIP local, manifest SHA256, dry-run et confirmation |
| Integrations | ADB read-only, DLNA passif, SmartThings opt-in, streaming assiste |
| Plugins locaux | Manifeste YAML, registre isole, activation/desactivation, sandbox erreurs |
| Dashboard widgets | Widgets dynamiques, drag&drop, resize S/M/L/XL, layout localStorage scope par workspace |
| IA locale (Ollama) | Chat, diagnostics, analyse logs, suggestions dry-run — 100% local, aucun cloud |
| RAG local | Questions/recherche sur la documentation locale avec citations — embeddings Ollama + fallback lexical |
| Agents IA locaux | Orchestration sequentielle d'agents specialises (diagnostic, securite, backup, docs, commandes) — dry-run, local-only |
| Workflows IA visuels | Pipelines DAG sequentiels enchaînant agents, RAG, diagnostics, notifications — dry-run, local-only, 6 templates |
| Memoire persistante IA | Contexte utilisateur local (preferences, faits, resumes, resultats agents/workflows) — local-only, recherche lexicale, export/import |
| Base de connaissances locale | Graphe de connaissances unifiant memoire, RAG, workflows, agents, diagnostics, plugins, evenements — local-only, recherche lexicale, graphe relations, resumes IA |
| Recherche globale + Command Center | Recherche unifiee multi-sources + commandes rapides sures dont workspaces (Ctrl+K) — local-only, historique, suggestions IA optionnelles |
| Workspaces locaux | Profils de travail locaux, switch, import/export complet, isolation memoire/RAG/KB/agents/workflows/runs et layouts widgets par workspace |
| Packaging Windows | Installateur guide, raccourcis, scripts start/stop/status, ZIP portable |

## Architecture

```text
Sallon-ConnecT/
  server.js                    Backend Express - http://localhost:3000
  server/src/routes/           API locale: health, observability, events, diagnostics
  server/src/services/         Services locaux, securite, backup, scheduler
  server/src/workspaces/       Profils workspaces locaux et contexte runtime
  frontend/                    App Next.js - http://localhost:3001
  docs/                        Documentation technique et utilisateur
  scripts/windows/             Installation, demarrage, diagnostic, packaging
  scripts/windows/release/     Build, verification et demarrage release
  runtime/                     Etat local ignore par Git
  logs/                        Rapports locaux ignores par Git
  backups/                     Sauvegardes locales ignorees par Git
  dist/                        Artefacts release locaux ignores par Git
```

## Installation Windows

Prerequis recommandes :

- Windows 10/11 ;
- Node.js `>=22.13.0` ;
- npm, pnpm optionnel ;
- PowerShell ;
- Git pour cloner le depot.

Installation guidee :

```powershell
scripts\windows\install\install-sallon-connect.bat
scripts\windows\install\first-run-wizard.bat
```

Installation manuelle :

```powershell
git clone https://github.com/farkh2023/Sallon-ConnecT.git
cd Sallon-ConnecT
copy .env.example .env
npm install
cd frontend
npm install
cd ..
```

## Lancement rapide

Mode developpement :

```powershell
npm run dev
```

Scripts Windows :

```powershell
scripts\windows\start-sallon-connect.bat
scripts\windows\status-sallon-connect.bat
scripts\windows\stop-sallon-connect.bat
```

Mode release locale :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\start-release.ps1
```

URLs :

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Backend | http://localhost:3000 |
| Health | http://localhost:3000/api/health |
| Diagnostics | http://localhost:3000/api/diagnostics/overview |
| SSE clients | http://localhost:3000/api/events/client-count |

## Sections UI

- Dashboard principal : statut local, actions rapides et acces aux panneaux.
- Observabilite : resume health, runtime, logs, snapshots et graphes.
- Evenements systeme : flux local, filtres, historique et exports.
- Centre notifications : notifications groupees, non-lues, filtres severity/source.
- Diagnostic avance : score global, cartes sante et export JSON local.
- Centre d'aide : `/aide`, commandes, TP pratiques, FAQ et statut systeme.

## Mode local-only

Sallon-ConnecT ne pousse aucune donnee vers un service cloud. Les fichiers sensibles restent locaux :

- `.env` et `frontend/.env.local` ne sont jamais inclus dans Git ni dans le ZIP ;
- `runtime/*.json`, `logs/*.json|txt|log`, `backups/*.zip|json`, `node_modules`, `.next`, cache et temp sont exclus ;
- SmartThings, DLNA, ADB et streaming restent opt-in ;
- les exports JSON sont generes localement et ne declenchent aucun upload.

## SSE, observabilite, notifications, diagnostics

- SSE : `GET /api/events/stream`, origines limitees a `localhost:3000` et `localhost:3001`.
- Observabilite : `GET /api/observability/overview`, snapshots, stats, tendances et exports.
- Notifications : centre local alimente par les evenements systeme, sans appel reseau externe.
- Diagnostics : `GET /api/diagnostics/overview`, score 0-100, `security.localOnly=true`, aucun secret expose.

## Packaging release

Build release complet :

```powershell
pnpm release:build
```

Equivalent direct :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\build-release.ps1
```

Le script execute lint, tests, build, tests backend isoles, packaging ZIP, verification local-only, checksum SHA256 et rapport release.

Verification d'un ZIP :

```powershell
pnpm release:verify
```

Artefacts generes dans `dist/` :

- `Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip`
- `Sallon-ConnecT-v0.4.0-sha256.txt`
- `Sallon-ConnecT-v0.4.0-release.json`
- `Sallon-ConnecT-v0.4.0-release-report-*.txt`

## Tests et qualite

```powershell
pnpm lint
pnpm test
pnpm build
pnpm test:backend
pnpm test:windows
```

Etat valide Phase 33 :

- frontend : 228 tests ;
- backend : 114 tests ;
- lint : OK ;
- build Next.js : OK ;
- packaging ZIP : OK.

## Troubleshooting

| Probleme | Action |
|---|---|
| Node trop ancien | Installer Node `>=22.13.0` |
| Port 3000/3001 occupe | `scripts\windows\status-sallon-connect.bat`, puis `stop-sallon-connect.bat` |
| Frontend release absent | Relancer `npm run build` dans `frontend/` ou `start-release.ps1` sans `-SkipBuild` |
| Dependances absentes | Relancer `npm install` racine et `frontend/`, ou `start-release.ps1` sans `-SkipInstall` |
| ZIP refuse par verification | Lire le rapport `dist/*release-report*.txt` et corriger les entrees interdites |
| Donnees locales corrompues | Sauvegarder puis nettoyer `runtime/`, `logs/` ou `backups/` selon le guide |

## Documentation

| Document | Role |
|---|---|
| [CHANGELOG.md](CHANGELOG.md) | Historique des releases |
| [ROADMAP.md](ROADMAP.md) | Prochaines phases |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique |
| [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Modele de securite local-first |
| [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Installation locale |
| [docs/PHASE32.md](docs/PHASE32.md) | Diagnostic avance |
| [docs/PHASE47.md](docs/PHASE47.md) | Agents IA locaux orchestres |
| [docs/LOCAL_AGENTS.md](docs/LOCAL_AGENTS.md) | Guide agents IA locaux |
| [docs/PHASE48.md](docs/PHASE48.md) | Workflows IA visuels locaux |
| [docs/LOCAL_WORKFLOWS.md](docs/LOCAL_WORKFLOWS.md) | Guide workflows IA locaux |
| [docs/WORKSPACE_ISOLATION.md](docs/WORKSPACE_ISOLATION.md) | Isolation complete des donnees par workspace |
| [docs/PHASE49.md](docs/PHASE49.md) | Memoire persistante IA locale |
| [docs/AI_MEMORY.md](docs/AI_MEMORY.md) | Guide memoire IA locale |
| [docs/PHASE33.md](docs/PHASE33.md) | Release locale stable |
| [docs/releases/v0.4.0.md](docs/releases/v0.4.0.md) | Notes de release stable |
| [docs/user/TROUBLESHOOTING.md](docs/user/TROUBLESHOOTING.md) | Depannage utilisateur |

## Release

Version stable : `0.4.0`

Tag propose : `v0.4.0`

Commandes Git preparees :

```powershell
git add README.md CHANGELOG.md ROADMAP.md VERSION package.json package-lock.json frontend/package.json frontend/package-lock.json docs scripts tests
git commit -m "Prepare local stable release v0.4.0"
git tag -a v0.4.0 -m "Sallon-ConnecT local stable release v0.4.0"
```

Ne jamais publier de secret, token SmartThings, chemin personnel, IP complete, fichier `.env`, logs bruts, runtime local ou backup prive.
