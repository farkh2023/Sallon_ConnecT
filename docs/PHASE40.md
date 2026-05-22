# Phase 40 — Sauvegarde/restauration complète utilisateur

## Objectif

Créer un système complet de sauvegarde et restauration locale pour Sallon-ConnecT : snapshots horodatés, vérification SHA256, restauration sécurisée, intégration update/tray.

## Livrable

| Fichier | Description |
|---|---|
| `scripts/windows/backup/create-backup.ps1` | Crée un snapshot horodaté (`quick` ou `full`) |
| `scripts/windows/backup/list-backups.ps1` | Liste les snapshots disponibles |
| `scripts/windows/backup/verify-backup.ps1` | Vérifie l'intégrité SHA256 |
| `scripts/windows/backup/restore-backup.ps1` | Restaure depuis un snapshot |
| `scripts/windows/backup/delete-backup.ps1` | Supprime un snapshot (confirmation) |
| `scripts/windows/backup/export-backup.ps1` | Exporte en archive ZIP |
| `scripts/windows/backup/README.md` | Documentation scripts |
| `server/src/routes/diagnostics.js` | Ajout endpoint `/api/diagnostics/backup` |
| `scripts/windows/tray/Sallon-ConnecT-Tray.ps1` | Ajout item "Ouvrir les sauvegardes" |
| `scripts/windows/update/apply-update.ps1` | Backup auto Phase 40 avant apply |

## Architecture snapshot

```
backups/
  snapshots/               <- Phase 40 (snapshots horodatés)
    20260522-063000/
      metadata.json
      checksum.json
      report.txt
      env-marker.txt
      VERSION
      package.json
      data/
      runtime/
      logs/                (full uniquement, 200 lignes max)
      scripts/             (full uniquement, *.ps1)
  backup_*.zip             <- Phase 21 (coexistence préservée)
```

## Commandes utilisateur

```powershell
# Backup rapide
.\scripts\windows\backup\create-backup.ps1

# Backup complet
.\scripts\windows\backup\create-backup.ps1 -Type full -Description "Avant migration"

# Lister
.\scripts\windows\backup\list-backups.ps1

# Vérifier dernier
.\scripts\windows\backup\verify-backup.ps1

# Vérifier tous
.\scripts\windows\backup\verify-backup.ps1 -All

# Restaurer (interactif)
.\scripts\windows\backup\restore-backup.ps1

# Restaurer snapshot précis
.\scripts\windows\backup\restore-backup.ps1 -SnapshotId 20260522-063000 -Confirm

# Supprimer
.\scripts\windows\backup\delete-backup.ps1 -SnapshotId 20260522-063000

# Exporter ZIP
.\scripts\windows\backup\export-backup.ps1

# Exporter avec chiffrement (7-Zip requis)
.\scripts\windows\backup\export-backup.ps1 -Password monmotdepasse
```

## Intégrations

- **apply-update.ps1** : crée automatiquement un snapshot `quick` avant chaque mise à jour.
- **Tray** : item "Ouvrir les sauvegardes" ouvre l'explorateur sur `backups/snapshots/`.
- **Diagnostics** : `GET /api/diagnostics/backup` retourne liste et dernier snapshot.

## Sécurité

- Local-only : aucun cloud, aucun upload.
- `.env` non copié : seulement un marqueur de présence.
- SHA256 obligatoire sur chaque fichier.
- Confirmation avant restauration et suppression.
- Backup pré-restauration automatique.
- Snapshots exclus du ZIP portable.

## Limitations

- Le chiffrement ZIP par mot de passe nécessite 7-Zip.
- Les logs inclus dans `full` sont tronqués à 200 lignes.
- Les `node_modules/`, `.next/`, `cache/` sont exclus.

## Validation

- `pnpm lint` : OK
- `pnpm test` : OK (228 frontend)
- `pnpm build` : OK
- `pnpm test:backend` : OK (114 backend)
- `pnpm test:windows` : OK (syntaxe PS1 validée)
- `pnpm release:build` : OK
