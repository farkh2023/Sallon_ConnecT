# Phase 36 — Service Windows + démarrage automatique

## Objectif

Permettre à Sallon-ConnecT de fonctionner comme un service Windows local avec démarrage automatique, redémarrage sur crash, supervision minimale et compatibilité avec l'installateur Phase 35.

## Contexte

| Critère | Valeur |
|---------|--------|
| Version | 0.4.0 |
| Base | Phase 35 — installateur Inno Setup |
| Solution primaire | NSSM (admin requis) |
| Solution alternative | Task Scheduler (sans admin) |
| Composant en service | Backend uniquement (port 3000) |
| Frontend | Démarré à la demande |
| Local-only | Oui — aucun cloud |

## Architecture retenue

### Backend only comme service

Le **backend Node.js** (`server.js`, port 3000) tourne comme service.  
Le **frontend Next.js** (port 3001) démarre à la demande via les raccourcis existants.

**Pourquoi :**
- Le serveur de dev Next.js n'est pas conçu pour un service persistant
- Le backend est le composant stateful (notifications, scheduler, données)
- Le frontend démarre en < 3 secondes depuis le cache `.next/`

### Deux modes supportés

| Mode | Prérequis | Auto-démarrage | Redémarrage crash |
|------|-----------|---------------|-------------------|
| NSSM | Admin + NSSM installé | Au boot Windows | Oui (NSSM natif) |
| Task Scheduler | Aucun (utilisateur standard) | À l'ouverture de session | Oui (3 tentatives) |

## Fichiers créés

| Fichier | Rôle |
|---------|------|
| `scripts/windows/service/install-service.ps1` | Installe le service (NSSM ou Task Scheduler) |
| `scripts/windows/service/start-service.ps1` | Démarre le service |
| `scripts/windows/service/stop-service.ps1` | Arrêt propre |
| `scripts/windows/service/restart-service.ps1` | Redémarre |
| `scripts/windows/service/remove-service.ps1` | Supprime avec confirmation |
| `scripts/windows/service/service-status.ps1` | Statut complet (mode, uptime, PID, health) |

## Fichiers modifiés

| Fichier | Modification |
|---------|-------------|
| `server/src/routes/diagnostics.js` | Nouvel endpoint `GET /api/diagnostics/service` |
| `scripts/windows/installer/Sallon-ConnecT.iss` | Option service Task Scheduler dans `[Tasks]`/`[Run]` |
| `docs/INDEX.md` | Liens Phase 36 et WINDOWS_SERVICE.md |
| `docs/RELEASE_CHECKLIST.md` | Section Phase 36 |

## Endpoint diagnostics service

`GET /api/diagnostics/service` retourne :
```json
{
  "timestamp": "2026-05-22T03:00:00.000Z",
  "name": "SallonConnecT",
  "mode": "nssm|task-scheduler|standalone",
  "status": "running|stopped|degraded",
  "uptime": 3600,
  "pid": 1234,
  "nodeVersion": "v22.11.0",
  "lastStart": null,
  "restartCount": null,
  "localOnly": true
}
```

## Watchdog et redémarrage automatique

**NSSM :**
- `AppThrottle = 10000` ms (délai 10s avant redémarrage)
- `AppRestartDelay = 5000` ms (attente 5s)
- `AppExit Default Restart` — redémarrage sur tout code de sortie non nul

**Task Scheduler :**
- `RestartCount = 3`
- `RestartInterval = 1 minute`

## Intégration installateur (Phase 35)

L'option « Service Windows » dans l'installateur Inno Setup :
- Cochée → `install-service.ps1 -UseTaskScheduler` s'exécute post-install (sans admin)
- Décochée → l'utilisateur lance manuellement `install-service.ps1` quand il le souhaite

Pour NSSM (admin), l'installation se fait manuellement après l'installateur :
```powershell
# Depuis un terminal administrateur :
powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1
```

## Sécurité

- Service écoute uniquement sur `localhost:3000` — pas d'exposition réseau
- SSE limité à `localhost:3000` et `localhost:3001` (inchangé)
- Aucun secret dans les scripts service
- Logs service : `logs/service-stdout.log`, `logs/service-stderr.log` (locaux, non synchronisés)
- Compte service : `LocalSystem` (NSSM) ou compte courant (Task Scheduler)
- Arrêt propre avant suppression — `remove-service.ps1` arrête avant de supprimer

## Validations effectuées

| Validation | Résultat |
|------------|---------|
| `pnpm lint` | ✅ OK |
| `pnpm test` (frontend 228/228 + backend 114/114) | ✅ OK |
| `pnpm build` | ✅ OK |
| `pnpm test:backend` | ✅ 114/114 |
| `pnpm test:windows` | ✅ 27/27 scripts PowerShell valides |
| `pnpm release:build` | ✅ ZIP portable intact |
| `install-service.ps1` (dry-run) | ✅ Détection NSSM absent → instructions |
| `service-status.ps1` | ✅ Mode standalone détecté |

## Limites connues

| Limite | Détail |
|--------|--------|
| NSSM requis pour service vrai | `choco install nssm` ou téléchargement manuel |
| Admin requis pour NSSM | Task Scheduler est l'alternative sans admin |
| Task Scheduler = logon seulement | Pas de démarrage avant logon sans admin |
| Frontend non en service | Démarré séparément via raccourcis |
| Restart count limité | Comptage via Event Log Windows (peut être incomplet) |
| Pas de notification push on-crash | Local-only — les logs sont la source de vérité |
