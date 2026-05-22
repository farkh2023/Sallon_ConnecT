# Phase 41 — Tableau de bord visuel des sauvegardes

**Version :** 0.4.1  
**Statut :** Complet

## Objectif

Fournir une interface visuelle pour gerer les snapshots de Phase 40 : creation, verification, export ZIP, preparation de restauration et suppression — entierement locale, aucun secret expose.

## Architecture

### Backend (3 services + 1 route)

| Fichier | Role |
|---|---|
| `server/src/services/backupDashboard/backupDashboardSafety.js` | Sanitisation des IDs, masquage des chemins, erreurs sans stack trace |
| `server/src/services/backupDashboard/backupScriptRunner.js` | Execution des scripts PS1, timeout 30s, non-Windows retourne vide |
| `server/src/services/backupDashboard/backupDashboardService.js` | Agregation, prepareRestore (jamais auto-restaure) |
| `server/src/routes/backupDashboard.js` | 7 endpoints sous `/api/backups` |

### Endpoints

| Methode | Route | Description |
|---|---|---|
| GET | `/api/backups/safety` | Flags de securite |
| GET | `/api/backups/dashboard` | Tableau de bord complet (summary + items) |
| GET | `/api/backups/list` | Liste brute des snapshots |
| POST | `/api/backups/create` | Creer un snapshot (quick/full) |
| POST | `/api/backups/:id/verify` | Verifier l'integrite SHA256 |
| POST | `/api/backups/:id/export` | Exporter en ZIP |
| DELETE | `/api/backups/:id` | Supprimer (confirmation "SUPPRIMER" requise) |
| POST | `/api/backups/:id/restore/prepare` | Retourne commande PS1 — JAMAIS auto-restaure |

### Frontend (14 composants)

| Composant | Role |
|---|---|
| `BackupStatusBadge` | Badge coloré valid/corrupted/incomplete/quick/full |
| `BackupSafetyNotice` | Notice de securite locale |
| `BackupLimitations` | Limitations connues |
| `BackupSummaryCards` | 7 cartes statistiques |
| `BackupActionsBar` | Boutons Backup rapide / Backup complet / Actualiser |
| `BackupCreateModal` | Modal options (type + exportZip) |
| `BackupDeleteConfirm` | Confirmation "SUPPRIMER" obligatoire |
| `BackupItemCard` | Carte d'un snapshot avec actions |
| `BackupTable` | Liste de tous les snapshots |
| `BackupVerifyPanel` | Affichage resultat de verification |
| `BackupExportPanel` | Affichage resultat d'export |
| `BackupRestorePrepare` | Affiche commande PS1 — aucun bouton "Restaurer maintenant" |
| `BackupDiagnosticPanel` | Donnees techniques collapsibles |
| `BackupDashboardPanel` | Orchestrateur principal |

### Page et navigation

- Page : `frontend/src/app/sauvegardes/page.tsx` → `/sauvegardes`
- Lien ajouté dans `TopNav.tsx`
- Topics et commandes ajoutes dans le centre d'aide

## Securite

- ID snapshots valides : `/^[A-Za-z0-9_\-.]{1,64}$/` — pas de `..`, `/`, `\`
- Chemins masques : `C:\Users\username\` → `<user>\`
- Aucun secret / token / .env dans les reponses
- Suppression uniquement avec "SUPPRIMER" tape explicitement
- Restauration : commande PowerShell manuelle uniquement, aucun bouton auto

## Tests

- Backend : `tests/backend/backup-dashboard.test.js` — 18 cas (securite, validation, CRUD, injection)
- Frontend : `frontend/src/__tests__/components/BackupDashboardPanel.test.tsx` — 6 cas

## Compatibilite

- Non-Windows : le runner retourne des resultats vides, pas d'erreur
- Phase 40 inchangee (`backups/snapshots/` toujours utilise)
- Phase 21 inchangee (`backups/backup_*.zip` non touche)
