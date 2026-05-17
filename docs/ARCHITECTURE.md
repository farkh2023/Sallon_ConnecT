# Architecture — Sallon-ConnecT

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        Sallon-ConnecT Hub                        │
├──────────────────────────┬──────────────────────────────────────┤
│   Backend Express        │   Frontend Next.js                    │
│   localhost:3000         │   localhost:3001                      │
│                          │                                       │
│   server.js              │   frontend/src/                       │
│   server/src/routes/     │   ├── components/                     │
│   server/src/services/   │   ├── hooks/                          │
│                          │   └── lib/                            │
├──────────────────────────┴──────────────────────────────────────┤
│                     Runtime local (non versionné)                │
│                     runtime/*.json                               │
├─────────────────────────────────────────────────────────────────┤
│                     Données persistantes                         │
│                     data/*.json                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Backend Express (Node.js)

**Fichier principal** : `server.js`
**Port** : 3000

### Routes API

| Préfixe | Module | Description |
|---|---|---|
| `/api/devices` | routes/devices | Appareils du salon |
| `/api/media` | routes/media | Services multimédias |
| `/api/integrations` | routes/integrations | Statut intégrations |
| `/api/scenarios` | routes/scenariosRuntime | Scénarios intelligents |
| `/api/adb` | routes/adb | Diagnostic ADB (lecture seule) |
| `/api/dlna` | routes/dlna | Découverte DLNA/UPnP |
| `/api/smartthings` | routes/smartthings | Samsung TV (opt-in) |
| `/api/streaming` | routes/streaming | Streaming assisté |
| `/api/notifications` | routes/notifications | Notifications locales |
| `/api/scheduler` | routes/scheduler | Scheduler de tâches |
| `/api/observability` | routes/observability | Observabilité et snapshots |
| `/api/profiles` | routes/profiles | Profils utilisateurs |
| `/api/backup` | routes/backup | Sauvegarde/restauration |

### Services

```
server/src/services/
├── notifications/
│   └── notificationEngine.js       # Moteur notifications
├── scheduler/
│   ├── schedulerStore.js           # Stockage tâches
│   ├── schedulerActions.js         # Actions autorisées
│   ├── schedulerSafety.js          # Allowlist actions
│   └── schedulerSeeds.js           # Tâches par défaut
├── observability/
│   ├── snapshotEngine.js           # Capture snapshots
│   └── overviewCollector.js        # Agrégation métriques
├── profiles/
│   ├── profileStore.js             # CRUD profils (chemins lazy)
│   ├── profileEngine.js            # Logique profils + audit
│   ├── profilePermissions.js       # Permissions par type
│   └── profileSafety.js            # Sanitisation
└── backup/
    ├── backupSafety.js             # Chemins interdits, masquage
    ├── backupManifest.js           # Manifest SHA256
    ├── backupEngine.js             # Création ZIP
    ├── backupStore.js              # Gestion fichiers backup
    ├── restoreEngine.js            # Dry-run + restauration
    └── backupAudit.js              # Journal backup
```

## Frontend Next.js

**Répertoire** : `frontend/`
**Port** : 3001
**Framework** : Next.js avec React 19, TypeScript, Tailwind CSS

### Composants principaux

```
frontend/src/components/
├── layout/
│   ├── AppShell.tsx               # Shell principal
│   └── TopNav.tsx                 # Navigation + ProfileSwitcher
├── dashboard/                     # Tableau de bord
├── devices/                       # Appareils
├── media/                         # Médias (ADB, DLNA, SmartThings, Streaming)
├── scenarios/                     # Scénarios
├── notifications/                 # Notifications
├── scheduler/                     # Scheduler
├── observability/
│   └── charts/                    # Graphes Recharts
├── profiles/                      # Profils utilisateurs
├── backup/                        # Sauvegarde locale
└── tv/                            # Mode TV
```

### Hooks

```
frontend/src/hooks/
├── useNotifications.ts
├── useScheduler.ts
├── useObservability.ts
├── useProfiles.ts
└── useBackup.ts
```

## Runtime local

Le dossier `runtime/` contient les fichiers d'état non versionnés :

| Fichier | Description |
|---|---|
| `user-profiles.json` | Profils utilisateurs |
| `active-profile.json` | Profil actif |
| `profile-audit.json` | Audit profils |
| `schedules.json` | Tâches planifiées |
| `notifications.json` | Notifications |
| `observability-snapshots.json` | Historique snapshots |
| `backup-audit.json` | Audit sauvegardes |

## PWA

- Manifest PWA : `frontend/public/manifest.webmanifest`
- Service Worker : `frontend/public/sw.js`
- Mode offline : page dédiée `/offline`
- Installation possible sur Windows/Android

## Mode TV

- Composant `TvDashboard` — interface plein écran optimisée
- Activé via profil `tv` ou hook `useTvMode`
- Désactivé en mode guest/TV par permissions profil

## Scheduler

- Actions autorisées : allowlist dans `schedulerSafety.js`
- Actions bloquées absolument : restauration backup, push ADB, etc.
- Tâches par défaut : snapshot observabilité, sauvegarde hebdo (désactivées)
- Exécution manuelle uniquement par défaut (`SCHEDULER_AUTO_START=false`)

## Backup

- Format : ZIP avec `backup-manifest.json` SHA256 intégré
- Collecte : fichiers source contrôlés, runtime sûr optionnel
- Exclusions : `.env`, `node_modules`, `.git`, clés, logs bruts
- Restauration : dry-run requis → confirmation explicite → rollback créé

## Sécurité

Voir [docs/SECURITY_MODEL.md](./SECURITY_MODEL.md) pour le détail.

## Tests

```
tests/
├── backend/          # Jest + supertest (94 tests)
├── frontend/         # Vitest + @testing-library/react (46 tests)
├── packaging/        # Test ZIP portable
├── windows/          # Validation syntaxe PowerShell
└── helpers/          # Utilitaires partagés (sensitive, runtimeTestUtils)
```

## CI/CD

GitHub Actions sur Windows latest, Node 22.x.
Workflow : `.github/workflows/tests.yml`
