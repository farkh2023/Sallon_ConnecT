# Phase 38 — Assistant premier lancement

## Objectif

Guider l'utilisateur lors de la premiere utilisation de Sallon-ConnecT : verifier l'environnement local, proposer les modes de demarrage disponibles (portable, service, tray) et generer un rapport de configuration initial.

## Contexte

| Critere | Valeur |
|---------|--------|
| Version | 0.4.0 |
| Base | Phase 37 — tray Windows valide |
| Technique | PowerShell 5.1 interactif |
| Admin requis | Non (sauf NSSM) |
| Local-only | Oui |

## Fichiers crees

| Fichier | Role |
|---------|------|
| `scripts/windows/first-run/check-environment.ps1` | Diagnostic complet de l'environnement (JSON ou texte) |
| `scripts/windows/first-run/first-run.ps1` | Wizard interactif de premier lancement |
| `scripts/windows/first-run/first-run-status.ps1` | Statut du premier lancement (rapport + env actuel) |
| `docs/PHASE38.md` | Ce document |
| `docs/FIRST_RUN.md` | Guide technique complet |

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `scripts/windows/installer/Sallon-ConnecT.iss` | Tache `firstrun`, raccourci Menu Demarrer, Run entry |
| `docs/INDEX.md` | Liens Phase 38 et FIRST_RUN.md |
| `CHANGELOG.md` | Entree Phase 38 |
| `ROADMAP.md` | Phase 38 marquee Fait |
| `docs/RELEASE_CHECKLIST.md` | Section 15 Phase 38 |

## Verifications effectuees par check-environment.ps1

| Check | Detail |
|-------|--------|
| Node.js installe | Detecte via `node.exe --version` |
| Version Node >= 22.13.0 | Comparaison majeur/mineur |
| npm disponible | `npm.cmd` ou `npm` dans PATH |
| Port 3000 | Libre ou occupe (PID, nom processus) |
| Port 3001 | Libre ou occupe (PID, nom processus) |
| Backend joignable | `GET /api/health` (HTTP 200) |
| Frontend joignable | `GET http://localhost:3001` (HTTP 200) |
| SSE local | `GET /api/events/client-count` (HTTP 200) |
| Service Windows | NSSM ou Task Scheduler detecte |
| Tray | PID file dans `%TEMP%` |
| Dossiers | `runtime/`, `logs/`, `backups/` presents |
| Admin | Droits admin courants |
| LocalOnly | Toujours true |

## Modes proposes par first-run.ps1

| Mode | Commande appliquee | Admin requis |
|------|--------------------|--------------|
| Portable | Aucune — lancer manuellement | Non |
| Task Scheduler | `install-service.ps1 -UseTaskScheduler -Unattended` | Non |
| NSSM | `install-service.ps1 -Unattended` | Oui |
| Tray | `start-tray.ps1` (arriere-plan) | Non |

## Rapport genere

| Fichier | Contenu |
|---------|---------|
| `runtime/first-run-report.json` | JSON structure (exclu du ZIP) |
| `logs/first-run-report.txt` | Texte lisible (exclu du ZIP) |

Champs du rapport :
- `timestamp`, `os`, `nodeVersion`, `mode`
- `ports.p3000.occupied`, `ports.p3001.occupied`
- `backend.reachable`, `frontend.reachable`
- `service.mode`, `service.status`
- `tray.enabled`
- `security.localOnly = true`

Aucun chemin sensible, aucun secret, aucun token.

## Integration installateur (Phase 35)

Option dans Inno Setup : **"Lancer l'assistant de premier lancement apres installation"**
- Cochable pendant l'installation (decochee par defaut)
- Si cochee : lance `first-run.ps1` dans un terminal visible apres installation
- Raccourci Menu Demarrer **Assistant premier lancement** cree systematiquement

## Securite

- Aucun cloud
- Aucune donnee transmise vers l'exterieur
- Aucun secret dans le rapport
- Aucune elevation admin automatique (NSSM : informe l'utilisateur et bascule en portable)
- Aucune action silencieuse non demandee

## Validations

| Validation | Resultat |
|------------|---------|
| `pnpm lint` | OK |
| `pnpm test` | 228/228 frontend |
| `pnpm test:backend` | 114/114 backend |
| `pnpm build` | OK |
| `pnpm test:windows` | 34/34 scripts valides |
| `pnpm release:build` | ZIP portable intact |

## Limites connues

| Limite | Detail |
|--------|--------|
| Interactif uniquement | `Read-Host` necessite un vrai terminal (non headless) |
| NSSM sans admin | Bascule automatique en portable, pas d'erreur bloquante |
| Pas de reinitialisation | Relancer first-run.ps1 ecrase le rapport precedent |
| Backend non demarre | check-environment signale "non joignable" — normal avant premier demarrage |
| Windows 10+ uniquement | Get-NetTCPConnection requiert Windows 10 minimum |
