# Phase 35 — Installateur Windows autonome

## Objectif

Créer un installateur Windows professionnel (`.exe`) pour Sallon-ConnecT v0.4.0 basé sur Inno Setup 6, sans casser le ZIP portable existant et sans embarquer de secrets.

## Contexte

| Critère | Valeur |
|---------|--------|
| Version | 0.4.0 |
| Base | Phase 34 — installation guidée validée |
| Outil | Inno Setup 6 (ISCC) |
| Admin requis | Non (`PrivilegesRequired=lowest`) |
| Dossier cible | `%LOCALAPPDATA%\Sallon-ConnecT` |
| Local-only | Oui — aucune connexion cloud |

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `scripts/windows/installer/Sallon-ConnecT.iss` | Script Inno Setup — source de l'installateur |
| `scripts/windows/installer/build-installer.ps1` | Compile le `.iss` et génère le `.exe` dans `dist/` |
| `scripts/windows/installer/verify-installer.ps1` | Vérifie l'artefact : SHA256, taille, checksum |
| `scripts/windows/installer/uninstall-check.ps1` | Contrôle les résidus après désinstallation |
| `docs/PHASE35.md` | Ce document |
| `docs/INSTALLER_WINDOWS.md` | Guide technique installateur |

## Raccourcis créés par l'installateur

| Raccourci | Cible |
|-----------|-------|
| Démarrer Sallon-ConnecT | `scripts\windows\start-sallon-connect.bat` |
| Arrêter Sallon-ConnecT | `scripts\windows\stop-sallon-connect.bat` |
| Vérifier Sallon-ConnecT | `scripts\windows\status-sallon-connect.bat` |
| Désinstaller | Désinstallateur Inno Setup |

## Exclusions de sécurité (embarquées dans le .iss)

- `.env`, `.env.local`, `.env.production`
- `secrets.json`, `config.local.json`
- `*.pem`, `*.key`, `*.p12`, `*.crt`
- `node_modules/`, `frontend/node_modules/`, `frontend/.next/`
- `dist/`, `logs/`, `.git/`, `coverage/`, `tests/`, `__tests__/`
- `runtime/*.json`, `backups/*.zip`, `backups/*.json`

## Prérequis Inno Setup

Inno Setup n'est pas installé par défaut sur Windows. Le script `build-installer.ps1` le détecte et guide l'installation si absent.

Installation rapide :
```powershell
winget install JRSoftware.InnoSetup
```

Puis :
```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\build-installer.ps1
```

## Déroulement de l'installation (côté utilisateur)

1. Lancer `Sallon-ConnecT-Setup-0.4.0.exe`.
2. L'installateur vérifie Node.js. Si absent → message d'erreur clair + lien nodejs.org.
3. Choisir le dossier d'installation (défaut : `%LOCALAPPDATA%\Sallon-ConnecT`).
4. Choisir les raccourcis (Menu Démarrer cochée, Bureau décochée par défaut).
5. Inno Setup copie les fichiers source.
6. Post-install : `npm install` + `npm run build:frontend` (quelques minutes).
7. `.env` créé depuis `.env.example` si absent.
8. `frontend/.env.local` créé depuis `frontend/.env.example` si absent.
9. Raccourcis créés.
10. Option : lancer Sallon-ConnecT immédiatement.

## Validations effectuées

- Lint : `pnpm lint`
- Tests complets : `pnpm test`
- Build frontend : `pnpm build`
- Tests backend : `pnpm test:backend`
- Tests Windows : `pnpm test:windows`
- Release ZIP : `pnpm release:build`
- Aucune régression sur le ZIP portable.

## Limites connues

| Limite | Détail |
|--------|--------|
| Inno Setup requis | `winget install JRSoftware.InnoSetup` avant build |
| Node.js requis sur la machine cible | L'installateur vérifie sa présence mais ne l'installe pas |
| npm install post-install | Peut durer 2–5 minutes selon la connexion réseau |
| Build frontend post-install | Requiert 1–2 minutes supplémentaires |
| Pas de signature de code | L'installateur n'est pas signé — SmartScreen peut avertir |
| Données utilisateur conservées | logs/, runtime/, backups/ ne sont pas supprimés à la désinstallation |
| Architecture 64-bit uniquement | Configuré pour `x64compatible` |
| Windows 10 1809 minimum | `MinVersion=10.0.17763` |

## Compatibilité ZIP portable

L'installateur Phase 35 est complémentaire au ZIP portable Phase 34. Les deux coexistent :

- `dist/Sallon-ConnecT-Portable-*.zip` — ZIP portable (Phase 34)
- `dist/Sallon-ConnecT-Setup-0.4.0.exe` — Installateur (Phase 35)
