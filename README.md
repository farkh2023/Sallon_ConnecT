# Sallon-ConnecT

[![Tests](https://github.com/farkh2023/Sallon-ConnecT/actions/workflows/tests.yml/badge.svg)](https://github.com/farkh2023/Sallon-ConnecT/actions/workflows/tests.yml)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](VERSION)
[![Node](https://img.shields.io/badge/node-%3E%3D22.13-brightgreen)](https://nodejs.org/)
[![Local First](https://img.shields.io/badge/cloud-none-lightgrey)](docs/SECURITY_MODEL.md)

Sallon-ConnecT est un hub local pour piloter et observer les appareils, services multimedia, scenarios, profils et sauvegardes d'un salon connecte.

Le projet est local-first : aucune telemetrie, aucun cloud obligatoire, aucun secret dans Git.

## Fonctionnalites Principales

| Domaine | Capacites |
|---|---|
| Backend Express | API locale, health check, routes modulaires |
| Frontend Next.js | Dashboard, PWA, mode TV, profils, observabilite |
| Appareils | Statuts locaux, diagnostics, integrations opt-in |
| ADB | Diagnostic Android en lecture seule |
| DLNA | Decouverte passive et streaming assiste |
| SmartThings | TV Samsung opt-in, confirmations et allowlists |
| Scenarios | Cinema, travail, famille, veille et diagnostic |
| Scheduler | Taches locales autorisees par allowlist |
| Notifications | Centre de notifications local avec masquage |
| Observability | Health, runtime, logs, snapshots, graphes |
| Profils | Owner, family, guest, TV, diagnostic |
| Backup / restore | ZIP local, manifest SHA256, dry-run et rollback |
| Packaging Windows | Installation guidee, scripts de lancement, diagnostic et ZIP portable |

## Architecture Rapide

```text
Sallon-ConnecT/
  server.js                  Backend Express - port 3000
  server/src/routes/         Modules API
  server/src/services/       Logique metier locale
  frontend/                  Application Next.js - port 3001
  data/                      Donnees exemple versionnees
  runtime/                   Etat local ignore par Git
  backups/                   Sauvegardes locales ignorees par Git
  logs/                      Rapports locaux ignores par Git
  scripts/windows/           Utilitaires Windows
  scripts/windows/install/   Installateur local guide
  scripts/release/           Preflight et preparation release
```

Details : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Demarrage Rapide Windows

Prerequis : Node.js 22.13 ou plus recent, npm, Git et PowerShell.

```powershell
git clone https://github.com/farkh2023/Sallon-ConnecT.git
cd Sallon-ConnecT

copy .env.example .env
npm install
cd frontend
npm install
cd ..
```

Lancement complet :

```powershell
npm run dev
```

Lancement separe :

```powershell
npm run dev:backend
npm run dev:frontend
```

URLs locales :

| Service | URL |
|---|---|
| Backend | http://localhost:3000 |
| Frontend | http://localhost:3001 |

Guide complet : [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

## Installation Windows guidee

La Phase 25 ajoute un installateur local guide. Il ne cree pas encore de MSI, ne demande pas de droits administrateur par defaut et ne remplace pas les fichiers `.env` existants.

```powershell
scripts\windows\install\install-sallon-connect.bat
scripts\windows\install\first-run-wizard.bat
scripts\windows\install\repair-sallon-connect.bat
scripts\windows\install\uninstall-sallon-connect.bat
```

Guide : [docs/user/INSTALLER_WINDOWS_GUIDE.md](docs/user/INSTALLER_WINDOWS_GUIDE.md).

## Scripts Utiles

| Script | Role |
|---|---|
| `npm run dev` | Lance backend et frontend |
| `npm run dev:backend` | Lance Express uniquement |
| `npm run dev:frontend` | Lance Next.js sur le port 3001 |
| `npm run health` | Verifie les endpoints locaux si le backend est actif |
| `npm run lint` | Lint frontend |
| `npm run test:backend` | Tests Jest backend |
| `npm run test:frontend` | Tests Vitest frontend |
| `npm run test:packaging` | Validation ZIP portable |
| `npm run test:windows` | Validation syntaxe PowerShell |
| `npm run build:frontend` | Build Next.js |
| `npm run check:docs` | Verifie les liens locaux de documentation |
| `npm run check` | Documentation, lint, tests, packaging, PowerShell et build |
| `scripts\windows\install\install-sallon-connect.bat` | Installation Windows guidee |
| `scripts\windows\install\repair-sallon-connect.bat` | Reparation locale conservative |

## Commandes De Test

```powershell
npm run check
npm run test:backend
npm run test:frontend
npm run test:packaging
npm run test:windows
npm run build:frontend
npm run check:docs
npm run health
```

`npm run health` est non bloquant pour la release si le backend n'est pas lance, a condition que `npm run check` passe.

## Securite

Principes :

- Secrets uniquement dans `.env` local.
- `.env`, `frontend/.env.local`, `runtime/*.json`, `backups/*.zip`, `logs/*.json`, `logs/*.txt`, `logs/*.log`, `node_modules` et `.next` sont ignores.
- SmartThings, ADB, DLNA et streaming sont opt-in.
- Les actions sensibles utilisent confirmations, allowlists et audits locaux.
- Les sauvegardes excluent secrets, dependances, logs bruts et builds.
- Les reponses API masquent les valeurs sensibles.

Avant publication :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1
powershell -ExecutionPolicy Bypass -File scripts\release\prepare-release.ps1
```

Details : [SECURITY.md](SECURITY.md) et [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md).

## Phases Realisees

| Phase | Statut |
|---|---|
| 1-4 | Prototype, backend Express, donnees locales, multimedia |
| 5-11 | Scenarios, ADB, DLNA, SmartThings, TV, streaming assiste |
| 12-15 | Notifications, scheduler, frontend Next.js, PWA, mode TV |
| 16-19 | Packaging Windows, tests, observability, snapshots, graphes |
| 20-21B | Profils locaux, sauvegarde/restauration, isolation runtime tests |
| 22-24 | Documentation GitHub, documentation utilisateur finale, assistant vocal local |
| 25 | Installateur Windows local guide |

## Documentation

| Document | Role |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | Index complet utilisateur et technique |
| [CHANGELOG.md](CHANGELOG.md) | Historique v0.1.0 |
| [ROADMAP.md](ROADMAP.md) | Phases 23+ |
| [SECURITY.md](SECURITY.md) | Politique de securite |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution et conventions |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture technique |
| [docs/SECURITY_MODEL.md](docs/SECURITY_MODEL.md) | Defense en profondeur |
| [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md) | Installation locale |
| [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) | Checklist release |
| [docs/VERSIONING.md](docs/VERSIONING.md) | SemVer et tags |

## Documentation utilisateur

| Guide | Role |
|---|---|
| [Quick Start Windows](docs/user/QUICK_START_WINDOWS.md) | Installer, lancer, ouvrir, arreter et packager |
| [User Guide](docs/user/USER_GUIDE.md) | Comprendre les sections du dashboard |
| [Mode TV](docs/user/TV_MODE_GUIDE.md) | Utiliser le mode TV et les raccourcis |
| [Assistant vocal](docs/user/VOICE_ASSISTANT_GUIDE.md) | Commandes vocales locales et fallback texte |
| [Installateur Windows](docs/user/INSTALLER_WINDOWS_GUIDE.md) | Installation guidee, reparation et desinstallation douce |
| [PWA](docs/user/PWA_INSTALL_GUIDE.md) | Installer depuis Chrome ou Edge |
| [Backup / Restore](docs/user/BACKUP_RESTORE_GUIDE.md) | Sauvegarder, verifier, dry-run et restaurer |
| [Profils](docs/user/PROFILES_GUIDE.md) | Changer de profil et comprendre les permissions |
| [Notifications](docs/user/NOTIFICATIONS_GUIDE.md) | Lire, filtrer et nettoyer les notifications |
| [Scheduler](docs/user/SCHEDULER_GUIDE.md) | Utiliser les taches locales sures |
| [Observabilite](docs/user/OBSERVABILITY_GUIDE.md) | Lire les indicateurs, snapshots et exports |
| [Troubleshooting](docs/user/TROUBLESHOOTING.md) | Resoudre les problemes courants |
| [FAQ](docs/user/FAQ.md) | Reponses rapides |

## Release v0.1.0

La version v0.1.0 est le premier prototype local complet de Sallon-ConnecT.

**Notes de release :** [docs/releases/v0.1.0.md](docs/releases/v0.1.0.md)

**Artefacts de distribution :**

| Artefact | Emplacement |
|---|---|
| ZIP portable Windows | `dist/Sallon-ConnecT-Portable-*.zip` |
| Checksums SHA256 | `dist/Sallon-ConnecT-v0.1.0-checksums.txt` |

Les artefacts `dist/` sont locaux et ne sont pas inclus dans Git.

Les fichiers `.env`, `frontend/.env.local`, `runtime/*.json`, `logs/` et `node_modules` ne sont jamais inclus dans le ZIP ni dans Git.

**Preparation de la release :**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\build-release-artifacts.ps1
powershell -ExecutionPolicy Bypass -File scripts\release\final-release-check.ps1
```

## Avertissement Donnees Sensibles

Ne jamais publier de secret, token SmartThings, identifiant materiel reel, numero personnel, chemin personnel, IP complete ou fichier runtime local. Le depot doit rester reproductible a partir des fichiers exemples et des installations npm.
