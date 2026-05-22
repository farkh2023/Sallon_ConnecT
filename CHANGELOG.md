# Changelog

Toutes les modifications notables de ce projet sont documentees ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) — versionnement [SemVer](https://semver.org/).

---

## [0.4.0] — 2026-05-22 — Release locale stable

### Ajoute

**Phase 42 — Assistant de restauration securise**
- Wizard 6 etapes : snapshot, integrite SHA256, dry-run, score de risque, checklist, commande.
- 2 services backend : restoreAssistantSafety, restoreAssistantService (jamais restore-backup.ps1).
- 4 endpoints : /assistant, /dry-run, /risk, /command — lecture seule, aucune execution.
- 11 composants React dans restore-assistant/, hook useRestoreAssistant.
- Checklist 6 points obligatoires avant affichage commande PowerShell.
- Score risque : low/medium/high/blocked selon validite, age, type, fichiers.
- Commande manuelle uniquement : bouton Copier, aucun bouton "Restaurer maintenant".
- Integration Phase 41 : bouton "Preparer restauration" ouvre maintenant le wizard complet.
- Tests : 21 cas backend + 10 cas frontend.

**Phase 41 — Tableau de bord visuel des sauvegardes**
- Interface visuelle `/sauvegardes` : creation, verification, export ZIP, preparation de restauration, suppression.
- 3 services backend + 7 endpoints sous `/api/backups`.
- 14 composants React dans `frontend/src/components/backups/`.
- Hook `useBackupDashboard` avec chargement automatique et protection montage.
- Securite : IDs valides par regex, chemins masques, aucun secret expose, "SUPPRIMER" obligatoire.
- Restauration : commande PowerShell manuelle uniquement, aucune auto-restauration.
- Tests : 18 cas backend (jest) + 6 cas frontend (vitest).
- Lien "Sauvegardes" dans TopNav, topics et commandes dans le centre d'aide.

**Phase 40 — Sauvegarde/restauration complete utilisateur**
- `create-backup.ps1` : snapshot horodaté (quick/full), metadata.json, checksum.json SHA256, rapport texte, export ZIP optionnel.
- `list-backups.ps1` : liste tous les snapshots avec type, version, taille, validité.
- `verify-backup.ps1` : recalcule SHA256, compare checksum.json, états valid/corrupted/incomplete.
- `restore-backup.ps1` : vérifie intégrité, demande confirmation, arrête service/tray, backup pré-restauration automatique, rapport restore.
- `delete-backup.ps1` : confirmation obligatoire (oui ou SUPPRIMER TOUT).
- `export-backup.ps1` : archive ZIP avec SHA256, chiffrement optionnel via 7-Zip AES-256.
- Endpoint `GET /api/diagnostics/backup` : liste snapshots, dernier backup, taille, validité.
- Tray : item "Ouvrir les sauvegardes" ouvre `backups/snapshots/` dans l'explorateur.
- `apply-update.ps1` : crée snapshot Phase 40 avant chaque mise à jour.
- Scripts backup inclus dans le ZIP portable (scripts/windows/backup/).
- Documentation `docs/PHASE40.md` et `docs/BACKUP_RESTORE.md`.

**Phase 26 — Stabilisation aide et etat systeme**
- Centre d'aide consolide avec statut systeme plus explicite.
- Etats backend `checking`, `online`, `offline`, `degraded`.
- Tests frontend renforces autour des panneaux d'aide et du statut local.

**Phase 27/28 — Observabilite et evenements systeme**
- Panneau d'evenements systeme avec filtres severity/source.
- Bus d'evenements frontend local, marque lu/non-lu et exports.
- Integration dans `ObservabilityPanel`.

**Phase 29 — Persistance locale**
- Persistance localStorage des evenements systeme.
- Retention locale bornee, nettoyage silencieux et export JSON/CSV.
- Tests stockage et bus local.

**Phase 30 — SSE local securise**
- Endpoint `GET /api/events/stream`.
- Endpoint `GET /api/events/client-count`.
- Origines limitees a `localhost:3000` et `localhost:3001`.
- Deduplication frontend, heartbeat ignore et fallback local.

**Phase 31 — Centre de notifications intelligent**
- Notifications locales derivees des evenements systeme.
- Grouping, deduplication, compteur non-lus et filtres.
- Aucun appel cloud, aucun secret stocke.

**Phase 32 — Diagnostic avance**
- Endpoint `GET /api/diagnostics/overview`.
- Snapshot frontend avec Backend, SSE, Scheduler, Backup, Notifications, Stockage local et Securite.
- Score global 0-100, etat erreur propre, export JSON local.
- Tests frontend hook/dashboard et tests backend diagnostics.

**Phase 33 — Release locale stable**
- Scripts `scripts/windows/release/build-release.ps1`, `verify-release.ps1`, `start-release.ps1`.
- Generation checksum SHA256, metadata release et rapport local.
- Verification ZIP local-only, exclusions cache/temp/logs/node_modules/.env.
- README, ROADMAP et notes de release `v0.4.0`.

**Phase 35 — Installateur Windows autonome (Inno Setup)**
- Script Inno Setup 6 `scripts/windows/installer/Sallon-ConnecT.iss` complet.
- `build-installer.ps1` : detection ISCC, lint/tests/build avant compilation, SHA256 post-compilation.
- `verify-installer.ps1` : 11 verifications (taille, SHA256, version, exclusions secrets).
- `uninstall-check.ps1` : verification proprete post-desinstallation.
- Installation sans admin dans `%LOCALAPPDATA%\Sallon-ConnecT`.
- Verification Node.js et creation `.env` automatiques a l'installation.
- Documentation `INSTALLER_WINDOWS.md`.

**Phase 36 — Service Windows + demarrage automatique**
- `install-service.ps1` : dual-mode NSSM (admin) / Task Scheduler (sans admin, recommande).
- `start-service.ps1`, `stop-service.ps1`, `restart-service.ps1`, `remove-service.ps1`, `service-status.ps1`.
- Watchdog : redemarrage automatique en cas de crash (3 tentatives, delai 1 min).
- Endpoint `GET /api/diagnostics/service` : mode, statut, PID, uptime.
- Integration Inno Setup (tache optionnelle `installservice`).
- Documentation `WINDOWS_SERVICE.md`.

**Phase 39 — Auto-update local securise**
- `check-update.ps1` : verifie GitHub release vs version locale, affiche changelog et assets.
- `download-update.ps1` : telecharge ZIP + sha256, valide URL GitHub, verifie SHA256, ecrit verification.json.
- `apply-update.ps1` : backup systematique, confirmation obligatoire, copie selective (preserve logs/runtime/backups/.env/data/), rapport apply.
- `rollback-update.ps1` : restaure depuis runtime/update-backups/, listage et confirmation.
- `update-status.ps1` : statut versions, telechargements, backups.
- Tray : item "Verifier mise a jour..." dans le menu clic-droit.
- Aucun auto-update, aucune telemetrie, SHA256 obligatoire avant apply.
- Documentation `SECURE_UPDATE.md`.

**Phase 38 — Assistant premier lancement**
- `check-environment.ps1` : diagnostic complet (Node.js, npm, ports, backend, frontend, SSE, service, tray, dossiers).
- `first-run.ps1` : wizard interactif — choix mode (portable / Task Scheduler / NSSM), activation tray, ouverture dashboard.
- `first-run-status.ps1` : statut du premier lancement et environnement actuel.
- Rapport genere : `runtime/first-run-report.json` et `logs/first-run-report.txt`.
- Integration Inno Setup : tache optionnelle `firstrun`, raccourci Menu Demarrer "Assistant premier lancement".
- Aucune elevation admin automatique — bascule portable si NSSM sans droits.
- Aucun secret, aucun chemin sensible dans le rapport.
- Documentation `FIRST_RUN.md`.

**Phase 37 — Interface tray Windows**
- `Sallon-ConnecT-Tray.ps1` : application tray PowerShell + Windows Forms NotifyIcon.
- `start-tray.ps1`, `stop-tray.ps1`, `tray-status.ps1`.
- Menu clic-droit 8 actions, double-clic ouvre dashboard.
- Polling health `/api/health` toutes les 5s, icones systeme par etat.
- Notifications Windows locales avec throttle 60s par type.
- Protection instance unique via fichier PID dans `%TEMP%`.
- Integration Inno Setup (tache optionnelle `trayicon`).
- Aucune dependance externe, aucun appel cloud, pas d'Electron.
- Documentation `WINDOWS_TRAY.md`.

### Change

- Version projet alignee sur `0.4.0`.
- Packaging portable renforce avec exclusions cache/temp et scripts release Windows inclus.
- Documentation principale orientee release locale stable.
- Tests packaging et validation PowerShell couvrent les nouveaux scripts.

### Securite

- Aucune protection local-only supprimee.
- Diagnostics et exports limites aux champs non sensibles.
- SSE limite aux origines locales.
- ZIP portable verifie contre `.env`, `frontend/.env.local`, `node_modules`, `.next`, caches, runtime JSON, logs bruts, backups prives et cles/certificats.

### Validation

- Frontend : 228 tests.
- Backend : 114 tests.
- `pnpm lint` : OK.
- `pnpm build` : OK.
- Packaging ZIP : OK.

---

## [0.1.0] — 2026-05-17 — Premier prototype local complet

### Ajoute

**Infrastructure (Phases 1–4)**
- Serveur Express backend sur port 3000
- Ancien frontend HTML statique conserve
- Frontend Next.js 16 sur port 3001 (`frontend/`)
- API appareils, scan reseau, services multimedias
- Donnees JSON locales (`data/`)

**Integrations locales (Phases 5–11)**
- Orchestrateur de scenarios intelligents (cinema, travail, famille)
- Diagnostic ADB en lecture seule
- Decouverte DLNA/UPnP passive
- SmartThings Samsung TV opt-in securise
- Scenes SmartThings avec confirmation explicite
- Commandes TV avec whitelist d'actions
- Streaming assiste indexe localement

**Qualite et observabilite (Phases 12–19)**
- Notifications locales avec moteur de regles
- Scheduler de taches planifiees safelist uniquement
- Dashboard observabilite en temps reel
- Graphes temporels Recharts
- Export JSON/CSV non sensible des snapshots
- Packaging Windows portable
- Suite de tests backend, frontend, packaging et PowerShell
- Snapshots d'observabilite avec buckets non sensibles

**Profils et securite (Phase 20)**
- 5 profils par defaut : owner, family, guest, tv, diagnostic
- Permissions locales par profil
- Basculement rapide dans la TopNav
- Audit trail local des changements de profil

**Sauvegarde locale (Phases 21–21B)**
- ZIP locaux avec manifest SHA256
- Dry-run obligatoire avant restauration
- Rollback automatique avant restauration
- Code de confirmation explicite
- Exclusion automatique des secrets, dependances, logs bruts et builds
- Isolation des tests runtime

**Publication GitHub (Phase 22)**
- Scripts release initiaux
- Documentation complete
- VERSION 0.1.0, versionnement SemVer
- `.gitignore` complet verifie

### Securite

- Aucun secret commite.
- Chemins absolus masques dans les reponses API.
- Audit runtime non versionne.
- `node_modules`, `.next`, runtime, logs et backups exclus.
- SmartThings opt-in desactive par defaut.

---

[0.4.0]: https://github.com/farkh2023/Sallon-ConnecT/releases/tag/v0.4.0
[0.1.0]: https://github.com/farkh2023/Sallon-ConnecT/releases/tag/v0.1.0
