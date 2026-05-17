# Phase 21 — Sauvegarde locale sécurisée

## Objectif

Ajouter un système complet de sauvegarde et restauration locale, 100% offline, sans aucune donnée sensible exposée.

## Architecture backup

```
server/src/services/backup/
  backupSafety.js      — filtrage chemins, masquage, validation
  backupManifest.js    — génération manifest SHA256
  backupEngine.js      — collecte fichiers, création ZIP, vérification
  backupStore.js       — listage, info, suppression, stats, pruning
  restoreEngine.js     — dry-run, restauration avec rollback
  backupAudit.js       — journal audit runtime/backup-audit.json

server/src/routes/backup.js  — 10 endpoints REST

frontend/src/hooks/useBackup.ts
frontend/src/components/backup/
  BackupPanel.tsx
  BackupStatusCard.tsx
  BackupCreateForm.tsx
  BackupList.tsx
  BackupManifestView.tsx
  BackupRestoreDryRun.tsx
  BackupAudit.tsx
  BackupSafetyNotice.tsx
```

## Manifest

Chaque ZIP contient `backup-manifest.json` :

```json
{
  "backupId": "backup_1234567890_abc123",
  "createdAt": "2026-05-17T10:00:00.000Z",
  "project": "Sallon-ConnecT",
  "phase": 21,
  "mode": "local",
  "profile": "main1234…",
  "options": { "includeRuntimeSafe": true, "includeAudits": false, "includeLogs": false },
  "summary": { "fileCount": 12, "totalSizeBucket": "small", "runtimeIncluded": true },
  "files": [{ "path": "data/devices.json", "sizeBucket": "small", "checksum": "sha256..." }],
  "security": { "secretsExcluded": true, "envExcluded": true, "nodeModulesExcluded": true },
  "backupChecksum": "sha256..."
}
```

## Checksum

- SHA256 sur chaque fichier individuel (stocké dans manifest)
- SHA256 sur le ZIP entier (backupChecksum dans manifest)
- Vérification via `POST /api/backup/backups/:id/verify`

## Dry-run restore

Obligatoire avant toute restauration réelle. Retourne :
- `willRestore` : liste des fichiers qui seraient restaurés
- `conflicts` : fichiers existants qui seraient écrasés
- `newFiles` : fichiers absents qui seraient créés
- `risks` : avertissements
- `confirmationRequired: true`

## Rollback

Avant toute restauration, une nouvelle sauvegarde est créée automatiquement si `BACKUP_ROLLBACK_ENABLED=true` (défaut). Permet d'annuler une restauration incorrecte.

## Exclusions sécurité

| Chemin | Raison |
|---|---|
| `.env`, `.env.*` | Secrets serveur |
| `frontend/.env.local` | Secrets frontend |
| `node_modules/` | Dépendances (non versionnées) |
| `.git/` | Historique git |
| `*.pem`, `*.key`, `*.crt` | Clés cryptographiques |
| `logs/*.log`, `logs/*.txt`, `logs/*.json` | Logs bruts |
| `dist/*.zip` | Archives build |
| `*.tmp`, `*.temp`, `*.swp`, `*.bak` | Fichiers temporaires |

## Endpoints

| Méthode | URL | Description |
|---|---|---|
| GET | `/api/backup/status` | Statut backup |
| GET | `/api/backup/backups` | Liste sauvegardes |
| POST | `/api/backup/create` | Créer sauvegarde |
| GET | `/api/backup/backups/:id` | Info sauvegarde |
| GET | `/api/backup/backups/:id/manifest` | Manifest sanitisé |
| POST | `/api/backup/backups/:id/verify` | Vérifier intégrité |
| POST | `/api/backup/backups/:id/restore/dry-run` | Dry-run restauration |
| POST | `/api/backup/backups/:id/restore` | Restaurer (confirmation requise) |
| DELETE | `/api/backup/backups/:id` | Supprimer sauvegarde |
| GET | `/api/backup/audit` | Journal audit |
| DELETE | `/api/backup/audit` | Vider audit |
| GET | `/api/backup/safety` | Détails sécurité |

## Frontend

- `BackupPanel` : section principale orchestrant tous les sous-composants
- `BackupStatusCard` : affichage statut et configuration
- `BackupCreateForm` : formulaire avec options (runtime sûr, audits, logs)
- `BackupList` : liste des sauvegardes avec actions
- `BackupManifestView` : affichage manifest sanitisé
- `BackupRestoreDryRun` : dry-run + restauration avec confirmation
- `BackupAudit` : journal des événements backup
- `BackupSafetyNotice` : avertissement sécurité

## Permissions profils

| Profil | viewBackups | createBackups | restoreBackups | deleteBackups | viewBackupAudit |
|---|---|---|---|---|---|
| owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| diagnostic | ✓ | ✓ | ✗ | ✗ | ✓ |
| family | ✗ | ✗ | ✗ | ✗ | ✗ |
| guest | ✗ | ✗ | ✗ | ✗ | ✗ |
| tv | ✗ | ✗ | ✗ | ✗ | ✗ |

## Scheduler

Actions autorisées :
- `backup.createSafe` — Sauvegarde locale sûre (hebdomadaire, désactivée par défaut)
- `backup.verifyLatest` — Vérification dernière sauvegarde
- `backup.pruneOld` — Nettoyage anciennes sauvegardes

Actions bloquées absolument :
- `backup.restore` — Jamais automatique
- `backup.includeSecrets` — Interdit
- `backup.includeRawLogs` — Interdit

## Tests

- `tests/backend/backup.test.js` — 13 tests backend
- `frontend/src/__tests__/components/BackupPanel.test.tsx` — 7 tests frontend

## Limites actuelles

- Restauration ne filtre pas les fichiers par profil actif
- Pas de chiffrement du ZIP
- Pas de sauvegarde incrémentale
- Pas de comparaison de contenu (seulement checksum)

## Prochaines étapes

- Phase 22 : chiffrement optionnel des sauvegardes
- Compression avancée par type de fichier
- Interface de comparaison avant/après restauration
