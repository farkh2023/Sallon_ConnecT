# Sauvegarde et restauration — Sallon-ConnecT

Guide utilisateur complet pour sauvegarder et restaurer l'environnement Sallon-ConnecT.

## Architecture

```
backups/snapshots/<timestamp>/
  metadata.json     — informations du snapshot
  checksum.json     — SHA256 de chaque fichier sauvegardé
  report.txt        — rapport lisible
  env-marker.txt    — présence de .env (sans contenu)
  VERSION           — version applicative
  package.json      — métadonnées NPM
  data/             — profils, appareils, configuration locale
  runtime/          — rapport premier lancement, statut update
  logs/             — 3 derniers logs, 200 lignes max (full uniquement)
  scripts/          — scripts PowerShell (full uniquement)
```

## Créer un backup

### Backup rapide (recommandé)

```powershell
.\scripts\windows\backup\create-backup.ps1
```

Sauvegarde : VERSION, package.json, data/, runtime/ utile.

### Backup complet

```powershell
.\scripts\windows\backup\create-backup.ps1 -Type full
```

Sauvegarde en plus : logs récents (tronqués), scripts PowerShell.

### Avec description

```powershell
.\scripts\windows\backup\create-backup.ps1 -Description "Avant configuration SmartThings"
```

### Avec export ZIP

```powershell
.\scripts\windows\backup\create-backup.ps1 -ExportZip
```

## Lister les backups

```powershell
.\scripts\windows\backup\list-backups.ps1
```

Sortie JSON :
```powershell
.\scripts\windows\backup\list-backups.ps1 -Json
```

## Vérifier l'intégrité

```powershell
# Dernier snapshot
.\scripts\windows\backup\verify-backup.ps1

# Snapshot précis
.\scripts\windows\backup\verify-backup.ps1 -SnapshotId 20260522-063000

# Tous les snapshots
.\scripts\windows\backup\verify-backup.ps1 -All
```

États possibles :
- **valid** — tous les SHA256 correspondent
- **corrupted** — un ou plusieurs fichiers ont été modifiés
- **incomplete** — des fichiers attendus sont manquants

## Restaurer

```powershell
# Interactif (liste et demande)
.\scripts\windows\backup\restore-backup.ps1

# Snapshot précis
.\scripts\windows\backup\restore-backup.ps1 -SnapshotId 20260522-063000

# Avec redémarrage automatique
.\scripts\windows\backup\restore-backup.ps1 -Restart
```

**La restauration :**
1. Vérifie l'intégrité du snapshot.
2. Demande confirmation (taper `oui`).
3. Arrête le service et le tray.
4. Crée un backup de l'état actuel avant de restaurer.
5. Restaure les fichiers.
6. Génère un rapport dans `logs/restore-report-<timestamp>.txt`.

## Supprimer un backup

```powershell
# Interactif
.\scripts\windows\backup\delete-backup.ps1

# Snapshot précis
.\scripts\windows\backup\delete-backup.ps1 -SnapshotId 20260522-063000

# Supprimer tous (taper SUPPRIMER TOUT)
.\scripts\windows\backup\delete-backup.ps1 -All
```

## Exporter en ZIP

```powershell
# ZIP standard
.\scripts\windows\backup\export-backup.ps1

# Avec destination
.\scripts\windows\backup\export-backup.ps1 -OutputPath D:\mes-backups\sallon.zip

# Avec chiffrement (7-Zip requis)
.\scripts\windows\backup\export-backup.ps1 -Password monmotdepasse
```

## Snapshots et mises à jour

Avant chaque mise à jour (`apply-update.ps1`), un snapshot `quick` est créé automatiquement dans `backups/snapshots/`. Si la mise à jour échoue, utilisez `restore-backup.ps1` pour revenir à l'état précédent.

## Rollback update

```powershell
# Rollback update (runtime/update-backups/ — Phase 39)
.\scripts\windows\update\rollback-update.ps1

# Restauration snapshot utilisateur (backups/snapshots/ — Phase 40)
.\scripts\windows\backup\restore-backup.ps1
```

## Diagnostics

```powershell
# API
curl http://localhost:3000/api/diagnostics/backup
```

Retourne : nombre de snapshots, dernier snapshot, taille, validité.

## Sécurité

| Règle | Détail |
|---|---|
| Local-only | Aucun snapshot ne quitte la machine |
| Pas de secrets | `.env` jamais copié — marqueur de présence uniquement |
| SHA256 obligatoire | Calculé à la création, vérifié à la restauration |
| Confirmation | Obligatoire avant restauration et suppression |
| Backup pré-restore | Automatique avant toute restauration |
| Pas de cloud | Aucun upload, aucune télémétrie |

## Dépannage

**Snapshot corrompu :**
```powershell
.\scripts\windows\backup\verify-backup.ps1 -All
```
Identifiez les fichiers corrompus ou manquants dans le rapport.

**Restauration impossible (snapshot introuvable) :**
Vérifiez que `backups\snapshots\` existe et contient des dossiers horodatés.

**7-Zip absent pour chiffrement :**
Installez 7-Zip depuis https://www.7-zip.org — le chiffrement n'est jamais obligatoire.

**Droits insuffisants :**
Les scripts ne nécessitent pas d'élévation admin. Relancez en tant qu'utilisateur courant.

## Limitations connues

- Chiffrement ZIP par mot de passe : 7-Zip requis.
- Logs inclus dans `full` : tronqués à 200 lignes par fichier.
- `node_modules/`, `.next/`, `cache/` exclus des snapshots.
- Les snapshots sont exclus du ZIP portable de distribution.
