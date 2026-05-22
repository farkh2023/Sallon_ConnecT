# Backup — Sallon-ConnecT (Phase 40)

Scripts PowerShell de sauvegarde et restauration locale.

## Scripts disponibles

| Script | Description |
|---|---|
| `create-backup.ps1` | Crée un snapshot horodaté (`quick` ou `full`) |
| `list-backups.ps1` | Liste les snapshots disponibles |
| `verify-backup.ps1` | Vérifie l'intégrité SHA256 d'un snapshot |
| `restore-backup.ps1` | Restaure depuis un snapshot |
| `delete-backup.ps1` | Supprime un snapshot (confirmation obligatoire) |
| `export-backup.ps1` | Exporte un snapshot en archive ZIP |

## Utilisation rapide

```powershell
# Créer un backup rapide
.\scripts\windows\backup\create-backup.ps1

# Créer un backup complet
.\scripts\windows\backup\create-backup.ps1 -Type full

# Lister les backups
.\scripts\windows\backup\list-backups.ps1

# Vérifier le dernier backup
.\scripts\windows\backup\verify-backup.ps1

# Restaurer (interactif)
.\scripts\windows\backup\restore-backup.ps1

# Exporter en ZIP
.\scripts\windows\backup\export-backup.ps1
```

## Structure snapshot

```
backups/snapshots/<timestamp>/
  metadata.json     — informations snapshot (version, type, fileCount, SHA256 checksum)
  checksum.json     — SHA256 de chaque fichier
  report.txt        — rapport lisible
  env-marker.txt    — indique si .env était présent (sans contenu)
  VERSION           — version applicative
  package.json      — métadonnées NPM
  data/             — profils, appareils, configuration
  runtime/          — rapport premier lancement, statut update
  logs/             — 3 derniers logs, 200 lignes max (full uniquement)
  scripts/          — scripts PowerShell (full uniquement)
```

## Sécurité

- **Aucun cloud** — tous les snapshots restent dans `backups/snapshots/`.
- **Aucun secret** — `.env` n'est jamais copié, seulement sa présence marquée.
- **SHA256 obligatoire** — chaque fichier est vérifié à la création et à la restauration.
- **Confirmation obligatoire** — `restore-backup.ps1` et `delete-backup.ps1` demandent confirmation.
- **Backup pré-restauration automatique** — créé avant toute restauration.

## Limitations connues

- Le chiffrement ZIP par mot de passe nécessite **7-Zip** installé (`-Password` dans `export-backup.ps1`).
- Les logs inclus dans le backup `full` sont tronqués aux 200 dernières lignes.
- `node_modules/`, `.next/`, `cache/`, `coverage/` sont exclus.
- Les snapshots ne sont pas inclus dans le ZIP portable (exclus automatiquement).
