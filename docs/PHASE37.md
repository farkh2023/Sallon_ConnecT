# Phase 37 — Interface Tray Windows + controle rapide

## Objectif

Ajouter une icone dans la zone de notification Windows (system tray) pour contrôler Sallon-ConnecT sans ouvrir de terminal, avec statut visuel et notifications locales.

## Contexte

| Critère | Valeur |
|---------|--------|
| Version | 0.4.0 |
| Base | Phase 36 — service Windows validé |
| Technique | PowerShell 5.1 + Windows Forms NotifyIcon |
| Electron | Non utilisé |
| Admin requis | Non |
| Local-only | Oui |

## Choix technique : PowerShell + Windows Forms

| Option | Verdict |
|--------|---------|
| PowerShell + `NotifyIcon` | **Choisi** — zéro dépendance, natif Windows 10/11, cohérent avec le projet |
| Node.js + `node-systray` | Écarté — ajoute une dépendance npm externe |
| Electron | Écarté — trop lourd (80+ MB) pour un tray |
| Python + `pystray` | Écarté — Python absent du projet |

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `scripts/windows/tray/Sallon-ConnecT-Tray.ps1` | Application tray principale (boucle message Windows) |
| `scripts/windows/tray/start-tray.ps1` | Lance le tray en arrière-plan (processus caché) |
| `scripts/windows/tray/stop-tray.ps1` | Arrête le tray proprement |
| `scripts/windows/tray/tray-status.ps1` | Vérifie si le tray est actif (PID, mémoire) |
| `scripts/windows/tray/README.md` | Guide rapide |
| `docs/PHASE37.md` | Ce document |
| `docs/WINDOWS_TRAY.md` | Guide technique complet |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `scripts/windows/installer/Sallon-ConnecT.iss` | Task `trayicon`, raccourci Menu Démarrer, Run/UninstallRun |
| `docs/INDEX.md` | Liens Phase 37 et WINDOWS_TRAY.md |

## Menu tray implémenté

| Item | Action |
|------|--------|
| **En-tête statut** (grisé) | Affiche l'état courant |
| Ouvrir Sallon-ConnecT (gras) | `http://localhost:3001` |
| Démarrer le backend | `start-service.ps1` (caché) |
| Arrêter le backend | `stop-service.ps1` (caché) |
| Redémarrer le backend | `restart-service.ps1` (caché) |
| Statut détaillé... | `service-status.ps1` (fenêtre visible) |
| Ouvrir les logs | Explorateur → `logs/` |
| Documentation | Explorateur → `docs/` |
| Quitter le tray | Ferme l'icône (backend continue) |

Double-clic gauche → ouvre `http://localhost:3001`.

## Statut et icônes

| État | Icône système | Tooltip |
|------|--------------|---------|
| En ligne | Information (bleu) | Sallon-ConnecT - En ligne |
| Arrêté | Avertissement (jaune) | Sallon-ConnecT - Arrete |
| Dégradé | Erreur (rouge) | Sallon-ConnecT - Degrade |
| Vérification | Application | Sallon-ConnecT (verification...) |

Polling : `GET /api/health` toutes les 5 secondes.

## Notifications Windows locales

| Événement | Type | Throttle |
|-----------|------|---------|
| Backend démarré | Info | 60s |
| Backend arrêté | Warning | 60s |
| Backend dégradé | Warning | 60s |

Aucune notification cloud. Aucun push externe.

## Intégration service (Phase 36)

Le tray appelle les scripts service existants :
- `scripts/windows/service/start-service.ps1`
- `scripts/windows/service/stop-service.ps1`
- `scripts/windows/service/restart-service.ps1`
- `scripts/windows/service/service-status.ps1`

Compatible : NSSM, Task Scheduler, mode portable sans service.

## Intégration installateur (Phase 35)

Option dans Inno Setup : **"Tray Sallon-ConnecT (zone de notification)"**
- Décochée par défaut (facultatif)
- Si cochée : lance `start-tray.ps1` à la fin de l'installation
- Raccourci Menu Démarrer **Tray Sallon-ConnecT** créé systématiquement
- Arrêt tray ajouté dans `[UninstallRun]`

## Validations

| Validation | Résultat |
|------------|---------|
| `pnpm lint` | OK |
| `pnpm test` | 228/228 frontend + 114/114 backend |
| `pnpm build` | OK |
| `pnpm test:backend` | 114/114 |
| `pnpm test:windows` | 31/31 scripts valides |
| `pnpm release:build` | ZIP portable intact |
| `start-tray.ps1` | Tray lancé en processus caché |
| `tray-status.ps1` | PID et mémoire détectés |
| `stop-tray.ps1` | Tray arrêté proprement |

## Limites connues

| Limite | Détail |
|--------|--------|
| Icônes système génériques | Pas d'icône custom `.ico` — utilise les icônes système Windows |
| Polling 5s | Health check toutes les 5s — léger délai visuel |
| Tray non persistant | Si Windows redémarre sans service auto, relancer manuellement |
| Frontend non contrôlé | Le tray gère le backend seulement ; le frontend reste externe |
| Pas de mise à jour du menu en temps réel | Le menu se met à jour seulement au prochain polling |
| Throttle 60s | Notifications limitées à 1 par minute par type |
