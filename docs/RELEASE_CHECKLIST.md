# Release Checklist - Sallon-ConnecT v0.4.0

Checklist finale pour une release utilisateur Windows local-only.

## 1. Installation propre

- [ ] Tester dans un nouveau dossier hors depot Git.
- [ ] Extraire le ZIP portable sans copier `.env`.
- [ ] Confirmer l'absence initiale de `node_modules/` et `frontend/.next/`.
- [ ] Lancer `scripts\windows\release\start-release.ps1`.
- [ ] Verifier que les dependances absentes ou incompletes sont reparees.
- [ ] Verifier que le frontend repond sur `http://localhost:3001`.
- [ ] Verifier que le backend repond sur `http://localhost:3000/api/health`.
- [ ] Verifier que le statut signale clairement `.env` absent comme warning non bloquant.

## 2. Scripts Windows

- [ ] `scripts\windows\release\start-release.ps1` lance backend et frontend.
- [ ] `scripts\windows\release\build-release.ps1` execute lint, tests, build, packaging, verification et checksums.
- [ ] `scripts\windows\release\verify-release.ps1` valide structure ZIP, exclusions et scan secrets.
- [ ] `scripts\windows\status-sallon-connect.ps1` affiche ports, HTTP, dossiers et dernier log.
- [ ] `scripts\windows\stop-sallon-connect.ps1` arrete les processus ou avertit si un PID reste actif.
- [ ] Raccourci Bureau cree et cible valide.
- [ ] Raccourcis Menu Demarrer crees et cibles valides.
- [ ] Redemarrage propre valide apres arret.

## 3. Reseau et ports

- [ ] Port `3000` libre avant demarrage ou occupe par Sallon-ConnecT valide.
- [ ] Port `3001` libre avant demarrage ou occupe par Sallon-ConnecT valide.
- [ ] Si un autre service occupe `3000`, le script affiche le PID et refuse le faux backend.
- [ ] Si un autre service occupe `3001`, le script affiche le PID et refuse le faux frontend.
- [ ] Aucun crash silencieux : erreur lisible et chemin logs indique.

## 4. SSE local

- [ ] `GET /api/events/client-count` repond.
- [ ] `GET /api/events/stream` renvoie `sse.connected` depuis `http://localhost:3001`.
- [ ] Une origine externe recoit `403`.
- [ ] Le flux reste limite a `localhost:3000` et `localhost:3001`.
- [ ] Le fallback UI reste comprehensible si EventSource est indisponible.

## 5. Notifications

- [ ] `GET /api/notifications/stats` repond.
- [ ] Les notifications de demarrage et scheduler sont visibles.
- [ ] Les messages sont locaux et sans push externe obligatoire.
- [ ] Les messages sensibles sont masques.
- [ ] Les filtres et etats non lus restent coherents.

## 6. Diagnostics et observabilite

- [ ] `GET /api/diagnostics/overview` retourne `status=ok`.
- [ ] `security.localOnly=true`.
- [ ] `firebase=false`, `cloudServices=false`, `externalPush=false`.
- [ ] `GET /api/observability/overview` repond.
- [ ] Les logs exposes sont masques ou resumes.
- [ ] Les exports JSON restent locaux et non sensibles.

## 7. UX utilisateur

- [ ] Messages de lancement clairs : Node, dependances, build, PIDs, URLs.
- [ ] Message clair si Node est absent ou trop ancien.
- [ ] Message clair si un port est occupe.
- [ ] Etat loading visible dans les panneaux frontend.
- [ ] Erreurs frontend comprehensibles et non techniques quand possible.
- [ ] Terminologie utilisateur limitee : local, diagnostic, notification, observabilite.
- [ ] Centre d'aide disponible sur `/aide`.

## 8. Securite

- [ ] Aucun `.env` reel dans le ZIP.
- [ ] Aucun `.env.local`.
- [ ] Aucun token, password, secret ou API key probable.
- [ ] Aucun `node_modules/`.
- [ ] Aucun `frontend/.next/`.
- [ ] Aucun `runtime/*.json`.
- [ ] Aucun log brut `logs/*.log`, `logs/*.txt`, `logs/*.json`.
- [ ] Aucun backup prive `backups/*.zip` ou `backups/*.json`.
- [ ] Aucun certificat ou cle : `.pem`, `.key`, `.p12`, `.crt`.
- [ ] Diagnostics sans contenu sensible.

## 9. Packaging

- [ ] `pnpm release:build` genere un nouveau ZIP portable.
- [ ] `pnpm release:verify` valide le ZIP.
- [ ] `dist/Sallon-ConnecT-v0.4.0-sha256.txt` genere.
- [ ] `dist/Sallon-ConnecT-v0.4.0-release.json` genere.
- [ ] Rapport release present dans `dist/`.
- [ ] Taille ZIP et SHA256 reportes dans le livrable final.

## 10. Validations finales

Executer :

```powershell
pnpm lint
pnpm test
pnpm build
pnpm test:backend
pnpm test:windows
pnpm release:build
```

Resultat attendu :

- lint OK ;
- tests frontend OK ;
- tests backend OK ;
- build OK ;
- scripts Windows syntaxiquement valides ;
- packaging et verification release OK.

## 11. Installateur Windows (Phase 35)

- [ ] Inno Setup 6.x installe (`winget install JRSoftware.InnoSetup`).
- [ ] `scripts/windows/installer/Sallon-ConnecT.iss` present et valide.
- [ ] `scripts/windows/installer/build-installer.ps1` execute sans erreur.
- [ ] `dist/Sallon-ConnecT-Setup-0.4.0.exe` genere.
- [ ] SHA256 calcule et checksum cree dans `dist/`.
- [ ] `verify-installer.ps1` passe sans erreur critique.
- [ ] Aucun `.env`, token ou secret dans le `.exe`.
- [ ] Raccourcis Menu Demarrer crees correctement.
- [ ] Installation propre dans `%LOCALAPPDATA%\Sallon-ConnecT` validee.
- [ ] `npm install` et build frontend executes par le post-install.
- [ ] Desinstallation propre validee avec `uninstall-check.ps1`.
- [ ] ZIP portable non impacte par la Phase 35.

## 12. Service Windows (Phase 36)

- [ ] `scripts/windows/service/install-service.ps1 -UseTaskScheduler` execute sans erreur.
- [ ] `scripts/windows/service/service-status.ps1` retourne mode et statut corrects.
- [ ] `scripts/windows/service/start-service.ps1` demarre le backend et confirme `/api/health`.
- [ ] `scripts/windows/service/stop-service.ps1` arrete le backend et libere le port 3000.
- [ ] `scripts/windows/service/restart-service.ps1` redемarre proprement.
- [ ] `scripts/windows/service/remove-service.ps1` supprime la tache sans impacter les donnees.
- [ ] `GET /api/diagnostics/service` repond avec `mode` et `status`.
- [ ] ZIP portable non impacte par la Phase 36.

## 13. Tray Windows (Phase 37)

- [ ] `scripts/windows/tray/start-tray.ps1` lance le processus tray en arriere-plan.
- [ ] `scripts/windows/tray/tray-status.ps1` retourne PID et memoire.
- [ ] Icone visible dans la zone de notification Windows.
- [ ] Menu clic-droit : 8 actions disponibles.
- [ ] Double-clic gauche ouvre `http://localhost:3001`.
- [ ] Polling toutes les 5s : icone change selon etat backend.
- [ ] Notifications locales emises (pas de push externe).
- [ ] `scripts/windows/tray/stop-tray.ps1` ferme le tray proprement.
- [ ] Backend non impacte par l'arret du tray.
- [ ] ZIP portable non impacte par la Phase 37.

## 15. Assistant premier lancement (Phase 38)

- [ ] `scripts/windows/first-run/check-environment.ps1` detecte Node.js, npm, ports, backend, frontend, SSE.
- [ ] `check-environment.ps1 -Json` retourne JSON valide.
- [ ] `scripts/windows/first-run/first-run.ps1` s'execute en mode interactif.
- [ ] `first-run.ps1 -Unattended` genere le rapport sans interaction.
- [ ] `first-run.ps1 -Unattended -Mode task-scheduler` configure le service.
- [ ] `runtime/first-run-report.json` genere sans chemins sensibles ni secrets.
- [ ] `logs/first-run-report.txt` genere avec contenu lisible.
- [ ] `first-run-status.ps1` affiche rapport precedent et environnement actuel.
- [ ] Raccourci Menu Demarrer "Assistant premier lancement" present dans installateur.
- [ ] Tache `firstrun` dans installateur (decochee par defaut).
- [ ] Aucune elevation admin automatique (NSSM sans admin bascule en portable).
- [ ] ZIP portable non impacte par la Phase 38.

## 16. Auto-update securise (Phase 39)

- [ ] `scripts/windows/update/check-update.ps1` affiche version locale, distante et assets.
- [ ] URL validee : `https://github.com/farkh2023/` uniquement.
- [ ] Extensions validees : .zip, .txt, .json seulement.
- [ ] `download-update.ps1` telecharge et ecrit verification.json avec SHA256.
- [ ] `apply-update.ps1` refuse si SHA256 invalide.
- [ ] `apply-update.ps1` demande confirmation avant apply.
- [ ] Backup cree dans `runtime/update-backups/` avant chaque apply.
- [ ] Fichiers preserves : logs/, runtime/, backups/, .env, data/.
- [ ] `rollback-update.ps1 -List` liste les backups disponibles.
- [ ] `rollback-update.ps1` restaure les fichiers de la version precedente.
- [ ] `update-status.ps1` affiche versions telechargees et backups.
- [ ] Item "Verifier mise a jour..." present dans le menu tray.
- [ ] Aucun auto-update, aucune telemetrie, aucun secret dans rapports.
- [ ] ZIP portable non impacte par la Phase 39.

## 17. Sauvegarde/restauration (Phase 40)

- [ ] `scripts/windows/backup/create-backup.ps1` cree un snapshot horodaté dans `backups/snapshots/`.
- [ ] `list-backups.ps1` liste les snapshots avec type, version, taille.
- [ ] `verify-backup.ps1` recalcule SHA256 et retourne valid/corrupted/incomplete.
- [ ] `restore-backup.ps1` demande confirmation, arrete service/tray, cree backup pre-restauration.
- [ ] `delete-backup.ps1` demande confirmation avant suppression.
- [ ] `export-backup.ps1` cree ZIP avec SHA256. Chiffrement optionnel (7-Zip).
- [ ] `GET /api/diagnostics/backup` repond avec liste et dernier snapshot.
- [ ] Tray : item "Ouvrir les sauvegardes" ouvre `backups/snapshots/`.
- [ ] `apply-update.ps1` cree snapshot Phase 40 avant mise a jour.
- [ ] Aucun secret dans les snapshots (.env non copie).
- [ ] `backups/snapshots/` exclu du ZIP portable.
- [ ] Documentation `docs/PHASE40.md` et `docs/BACKUP_RESTORE.md` presentes.

## 18. Tableau de bord visuel des sauvegardes (Phase 41)

- [ ] Page `/sauvegardes` accessible et affiche les snapshots.
- [ ] Boutons "Backup rapide" et "Backup complet" declenchent la creation.
- [ ] Verification SHA256 affiche les resultats par fichier.
- [ ] Export ZIP produit `ok: true` en reponse.
- [ ] Suppression impossible sans taper "SUPPRIMER".
- [ ] Restauration : seule la commande PS1 est affichee, aucun bouton auto.
- [ ] IDs avec `..` ou `/` rejetes par l'API (400).
- [ ] Aucun chemin `C:\Users\` dans les reponses API.
- [ ] Aucun secret / token / .env dans les reponses.
- [ ] `GET /api/backups/safety` retourne tous les flags `true`.
- [ ] Tests backend : 18 cas passes (`npm run test:backend`).
- [ ] Tests frontend : 6 cas passes (`npm run test:frontend` ou `pnpm test:frontend`).
- [ ] Lien "Sauvegardes" present dans TopNav.
- [ ] Documentation `docs/PHASE41.md` presente.

## 19. Assistant de restauration securise (Phase 42)

- [ ] Bouton "Preparer restauration" ouvre le wizard a 6 etapes.
- [ ] Etape 1 : infos snapshot affichees, bloque si invalide.
- [ ] Etape 2 : resultats integrite SHA256 affiches, bloque si echec.
- [ ] Etape 3 : dry-run affiche wouldRestore/wouldReplace/wouldKeep/excluded.
- [ ] Etape 4 : score de risque low/medium/high/blocked.
- [ ] Etape 5 : 6 cases checklist toutes obligatoires.
- [ ] Etape 6 : commande PowerShell avec bouton Copier — aucun bouton "Restaurer maintenant".
- [ ] `GET /api/backups/:id/restore/assistant` retourne status ready/blocked.
- [ ] `POST /api/backups/:id/restore/dry-run` retourne les 4 listes.
- [ ] `POST /api/backups/:id/restore/risk` retourne level + score.
- [ ] `GET /api/backups/:id/restore/command` retourne manualOnly:true.
- [ ] IDs invalides (.. / \ espace) rejetes 400.
- [ ] Aucune reponse ne contient C:\Users\ ou .env ou Bearer.
- [ ] runRestoreBackup n'existe pas dans le runner.
- [ ] Tests backend : 21 cas passes.
- [ ] Tests frontend : 10 cas passes.
- [ ] Documentation docs/PHASE42.md presente.

## 14. GitHub Release

- [ ] Tag `v0.4.0` publie.
- [ ] ZIP portable joint a la release.
- [ ] Checksum SHA256 joint ou documente.
- [ ] Notes de release coherentes avec `docs/releases/v0.4.0.md`.
- [ ] Aucune action cloud ajoutee par la release.
- [ ] Aucune publication automatique sans validation humaine.
