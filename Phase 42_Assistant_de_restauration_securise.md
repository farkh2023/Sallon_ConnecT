Tu es Claude Code / Codex, assistant développeur senior.



Projet : Sallon-ConnecT

Dossier : C:\\Users\\Youss\\Sallon\_ConnecT



Objectif Phase 42 :

Créer un Assistant de restauration sécurisé dans le dashboard des sauvegardes.



Contexte :

La Phase 41 est terminée et validée.

Le projet possède maintenant :

\- page frontend : http://localhost:3001/sauvegardes

\- route backend : /api/backups

\- tableau de bord visuel des sauvegardes

\- création backup rapide/complet

\- vérification backup

\- export ZIP

\- suppression avec confirmation "SUPPRIMER"

\- préparation de restauration sans exécution automatique

\- endpoint /api/backups/:id/restore/prepare

\- scripts PowerShell Phase 40 :

&#x20; - scripts/windows/backup/create-backup.ps1

&#x20; - scripts/windows/backup/list-backups.ps1

&#x20; - scripts/windows/backup/verify-backup.ps1

&#x20; - scripts/windows/backup/restore-backup.ps1

&#x20; - scripts/windows/backup/delete-backup.ps1

&#x20; - scripts/windows/backup/export-backup.ps1



Important :

\- Ne jamais restaurer automatiquement via l’API.

\- Ne jamais ajouter un bouton “Restaurer maintenant”.

\- Ne jamais exécuter restore-backup.ps1 depuis le frontend.

\- Ne jamais exécuter restore-backup.ps1 depuis l’API.

\- L’assistant doit seulement préparer, vérifier, expliquer et générer la commande PowerShell manuelle.

\- Ne jamais afficher .env.

\- Ne jamais afficher token.

\- Ne jamais afficher chemin personnel complet.

\- Ne jamais afficher logs bruts.

\- Ne jamais exposer IP complète, IMEI, numéro de série ou ID sensible.

\- Ne pas casser Phase 40 ni Phase 41.

\- Ne pas pousser vers GitHub.

\- Ne pas créer de tag.



1\. Objectif fonctionnel



Ajouter un assistant pas à pas de restauration sécurisé.



Il doit guider l’utilisateur en plusieurs étapes :



Étape 1 — Choix du snapshot

\- afficher le snapshot sélectionné

\- afficher type quick/full

\- afficher date

\- afficher taille

\- afficher statut valid/corrupted/incomplete

\- empêcher la suite si snapshot corrompu ou incomplet



Étape 2 — Vérification d’intégrité

\- lancer la vérification existante

\- afficher SHA256

\- afficher fichiers manquants

\- afficher fichiers corrompus

\- afficher résultat global

\- bloquer la suite si intégrité non confirmée



Étape 3 — Dry-run visuel

\- afficher ce qui serait restauré

\- afficher ce qui serait remplacé

\- afficher ce qui serait conservé

\- afficher les fichiers sensibles exclus

\- afficher le backup pré-restauration automatique prévu

\- ne rien modifier réellement



Étape 4 — Score de risque

Calculer un score :

\- low

\- medium

\- high

\- blocked



Critères :

\- backup valide → risque plus bas

\- backup full → risque moyen

\- backup quick → risque bas à moyen

\- fichiers manquants → blocked

\- fichiers corrompus → blocked

\- version différente → medium/high

\- runtime inclus → medium

\- restauration depuis ancien snapshot → medium/high



Étape 5 — Checklist obligatoire

L’utilisateur doit cocher :

\- J’ai vérifié que le snapshot est valide

\- Je comprends que les données actuelles peuvent être remplacées

\- Je comprends qu’un backup pré-restauration sera créé

\- Je comprends que le service peut être arrêté pendant la restauration

\- Je comprends que la restauration se fait uniquement en PowerShell

\- Je confirme qu’aucune restauration automatique n’est lancée par le dashboard



Étape 6 — Commande PowerShell finale

Afficher uniquement la commande :



.\\scripts\\windows\\backup\\restore-backup.ps1 -SnapshotId SNAPSHOT\_ID



Avec bouton Copier.



Ne pas exécuter.



2\. Backend — endpoints assistant restauration



Créer ou compléter :



server/src/services/backupDashboard/restoreAssistantService.js

server/src/services/backupDashboard/restoreAssistantSafety.js



Ajouter routes dans :



server/src/routes/backupDashboard.js



Endpoints :



GET /api/backups/:id/restore/assistant



Retourne :

{

&#x20; "snapshotId": "...",

&#x20; "status": "ready | blocked",

&#x20; "snapshot": {},

&#x20; "integrity": {},

&#x20; "dryRun": {},

&#x20; "risk": {},

&#x20; "checklist": \[],

&#x20; "manualCommand": "...",

&#x20; "safety": {}

}



POST /api/backups/:id/restore/dry-run



Retourne :

{

&#x20; "status": "ok | blocked",

&#x20; "snapshotId": "...",

&#x20; "wouldRestore": \[],

&#x20; "wouldReplace": \[],

&#x20; "wouldKeep": \[],

&#x20; "excluded": \[],

&#x20; "preRestoreBackup": {

&#x20;   "willBeCreated": true,

&#x20;   "type": "quick"

&#x20; },

&#x20; "warnings": \[],

&#x20; "blockedReasons": \[]

}



POST /api/backups/:id/restore/risk



Retourne :

{

&#x20; "level": "low | medium | high | blocked",

&#x20; "score": 0,

&#x20; "reasons": \[],

&#x20; "blockingReasons": \[]

}



GET /api/backups/:id/restore/command



Retourne :

{

&#x20; "manualOnly": true,

&#x20; "command": ".\\\\scripts\\\\windows\\\\backup\\\\restore-backup.ps1 -SnapshotId ...",

&#x20; "note": "Cette commande doit être exécutée manuellement dans PowerShell."

}



Important :

\- Ces endpoints ne doivent jamais appeler restore-backup.ps1.

\- Ils peuvent lire metadata.json, checksums et infos snapshot.

\- Ils peuvent utiliser les résultats de verify-backup.ps1 si nécessaire.

\- Ils doivent masquer les chemins complets.

\- Ils doivent rejeter les IDs invalides.



3\. Sécurité backend



restoreAssistantSafety.js doit fournir :

\- validateSnapshotId(id)

\- sanitizeRestoreAssistantResponse(data)

\- maskRestorePath(text)

\- buildRestoreRisk(snapshot, verifyResult, dryRun)

\- buildManualRestoreCommand(snapshotId)

\- ensureRestoreIsManualOnly()

\- rejectUnsafeSnapshotId(id)



Règles :

\- ID autorisé : /^\[A-Za-z0-9\_\\-.]{1,64}$/

\- refuser slash, backslash, .., espaces suspects

\- aucun chemin C:\\Users\\ dans les réponses

\- aucun .env

\- aucun token

\- aucun Bearer

\- aucun contenu logs brut

\- sortie limitée en taille



4\. Frontend — composants



Créer :



frontend/src/components/backups/restore-assistant/

&#x20; RestoreAssistantWizard.tsx

&#x20; RestoreStepSnapshot.tsx

&#x20; RestoreStepIntegrity.tsx

&#x20; RestoreStepDryRun.tsx

&#x20; RestoreStepRisk.tsx

&#x20; RestoreStepChecklist.tsx

&#x20; RestoreStepCommand.tsx

&#x20; RestoreRiskBadge.tsx

&#x20; RestoreChecklist.tsx

&#x20; RestoreManualCommandBox.tsx

&#x20; RestoreSafetyNotice.tsx



Créer hook :



frontend/src/hooks/useRestoreAssistant.ts



Fonctions :

\- loadAssistant(snapshotId)

\- runDryRun(snapshotId)

\- loadRisk(snapshotId)

\- loadManualCommand(snapshotId)

\- toggleChecklistItem(id)

\- canShowCommand()

\- resetWizard()



5\. Intégration avec Phase 41



Modifier :



frontend/src/components/backups/BackupRestorePrepare.tsx

frontend/src/components/backups/BackupDashboardPanel.tsx

frontend/src/components/backups/BackupItemCard.tsx



Objectif :

\- le bouton “Préparer restauration” ouvre maintenant l’assistant complet

\- conserver le comportement sécurisé

\- ne pas ajouter de bouton d’exécution

\- afficher la commande finale uniquement à la dernière étape



6\. UI attendue



Design :

\- style cohérent Sallon-ConnecT / SAVOIR\_IA

\- carte principale avec étapes numérotées

\- barre de progression

\- badges de risque

\- couleurs :

&#x20; - low : vert

&#x20; - medium : jaune

&#x20; - high : orange

&#x20; - blocked : rouge

\- commande PowerShell dans un bloc copiable

\- messages de sécurité très visibles



Texte obligatoire :

“La restauration ne peut pas être effectuée automatiquement via le dashboard.”

“Exécutez manuellement la commande PowerShell si vous décidez de continuer.”

“Un backup pré-restauration sera créé automatiquement par le script.”



7\. Types frontend



Mettre à jour :



frontend/src/lib/types.ts



Ajouter :

\- RestoreAssistantResponse

\- RestoreDryRunResult

\- RestoreRiskResult

\- RestoreRiskLevel

\- RestoreChecklistItem

\- RestoreManualCommand

\- RestoreAssistantStep



8\. Tests backend



Créer :



tests/backend/restore-assistant.test.js



Tester :

\- GET /api/backups/:id/restore/assistant

\- POST /api/backups/:id/restore/dry-run

\- POST /api/backups/:id/restore/risk

\- GET /api/backups/:id/restore/command

\- snapshot corrompu bloque assistant

\- snapshot incomplet bloque assistant

\- id contenant .. rejeté

\- id contenant slash rejeté

\- aucune réponse ne contient C:\\Users\\

\- aucune réponse ne contient .env

\- aucune réponse ne contient Bearer

\- aucun endpoint n’appelle restore-backup.ps1

\- manualCommand est générée correctement



Mocker les scripts PowerShell.

Ne pas restaurer réellement.



9\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/RestoreAssistantWizard.test.tsx



Tester :

\- rendu assistant

\- étape snapshot

\- étape intégrité

\- étape dry-run

\- score de risque

\- checklist obligatoire

\- commande masquée tant que checklist non complète

\- commande visible quand checklist complète

\- bouton copier visible

\- aucun bouton “Restaurer maintenant”

\- message “aucune restauration automatique” visible

\- snapshot blocked affiche blocage



10\. Documentation



Créer :



docs/PHASE42.md



Contenu :

\- objectif

\- architecture assistant restauration

\- endpoints

\- composants frontend

\- sécurité

\- dry-run

\- score de risque

\- checklist

\- commande manuelle

\- tests

\- limites connues



Mettre à jour :

\- README.md

\- docs/INDEX.md

\- docs/BACKUP\_RESTORE.md

\- docs/user/README\_USER.md

\- docs/user/TROUBLESHOOTING.md

\- docs/user/FAQ.md

\- CHANGELOG.md

\- ROADMAP.md

\- docs/RELEASE\_CHECKLIST.md



11\. Centre d’aide



Mettre à jour :

\- frontend/src/components/help/HelpTopics.tsx

\- frontend/src/components/help/HelpCommands.tsx

\- frontend/src/app/aide/page.tsx si nécessaire



Ajouter une section :

“Assistant de restauration sécurisé”



Inclure :

\- explication dry-run

\- explication score de risque

\- checklist obligatoire

\- commande manuelle

\- aucun restore automatique



12\. Validation



Lancer :



pnpm lint

pnpm test

pnpm test:backend

pnpm test:windows

pnpm build

pnpm release:build



Tester manuellement :

\- http://localhost:3001/sauvegardes

\- cliquer “Préparer restauration”

\- vérifier les étapes

\- vérifier dry-run

\- vérifier score de risque

\- cocher la checklist

\- vérifier commande PowerShell

\- vérifier absence de bouton “Restaurer maintenant”

\- vérifier /api/backups/:id/restore/assistant

\- vérifier /api/backups/:id/restore/dry-run

\- vérifier /api/backups/:id/restore/risk

\- vérifier /api/backups/:id/restore/command



13\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- composants ajoutés

\- sécurité appliquée

\- tests backend ajoutés

\- tests frontend ajoutés

\- résultats pnpm

\- limites connues

\- commandes utilisateur

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas casser Phase 40.

\- Ne pas casser Phase 41.

\- Ne jamais restaurer automatiquement.

\- Ne jamais ajouter bouton “Restaurer maintenant”.

\- Ne jamais exposer secret/token/IP complète/chemin complet/ID complet.

\- Ne jamais afficher .env.

\- Ne jamais publier vers GitHub.

\- Ne pas créer de tag.

