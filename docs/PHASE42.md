# Phase 42 — Assistant de restauration securise

**Version :** 0.4.2  
**Statut :** Complet

## Objectif

Guider l'utilisateur en 6 etapes avant de restaurer un snapshot — sans jamais executer la restauration automatiquement. L'assistant verifie l'integrite, simule le dry-run, calcule un score de risque, exige une checklist, puis affiche uniquement la commande PowerShell.

---

## Architecture

### Backend — 2 services + 4 routes

| Fichier | Role |
|---|---|
| `server/src/services/backupDashboard/restoreAssistantSafety.js` | validateSnapshotId, maskRestorePath, buildRestoreRisk, buildManualRestoreCommand, ensureRestoreIsManualOnly |
| `server/src/services/backupDashboard/restoreAssistantService.js` | getAssistantData, getDryRun, getRisk, getManualCommand — jamais restore-backup.ps1 |

### Endpoints Phase 42

| Methode | Route | Description |
|---|---|---|
| GET | `/api/backups/:id/restore/assistant` | Donnees completes wizard (snapshot + integrite + dryRun + risque + checklist) |
| POST | `/api/backups/:id/restore/dry-run` | Simulation restauration (ne modifie rien) |
| POST | `/api/backups/:id/restore/risk` | Score de risque (low/medium/high/blocked) |
| GET | `/api/backups/:id/restore/command` | Commande PowerShell manuelle uniquement |

**Aucun endpoint ne peut executer restore-backup.ps1.**

---

## Dry-run

Simule ce qui serait restaure sans rien modifier :

- `wouldRestore` : fichiers dans le snapshot
- `wouldReplace` : VERSION, package.json (fichiers actuels ecrases)
- `wouldKeep` : node_modules/, .next/, backups/, logs/, .env
- `excluded` : .env (jamais copie), node_modules/, .next/, cache/
- `preRestoreBackup` : un snapshot quick sera cree automatiquement par le script

---

## Score de risque

| Level | Criteres |
|---|---|
| `low` | Backup valide, quick, recent |
| `medium` | Backup full, > 7 jours, nombreux fichiers |
| `high` | > 30 jours ou > 10 fichiers remplaces |
| `blocked` | Fichiers manquants, corrompus, snapshot invalide |

---

## Checklist obligatoire (etape 5)

L'utilisateur doit cocher les 6 points avant de voir la commande :

1. J'ai verifie que le snapshot est valide
2. Je comprends que les donnees actuelles peuvent etre remplacees
3. Je comprends qu'un backup pre-restauration sera cree
4. Je comprends que le service peut etre arrete pendant la restauration
5. Je comprends que la restauration se fait uniquement en PowerShell
6. Je confirme qu'aucune restauration automatique n'est lancee par le dashboard

---

## Commande manuelle (etape 6)

```powershell
.\scripts\windows\backup\restore-backup.ps1 -SnapshotId SNAPSHOT_ID
```

Avec bouton Copier. Ne pas executer depuis le dashboard.

---

## Frontend — 11 composants

| Composant | Role |
|---|---|
| `RestoreAssistantWizard` | Orchestrateur principal, barre de progression 6 etapes |
| `RestoreStepSnapshot` | Etape 1 : infos snapshot, blocage si invalide |
| `RestoreStepIntegrity` | Etape 2 : resultats SHA256, blocage si echec |
| `RestoreStepDryRun` | Etape 3 : simulation visuelle |
| `RestoreStepRisk` | Etape 4 : badge de risque + raisons |
| `RestoreStepChecklist` | Etape 5 : 6 cases obligatoires |
| `RestoreStepCommand` | Etape 6 : commande + bouton copier |
| `RestoreRiskBadge` | Badge coloré low/medium/high/blocked |
| `RestoreChecklist` | Liste de cases a cocher |
| `RestoreManualCommandBox` | Bloc de commande copiable |
| `RestoreSafetyNotice` | Notice rouge permanente |

Hook : `useRestoreAssistant.ts` — loadAssistant, runDryRun, loadRisk, loadManualCommand, toggleChecklistItem, canShowCommand, resetWizard

---

## Securite

- IDs valides : `/^[A-Za-z0-9_\-.]{1,64}$/` — pas de `..`, `/`, `\`
- Chemins masques : `C:\Users\` → `<user>\`
- Aucun .env / token / Bearer dans les reponses
- `restore-backup.ps1` jamais appele par aucun endpoint
- `runRestoreBackup` n'existe pas dans le runner
- Restauration : commande manuelle uniquement, affichee a l'etape 6 apres checklist complete

---

## Integration Phase 41

- Le bouton "Preparer restauration" dans `BackupItemCard` ouvre maintenant `RestoreAssistantWizard`
- `BackupDashboardPanel` remplace l'ancien `BackupRestorePrepare` inline par le wizard complet
- `BackupRestorePrepare.tsx` conserve pour compatibilite mais n'est plus utilise dans le panel principal

---

## Tests

| Suite | Cas | Resultat |
|---|---|---|
| `tests/backend/restore-assistant.test.js` | 21 cas (validation ID, securite, endpoints) | Passes |
| `frontend/.../RestoreAssistantWizard.test.tsx` | 10 cas (rendu, navigation, checklist, securite) | Passes |

---

## Limites connues

- Le dry-run lit metadata.json et checksum.json — pas de vraie simulation filesystem
- Le score de risque est calcule cote serveur sans connaitre l'etat exact du systeme cible
- Etape 2 (integrite) utilise verify-backup.ps1 — sur non-Windows retourne vide
- La checklist est reinitialise a chaque ouverture du wizard
