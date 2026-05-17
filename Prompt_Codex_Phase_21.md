Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 20 sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- ancien frontend conservé

\- PWA + mode TV

\- packaging Windows

\- tests automatisés

\- observability dashboard

\- snapshots observability

\- graphes temporels

\- profils utilisateurs locaux

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- scènes SmartThings opt-in

\- commandes TV opt-in

\- streaming assisté

\- audits runtime

\- sécurité confirmée : pas de secrets, pas d’IP complète, pas de chemin complet, pas d’ID complet



Objectif Phase 21 :

Ajouter un système de sauvegarde et restauration locale sécurisé.



Cette phase doit permettre :

\- de créer une sauvegarde ZIP locale

\- de choisir ce qui est sauvegardé

\- de générer un manifest non sensible

\- de vérifier l’intégrité par checksum

\- de restaurer en dry-run

\- de restaurer réellement avec confirmation explicite

\- de créer un rollback avant restauration

\- d’afficher l’historique des sauvegardes

\- de rester 100 % local



Important :

\- Ne jamais inclure .env réel.

\- Ne jamais inclure frontend/.env.local.

\- Ne jamais inclure token.

\- Ne jamais inclure node\_modules.

\- Ne jamais inclure .git.

\- Ne jamais inclure logs bruts.

\- Ne jamais inclure fichiers temporaires.

\- Ne jamais exposer de chemin absolu complet.

\- Ne jamais restaurer sans dry-run préalable ou confirmation.

\- Ne jamais supprimer de données sans rollback.

\- Ne jamais envoyer vers cloud.



1\. Variables d’environnement



Mettre à jour `.env.example` :



BACKUP\_ENABLED=true

BACKUP\_STORE\_DIR=backups

BACKUP\_RUNTIME\_DIR=runtime

BACKUP\_MAX\_ITEMS=20

BACKUP\_INCLUDE\_RUNTIME\_SAFE=true

BACKUP\_INCLUDE\_AUDITS=false

BACKUP\_INCLUDE\_LOGS=false

BACKUP\_INCLUDE\_DIST=false

BACKUP\_REQUIRE\_CONFIRMATION=true

BACKUP\_CONFIRMATION\_CODE=CONFIRMER\_BACKUP

BACKUP\_RESTORE\_DRY\_RUN\_REQUIRED=true

BACKUP\_ROLLBACK\_ENABLED=true

BACKUP\_MASK\_PATHS=true

BACKUP\_AUDIT\_PATH=runtime/backup-audit.json



Règles :

\- backup activé localement

\- audits exclus par défaut

\- logs exclus par défaut

\- rollback activé

\- restauration dry-run obligatoire

\- confirmation obligatoire



2\. Services backend backup



Créer :



server/src/services/backup/backupSafety.js

server/src/services/backup/backupManifest.js

server/src/services/backup/backupEngine.js

server/src/services/backup/backupStore.js

server/src/services/backup/restoreEngine.js

server/src/services/backup/backupAudit.js



backupSafety.js :

\- sanitizeBackupOptions(input)

\- validateBackupOptions(options)

\- validateRestoreOptions(options)

\- maskBackupPath(path)

\- isPathAllowed(path)

\- isForbiddenPath(path)

\- sanitizeManifestForResponse(manifest)

\- buildSafeBackupError(error)



Chemins interdits :

\- .git/

\- node\_modules/

\- frontend/node\_modules/

\- .next/

\- frontend/.next/

\- .env

\- .env.local

\- frontend/.env.local

\- \*.pem

\- \*.key

\- logs/\*.log

\- logs/\*.txt

\- logs/\*.json

\- dist/\*.zip

\- fichiers temporaires



backupManifest.js :

\- createManifest(files, options)

\- computeFileChecksum(filePath)

\- computeBackupChecksum(zipPath)

\- validateManifest(manifest)

\- summarizeManifest(manifest)



backupStore.js :

\- ensureBackupDir()

\- listBackups()

\- getBackupInfo(backupId)

\- deleteBackup(backupId)

\- getBackupStats()

\- pruneOldBackups()



backupEngine.js :

\- createBackup(options)

\- collectBackupFiles(options)

\- createZip(files, manifest)

\- verifyBackup(zipPath)

\- createBackupAudit(entry)



restoreEngine.js :

\- inspectBackup(zipPath)

\- dryRunRestore(backupId, options)

\- restoreBackup(backupId, options)

\- createRollbackBeforeRestore()

\- validateRestoreTarget()

\- writeRestoreAudit(entry)



backupAudit.js :

\- loadAudit()

\- appendAudit(entry)

\- listAudit()

\- clearAudit()



3\. Fichiers runtime et dossiers



Créer :



backups/.gitkeep

runtime/backup-audit.json



Mettre à jour `.gitignore` :



backups/\*.zip

backups/\*.json

!backups/.gitkeep

runtime/backup-audit.json



Important :

\- backups réels non versionnés

\- audit runtime non versionné



4\. Contenu de sauvegarde



Par défaut, sauvegarder :



Toujours :

\- data/\*.json

\- README.md

\- docs/\*.md

\- frontend/.env.example

\- .env.example

\- scripts/windows/\*.ps1

\- scripts/windows/\*.bat

\- package.json

\- package-lock.json si présent

\- frontend/package.json

\- frontend/package-lock.json si présent



Runtime sûr si BACKUP\_INCLUDE\_RUNTIME\_SAFE=true :

\- active-profile.json

\- user-profiles.json

\- schedules.json

\- observability-snapshots.json

\- notifications.json optionnellement sous forme sanitizée

\- jamais les logs bruts



Exclure par défaut :

\- smartthings-scene-audit.json

\- smartthings-tv-audit.json

\- media-streaming-audit.json

\- profile-audit.json

\- backup-audit.json

\- logs/\*

\- dist/\*

\- .env réels

\- node\_modules

\- .git



5\. Manifest backup



Chaque sauvegarde doit contenir :



backup-manifest.json



Structure :



{

&nbsp; "backupId": "backup\_xxx",

&nbsp; "createdAt": "...",

&nbsp; "project": "Sallon-ConnecT",

&nbsp; "phase": 21,

&nbsp; "mode": "local",

&nbsp; "profile": "active-profile-id-masked",

&nbsp; "options": {

&nbsp;   "includeRuntimeSafe": true,

&nbsp;   "includeAudits": false,

&nbsp;   "includeLogs": false

&nbsp; },

&nbsp; "summary": {

&nbsp;   "fileCount": 0,

&nbsp;   "totalSizeBucket": "small | medium | large",

&nbsp;   "runtimeIncluded": true,

&nbsp;   "auditsIncluded": false,

&nbsp;   "logsIncluded": false

&nbsp; },

&nbsp; "files": \[

&nbsp;   {

&nbsp;     "path": "data/devices.json",

&nbsp;     "sizeBucket": "small",

&nbsp;     "checksum": "sha256..."

&nbsp;   }

&nbsp; ],

&nbsp; "security": {

&nbsp;   "secretsExcluded": true,

&nbsp;   "envExcluded": true,

&nbsp;   "nodeModulesExcluded": true,

&nbsp;   "logsExcluded": true,

&nbsp;   "pathsMasked": true

&nbsp; },

&nbsp; "backupChecksum": "sha256..."

}



Ne jamais stocker :

\- chemin absolu complet

\- token

\- contenu .env

\- IP complète

\- ID complet sensible



6\. Routes API backup



Créer :



server/src/routes/backup.js



Ajouter :



GET /api/backup/status

Retourne :

\- enabled

\- backupDirMasked

\- maxItems

\- rollbackEnabled

\- dryRunRequired

\- confirmationRequired



GET /api/backup/backups

Liste les sauvegardes.



POST /api/backup/create

Body :

{

&nbsp; "includeRuntimeSafe": true,

&nbsp; "includeAudits": false,

&nbsp; "includeLogs": false,

&nbsp; "reason": "Sauvegarde manuelle"

}



Retour :

\- backupId

\- fileName

\- manifestSummary

\- checksum

\- createdAt



GET /api/backup/backups/:id

Retourne infos sauvegarde.



GET /api/backup/backups/:id/manifest

Retourne manifest sanitizé.



POST /api/backup/backups/:id/verify

Vérifie checksum et manifest.



POST /api/backup/backups/:id/restore/dry-run

Retourne :

\- fichiers qui seraient restaurés

\- conflits potentiels

\- fichiers nouveaux

\- fichiers modifiés

\- risques

\- confirmationRequired



POST /api/backup/backups/:id/restore

Body :

{

&nbsp; "confirmationCode": "CONFIRMER\_BACKUP",

&nbsp; "reason": "Restauration contrôlée"

}



Exécute restauration seulement si :

\- confirmation correcte

\- dry-run déjà effectué ou option explicitement valide

\- rollback créé

\- manifest valide



DELETE /api/backup/backups/:id

Supprime une sauvegarde.



GET /api/backup/audit

Retourne audit backup.



DELETE /api/backup/audit

Vide audit.



GET /api/backup/safety

Retourne :

\- localOnly: true

\- cloudSync: false

\- envExcluded: true

\- secretsExcluded: true

\- rollbackEnabled

\- dryRunRequired

\- forbiddenPaths



7\. Intégration server.js



Monter :



/api/backup



Ne pas casser les routes existantes.



8\. Intégration scheduler



Ajouter actions autorisées :



backup.createSafe

backup.verifyLatest

backup.pruneOld



Actions interdites :

backup.restore

backup.includeSecrets

backup.includeRawLogs



Créer tâche par défaut désactivée :



Nom :

Sauvegarde locale sûre



Action :

backup.createSafe



Planification :

weekly dimanche 22:00



enabled: false



Important :

Le scheduler ne doit jamais restaurer automatiquement.



9\. Notifications



Utiliser notificationEngine :



Créer notification pour :

\- sauvegarde créée

\- sauvegarde échouée

\- vérification réussie

\- vérification échouée

\- dry-run restauration terminé

\- restauration réussie

\- restauration refusée

\- rollback créé



Ne jamais inclure chemin absolu complet.



10\. Frontend Next.js



Créer :



frontend/src/components/backup/

&nbsp; BackupPanel.tsx

&nbsp; BackupStatusCard.tsx

&nbsp; BackupList.tsx

&nbsp; BackupCreateForm.tsx

&nbsp; BackupManifestView.tsx

&nbsp; BackupRestoreDryRun.tsx

&nbsp; BackupAudit.tsx

&nbsp; BackupSafetyNotice.tsx



Créer hook :



frontend/src/hooks/useBackup.ts



Fonctions :

\- loadBackupStatus()

\- loadBackups()

\- createBackup()

\- loadBackupManifest()

\- verifyBackup()

\- dryRunRestore()

\- restoreBackup()

\- deleteBackup()

\- loadBackupAudit()

\- clearBackupAudit()



Mettre à jour :

\- AppShell.tsx

\- TopNav.tsx

\- types.ts



11\. Interface attendue



Ajouter section :



“Sauvegarde locale”



Afficher :

\- statut backup

\- bouton créer sauvegarde sûre

\- options :

&nbsp; - inclure runtime sûr

&nbsp; - inclure audits

&nbsp; - inclure logs

\- liste des sauvegardes

\- manifest résumé

\- bouton vérifier

\- bouton dry-run restauration

\- bouton restaurer avec confirmation

\- champ confirmation

\- audit backup

\- notice sécurité



Important UI :

\- restauration désactivée avant dry-run

\- avertissement clair

\- ne jamais afficher chemin complet

\- ne jamais afficher secret

\- mode Invité / TV : masquer ou désactiver la restauration selon permissions profil



12\. Permissions profils



Mettre à jour Phase 20 :



Ajouter permissions :

\- viewBackups

\- createBackups

\- restoreBackups

\- deleteBackups

\- viewBackupAudit



Par défaut :

\- owner : toutes les permissions backup

\- diagnostic : viewBackups + createBackups, pas restore

\- family : aucune restauration

\- guest : aucune sauvegarde

\- tv : aucune sauvegarde



Ajouter section visible :

\- backup



13\. Types frontend



Ajouter :



\- BackupStatus

\- BackupItem

\- BackupManifest

\- BackupAuditEntry

\- BackupDryRunResult

\- BackupSafety



14\. Tests backend



Créer :



tests/backend/backup.test.js



Tester :

\- /api/backup/status

\- create backup safe

\- list backups

\- manifest sanitizé

\- verify backup

\- dry-run restore

\- restore refusée sans confirmation

\- restore refusée sans dry-run

\- forbidden paths exclus

\- .env absent du ZIP

\- node\_modules absent

\- logs bruts absents

\- safety localOnly true

\- audit écrit



15\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/BackupPanel.test.tsx



Tester :

\- rendu status

\- empty backups

\- bouton create

\- dry-run visible

\- restore désactivé sans confirmation

\- safety notice

\- aucune donnée sensible affichée



16\. Documentation



Créer :



docs/PHASE21.md



Contenu :

\- objectif Phase 21

\- architecture backup

\- manifest

\- checksum

\- dry-run restore

\- rollback

\- exclusions sécurité

\- endpoints

\- frontend

\- permissions profils

\- scheduler

\- tests

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 21

\- endpoints backup

\- sécurité

\- commandes curl

\- avertissement restauration



17\. Commandes curl



Ajouter :



curl http://localhost:3000/api/backup/status



curl -X POST http://localhost:3000/api/backup/create ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"includeRuntimeSafe\\":true,\\"includeAudits\\":false,\\"includeLogs\\":false,\\"reason\\":\\"Sauvegarde manuelle\\"}"



curl http://localhost:3000/api/backup/backups



curl http://localhost:3000/api/backup/backups/BACKUP\_ID/manifest



curl -X POST http://localhost:3000/api/backup/backups/BACKUP\_ID/verify



curl -X POST http://localhost:3000/api/backup/backups/BACKUP\_ID/restore/dry-run



curl -X POST http://localhost:3000/api/backup/backups/BACKUP\_ID/restore ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"confirmationCode\\":\\"CONFIRMER\_BACKUP\\",\\"reason\\":\\"Test restauration\\"}"



curl http://localhost:3000/api/backup/audit



curl http://localhost:3000/api/backup/safety



18\. Validation



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check

npm run health



Tester manuellement :

\- http://localhost:3000/api/backup/status

\- http://localhost:3001

\- section Sauvegarde locale visible



19\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- modèle manifest

\- exclusions sécurité

\- rollback

\- dry-run

\- permissions profils

\- intégration scheduler

\- intégration notifications

\- tests ajoutés

\- résultats npm run check

\- sécurité confirmée

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas exposer secret/token/IP complète/chemin complet/ID complet.

\- Ne jamais inclure .env réel dans backup.

\- Ne jamais inclure node\_modules.

\- Ne jamais inclure .git.

\- Ne jamais restaurer sans confirmation.

\- Ne jamais restaurer sans dry-run.

\- Ne jamais faire de backup cloud.

\- Garder tout local, simple, stable et sécurisé.

