# Modèle de sécurité — Sallon-ConnecT

## Défense en profondeur

Sallon-ConnecT applique plusieurs couches de protection indépendantes.

```
Couche 1 : .env       — secrets hors code, non commités
Couche 2 : Allowlists — actions autorisées uniquement
Couche 3 : Masquage   — jamais de donnée sensible dans les réponses
Couche 4 : Opt-in     — intégrations désactivées par défaut
Couche 5 : Confirmation — actions destructives bloquées sans code
Couche 6 : Audit      — journal local de toutes les actions sensibles
Couche 7 : Profils    — permissions par utilisateur
Couche 8 : Tests      — vérification automatique des fuites
Couche 9 : Preflight  — audit Git avant publication
```

---

## Couche 1 : Secrets dans .env uniquement

```
.env                    ← jamais commité (gitignore)
.env.example            ← commité, valeurs vides ou exemples
frontend/.env.local     ← jamais commité
frontend/.env.example   ← commité, valeurs vides
```

Variables sensibles :
- `SMARTTHINGS_TOKEN` — token Samsung SmartThings
- `BACKUP_CONFIRMATION_CODE` — code de confirmation restauration

---

## Couche 2 : Allowlists

### Scheduler — actions autorisées
```js
const ALLOWED_ACTIONS = [
  'system.healthCheck', 'devices.refreshStatus', 'dlna.discover',
  'adb.readOnlyDiagnostics', 'media.scanLibrary', 'notifications.cleanup',
  'notifications.summary', 'observability.snapshot', 'scenarios.preview',
  'integrations.statusCheck', 'streaming.libraryStatus',
  'backup.createSafe', 'backup.verifyLatest', 'backup.pruneOld',
];
```

### Scheduler — actions bloquées absolument
```js
const BLOCKED_ACTIONS = [
  'smartthings.scene.execute', 'smartthings.tv.command', 'streaming.play',
  'file.delete', 'file.move', 'adb.pull', 'adb.push',
  'network.aggressiveScan', 'backup.restore', 'backup.includeSecrets',
  'backup.includeRawLogs',
];
```

### Backup — chemins interdits
```
.git/, node_modules/, .env, .env.*, frontend/.env.local,
*.pem, *.key, *.crt, *.p12, logs/*.log/txt/json, dist/*.zip,
*.tmp, *.temp, *.swp, *.bak, Thumbs.db, .DS_Store
```

---

## Couche 3 : Masquage des données sensibles

Toutes les réponses API passent par des fonctions de sanitisation :

| Donnée | Traitement |
|---|---|
| Token authentication | Remplacé par `[masked]` |
| IP complète | Tronquée ou masquée |
| Chemin absolu | `…/derniers/segments` uniquement |
| ID complet | Tronqué à 8–16 caractères + `…` |
| Checksum SHA256 | Tronqué à 16 chars + `…` dans les réponses |
| Clé API | Jamais exposée |

---

## Couche 4 : Opt-in pour les intégrations

| Intégration | Variable | Défaut |
|---|---|---|
| SmartThings | `SMARTTHINGS_ENABLED` | `false` |
| Scènes SmartThings | `SMARTTHINGS_ALLOW_SCENE_EXECUTION` | `false` |
| Commandes TV | `SMARTTHINGS_TV_COMMANDS_ENABLED` | `false` |
| ADB | `ADB_ENABLED` | `false` |
| DLNA | `DLNA_ENABLED` | `false` |
| Streaming | `MEDIA_STREAMING_ENABLED` | `false` |
| Scheduler auto | `SCHEDULER_AUTO_START` | `false` |
| Backup | `BACKUP_ENABLED` | `true` |

---

## Couche 5 : Confirmation explicite

### Restauration backup
```json
{
  "confirmationCode": "CONFIRMER_BACKUP",
  "reason": "Restauration contrôlée"
}
```

Refusé si :
- Code incorrect
- Dry-run non effectué préalablement
- Manifest invalide

---

## Couche 6 : Audit trail local

| Audit | Fichier | Rétention |
|---|---|---|
| Profils | `runtime/profile-audit.json` | 200 entrées max |
| Backup | `runtime/backup-audit.json` | 200 entrées max |
| Scheduler | logs runtime | par exécution |

Les audits sont **non versionnés** et restent sur la machine locale.

---

## Couche 7 : Profils et permissions

| Permission | owner | diagnostic | family | guest | tv |
|---|---|---|---|---|---|
| restoreBackups | ✓ | ✗ | ✗ | ✗ | ✗ |
| createBackups | ✓ | ✓ | ✗ | ✗ | ✗ |
| manageProfiles | ✓ | ✗ | ✗ | ✗ | ✗ |
| runSchedulerManual | ✓ | ✓ | ✗ | ✗ | ✗ |
| executeSmartThingsScenes | opt-in | ✗ | ✗ | ✗ | ✗ |
| viewDevices | ✓ | ✓ | ✓ | ✗ | ✗ |

---

## Couche 8 : Tests de sécurité automatisés

Les tests vérifient automatiquement :
- Absence de token dans les réponses API
- Absence de chemin absolu complet
- Absence de donnée sensible dans les exports observabilité
- Exclusion des chemins interdits du backup
- Refus de restauration sans confirmation

---

## Couche 9 : Preflight GitHub

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1
```

Vérifie avant chaque publication :
- Absence de fichiers sensibles dans le suivi Git
- Scan de contenu sensible dans les fichiers commités
- Présence de tous les fichiers de sécurité requis

---

## Ce qui n'est JAMAIS fait

- Envoi vers un service cloud
- Stockage de mot de passe en clair
- Log de token ou clé
- Inclusion de `.env` réel dans une sauvegarde
- Restauration automatique sans confirmation humaine
- Action destructive sans rollback
