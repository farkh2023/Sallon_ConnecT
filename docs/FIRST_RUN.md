# Assistant premier lancement — Sallon-ConnecT v0.4.0

Guide pour la premiere configuration de Sallon-ConnecT sur Windows.

## Presentation

L'assistant premier lancement verifie l'environnement, propose le mode de demarrage adapte et genere un rapport de configuration. Il ne fait rien sans votre accord explicite.

**Aucun cloud. Aucun secret transmis. Aucune elevation admin automatique.**

## Prerequis

| Prerequis | Detail |
|-----------|--------|
| Windows 10 / 11 | PowerShell 5.1 inclus |
| Node.js >= 22.13.0 | Requis avant de lancer le wizard |
| Sallon-ConnecT installe | Chemin projet connu |

## Lancement

### Manuel (recommande pour une premiere utilisation)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\first-run\first-run.ps1
```

Un terminal interactif s'ouvre. L'assistant vous guide etape par etape.

### Depuis le Menu Demarrer (si installe avec Inno Setup)

Menu Demarrer → Sallon-ConnecT → **Assistant premier lancement**

### Via l'installateur Inno Setup

Cocher "Lancer l'assistant de premier lancement apres installation" pendant l'installation.

### Mode automatise (sans interaction)

```powershell
# Portable, sans tray
scripts\windows\first-run\first-run.ps1 -Unattended

# Task Scheduler + tray + ouvrir dashboard
scripts\windows\first-run\first-run.ps1 -Unattended -Mode task-scheduler -EnableTray -OpenDashboard

# NSSM (admin requis)
scripts\windows\first-run\first-run.ps1 -Unattended -Mode nssm
```

## Deroulement du wizard

### Etape 1 — Diagnostic de l'environnement

Le wizard execute `check-environment.ps1` et affiche :

- Version Node.js (bloquant si absent ou trop ancien)
- Disponibilite npm
- Etat des ports 3000 et 3001
- Joignabilite backend / frontend / SSE
- Mode de service actif (NSSM, Task Scheduler ou aucun)
- Etat du tray
- Presence des dossiers `runtime/`, `logs/`, `backups/`

Si Node.js est absent ou trop ancien, le wizard s'arrete et indique la procedure d'installation.

### Etape 2 — Choix du mode de demarrage

```
=== Choix du mode de demarrage ===
  [1] Portable      - Lancer manuellement via start-sallon-connect.ps1
  [2] Task Scheduler - Demarrage automatique sans admin (recommande)
  [3] NSSM           - Service Windows systemique (admin requis)
  [0] Passer         - Configurer plus tard
```

| Mode | Quand l'utiliser |
|------|-----------------|
| Portable | Premier essai, environnement de dev |
| Task Scheduler | Production sans admin, demarrage auto recommande |
| NSSM | Production avec droits admin systeme |

### Etape 3 — Tray (optionnel)

```
Activer le tray (zone de notification Windows) ? [O/N]
```

Si oui : `start-tray.ps1` est appele en arriere-plan. L'icone apparait dans la zone de notification.

### Etape 4 — Rapport et dashboard

Le rapport est sauvegarde dans :
- `runtime/first-run-report.json` — format machine
- `logs/first-run-report.txt` — format lisible

Puis :
```
Ouvrir le dashboard maintenant ? [O/N]
```

Si oui : `http://localhost:3001` s'ouvre dans le navigateur par defaut.

## Diagnostic environnement seul

Pour ne lancer que le diagnostic sans le wizard :

```powershell
# Affichage texte
scripts\windows\first-run\check-environment.ps1

# Format JSON
scripts\windows\first-run\check-environment.ps1 -Json
```

## Statut du premier lancement

```powershell
# Affichage texte
scripts\windows\first-run\first-run-status.ps1

# Format JSON
scripts\windows\first-run\first-run-status.ps1 -Json
```

Retourne : si le wizard a deja ete execute, date, mode choisi, environnement actuel.

## Rapport genere

Le fichier `runtime/first-run-report.json` contient :

```json
{
  "timestamp": "2026-05-22T10:30:00",
  "os": "Microsoft Windows NT 10.0.22631.0",
  "nodeVersion": "22.13.0",
  "mode": "task-scheduler",
  "ports": { "p3000": { "occupied": false }, "p3001": { "occupied": false } },
  "backend": { "reachable": false },
  "frontend": { "reachable": false },
  "service": { "mode": "task-scheduler", "status": "ready" },
  "tray": { "enabled": true },
  "security": { "localOnly": true }
}
```

**Aucun chemin, aucun secret, aucun token dans le rapport.**

## Integration installateur

L'installateur Inno Setup (Phase 35) integre :

| Element | Detail |
|---------|--------|
| Tache `firstrun` | Optionnelle, decochee par defaut |
| Run apres install | Lance `first-run.ps1` si tache cochee |
| Raccourci Menu Demarrer | "Assistant premier lancement" |

## Securite

- Polling sur `localhost` uniquement
- Aucune donnee envoyee vers l'exterieur
- Aucun secret lu ou stocke
- Admin non requis (NSSM bascule en portable si non-admin)
- Le rapport exclut chemins sensibles, tokens et identifiants
- Fichiers rapport exclus du ZIP portable et de l'historique git

## Depannage

### Node.js non detecte

```powershell
node --version
```

Si absent : installer depuis https://nodejs.org/fr/ (LTS 22.x recommande). Redemarrer la session Windows apres installation.

### Le diagnostic signale "Backend non joignable"

Normal avant le premier demarrage. Lancer d'abord :

```powershell
scripts\windows\start-sallon-connect.ps1
```

Puis relancer `check-environment.ps1`.

### Le wizard ne repond plus

Fermer la fenetre PowerShell et relancer :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\first-run\first-run.ps1
```

Le rapport precedent est ecrase si le wizard se termine.

### Rapport introuvable

Si `runtime/first-run-report.json` est absent : le wizard n'a pas ete execute jusqu'a la fin, ou le dossier `runtime/` n'existait pas. Relancer le wizard.

## Limites connues

| Limite | Detail |
|--------|--------|
| Interactif uniquement | Read-Host necessite un vrai terminal |
| NSSM sans admin | Bascule automatique en portable |
| Pas de reinitialisation | Chaque execution du wizard ecrase le rapport |
| Backend non joignable | Normal avant premier demarrage — pas une erreur |
| Windows 10+ | Get-NetTCPConnection non disponible sur Windows 7/8 |
