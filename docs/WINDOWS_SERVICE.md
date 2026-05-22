# Service Windows — Sallon-ConnecT v0.4.0

Guide technique du service Windows pour le démarrage automatique du backend.

## Présentation

Sallon-ConnecT peut fonctionner comme un service Windows pour démarrer automatiquement sans intervention utilisateur. Deux modes sont disponibles :

| Mode | Prérequis | Démarrage | Redémarrage crash |
|------|-----------|-----------|-------------------|
| **NSSM** (recommandé) | Admin + NSSM | Au boot Windows | Oui (automatique) |
| **Task Scheduler** | Aucun | À l'ouverture de session | Oui (3 tentatives) |

**Seul le backend** (port 3000) tourne comme service. Le frontend (port 3001) se lance séparément via les raccourcis.

## Prérequis

| Outil | Mode | Installation |
|-------|------|-------------|
| Node.js ≥ 22.13.0 | Obligatoire | https://nodejs.org/fr/ |
| NSSM | Mode NSSM uniquement | `choco install nssm` |
| Droits admin | Mode NSSM uniquement | Session administrateur |

## Installation du service

### Option 1 — Task Scheduler (sans admin, recommandé)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1 -UseTaskScheduler
```

Démarrage automatique à chaque ouverture de session Windows.

### Option 2 — NSSM (service système, démarrage au boot)

**Étape 1 : Installer NSSM**

```powershell
# Via Chocolatey :
choco install nssm

# Via winget :
winget install NSSM.NSSM

# Manuel : https://nssm.cc/download
# Extraire nssm.exe dans : C:\Program Files\NSSM\
```

**Étape 2 : Installer le service (terminal administrateur)**

```powershell
# Lancer PowerShell en administrateur, puis :
powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1
```

Le script configure automatiquement :
- Démarrage automatique au boot
- Redémarrage sur crash (délai 10s, 3 fois par heure)
- Redirection des logs vers `logs/service-stdout.log` et `logs/service-stderr.log`

### Option 3 — Via l'installateur Inno Setup (Phase 35)

Lors de l'installation, cocher « Démarrage automatique via Task Scheduler ». L'installateur configure le service Task Scheduler sans admin.

## Gestion du service

### Démarrer

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\start-service.ps1
```

### Arrêter

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\stop-service.ps1
```

### Redémarrer

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\restart-service.ps1
```

### Statut

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\service-status.ps1
```

Affiche : mode, statut, PID, uptime, dernier démarrage, santé HTTP `/api/health`.

Format JSON (pour intégration) :
```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\service-status.ps1 -Json
```

### Supprimer le service

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\remove-service.ps1
```

Demande confirmation. Arrête le service avant de le supprimer. Les données (`.env`, `logs/`, `runtime/`, `backups/`) sont conservées.

## Endpoint API diagnostics

Le backend expose le statut du service via l'API :

```
GET http://localhost:3000/api/diagnostics/service
```

Réponse :
```json
{
  "timestamp": "2026-05-22T03:00:00.000Z",
  "name": "SallonConnecT",
  "mode": "nssm",
  "status": "running",
  "uptime": 3600,
  "pid": 4832,
  "nodeVersion": "v22.11.0",
  "lastStart": null,
  "restartCount": null,
  "localOnly": true
}
```

Valeurs de `mode` :
- `nssm` — service Windows via NSSM
- `task-scheduler` — tâche planifiée Windows
- `standalone` — lancé manuellement (pas de service configuré)

Valeurs de `status` :
- `running` — en cours d'exécution et répond sur `/api/health`
- `stopped` — arrêté
- `degraded` — processus actif mais `/api/health` ne répond pas

## Logs service

| Fichier | Contenu |
|---------|---------|
| `logs/service-stdout.log` | Sortie standard Node.js (NSSM seulement) |
| `logs/service-stderr.log` | Erreurs Node.js (NSSM seulement) |

Ces fichiers sont créés uniquement en mode NSSM. En mode Task Scheduler, utiliser le Gestionnaire des tâches Windows ou les journaux d'événements Windows.

## Frontend : démarrage séparé

Le frontend (Next.js, port 3001) ne tourne pas comme service. Il se lance via :

```powershell
scripts\windows\start-sallon-connect.bat
```

Ou via le raccourci Menu Démarrer « Démarrer Sallon-ConnecT ».

Pour un usage "tout automatique" : configurer un raccourci dans le dossier Démarrage utilisateur (`%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`) pointant vers `start-sallon-connect.bat`.

## Sécurité

- Le service écoute uniquement sur `localhost:3000`
- SSE limité à `localhost:3000` et `localhost:3001`
- Aucun secret dans les scripts service
- Les logs de service ne contiennent pas de tokens ni de données sensibles
- L'arrêt est propre avant toute suppression
- Compte NSSM : `LocalSystem` (accès aux fichiers locaux de l'utilisateur)

## Dépannage

### Le service ne démarre pas

```powershell
# Vérifier statut complet
powershell -ExecutionPolicy Bypass -File scripts\windows\service\service-status.ps1

# Vérifier les logs
notepad logs\service-stderr.log

# Vérifier Node.js
node --version
```

### Port 3000 déjà occupé

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\status-sallon-connect.ps1
powershell -ExecutionPolicy Bypass -File scripts\windows\service\stop-service.ps1
```

### NSSM : "Accès refusé"

Lancer PowerShell en tant qu'administrateur. NSSM requiert des droits admin pour installer/supprimer un service.

### Task Scheduler : la tâche ne démarre pas

```powershell
# Vérifier dans le Gestionnaire des tâches Windows
Get-ScheduledTask -TaskName SallonConnecT
Get-ScheduledTaskInfo -TaskName SallonConnecT
```

### Supprimer et réinstaller

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\service\remove-service.ps1 -Force
powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1 -UseTaskScheduler
```

## Compatibilité

| Composant | Compatibilité |
|-----------|--------------|
| ZIP portable (Phase 34) | ✅ Non impacté |
| Installateur Inno Setup (Phase 35) | ✅ Option service intégrée |
| Installation guidée (Phase 25) | ✅ Scripts service complémentaires |
| local-only | ✅ Aucune connexion cloud |
