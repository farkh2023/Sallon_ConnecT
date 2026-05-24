Projet : C:\\Users\\Youss\\Sallon\_ConnecT



Lancer la Phase 40 — Sauvegarde/restauration complète utilisateur.



Contexte validé :

\- Version stable v0.4.0

\- Release GitHub OK

\- ZIP portable OK

\- Installateur prêt

\- Service Windows OK

\- Tray Windows OK

\- Assistant premier lancement OK

\- Auto-update sécurisé + rollback OK

\- Frontend : 228/228 OK

\- Backend : 114/114 OK

\- Scripts Windows : 39/39 OK

\- Architecture local-only validée



Objectif :

Créer un système complet de sauvegarde/restauration utilisateur permettant d’exporter et restaurer proprement l’environnement Sallon-ConnecT :

\- configuration ;

\- runtime ;

\- profils ;

\- observabilité ;

\- notifications ;

\- diagnostics ;

\- logs ;

\- paramètres utilisateur ;

\- snapshots versionnés.



Travail demandé :



1\. Architecture backup

&#x20;  Créer une architecture claire :

&#x20;  - backups/snapshots/<timestamp>/

&#x20;  - metadata.json

&#x20;  - checksum.json

&#x20;  - optional encrypted archive

&#x20;  - restore reports



&#x20;  Sauvegarder :

&#x20;  - VERSION ;

&#x20;  - package metadata ;

&#x20;  - runtime utile ;

&#x20;  - profils ;

&#x20;  - settings ;

&#x20;  - notifications ;

&#x20;  - diagnostics ;

&#x20;  - exports utilisateur ;

&#x20;  - configuration tray/service.



&#x20;  Exclure :

&#x20;  - node\_modules ;

&#x20;  - .next ;

&#x20;  - cache/temp ;

&#x20;  - coverage ;

&#x20;  - logs trop volumineux ;

&#x20;  - secrets sensibles si détectés.



2\. Scripts Windows backup

&#x20;  Créer :

&#x20;  - scripts/windows/backup/create-backup.ps1

&#x20;  - scripts/windows/backup/list-backups.ps1

&#x20;  - scripts/windows/backup/verify-backup.ps1

&#x20;  - scripts/windows/backup/restore-backup.ps1

&#x20;  - scripts/windows/backup/delete-backup.ps1

&#x20;  - scripts/windows/backup/export-backup.ps1

&#x20;  - scripts/windows/backup/README.md



3\. Sauvegarde

&#x20;  create-backup.ps1 doit :

&#x20;  - créer snapshot horodaté ;

&#x20;  - générer metadata.json ;

&#x20;  - calculer SHA256 ;

&#x20;  - vérifier intégrité ;

&#x20;  - produire rapport texte ;

&#x20;  - préserver local-only ;

&#x20;  - supporter :

&#x20;    - backup rapide ;

&#x20;    - backup complet ;

&#x20;    - export ZIP.



4\. Restauration

&#x20;  restore-backup.ps1 doit :

&#x20;  - lister backups disponibles ;

&#x20;  - demander confirmation ;

&#x20;  - arrêter service/tray si actif ;

&#x20;  - sauvegarder état actuel avant restore ;

&#x20;  - restaurer fichiers applicatifs/utilisateur ;

&#x20;  - préserver données critiques ;

&#x20;  - vérifier VERSION ;

&#x20;  - redémarrer si demandé ;

&#x20;  - produire rapport restore.



5\. Vérification intégrité

&#x20;  verify-backup.ps1 doit :

&#x20;  - lire metadata ;

&#x20;  - recalculer SHA256 ;

&#x20;  - vérifier structure attendue ;

&#x20;  - détecter fichiers manquants ;

&#x20;  - afficher état :

&#x20;    valid / corrupted / incomplete.



6\. Chiffrement optionnel

&#x20;  Ajouter option facultative :

&#x20;  - archive ZIP protégée mot de passe ;

&#x20;  - jamais obligatoire ;

&#x20;  - documenter limites ;

&#x20;  - ne pas casser usage simple.



7\. Intégration update/rollback

&#x20;  - update apply crée backup auto ;

&#x20;  - rollback peut réutiliser snapshots ;

&#x20;  - tray peut ouvrir dossier backups ;

&#x20;  - diagnostics affichent dernier backup.



8\. UI / diagnostics

&#x20;  Si simple :

&#x20;  - endpoint diagnostic backup ;

&#x20;  - statut dernier backup ;

&#x20;  - taille ;

&#x20;  - date ;

&#x20;  - validité checksum.



9\. Sécurité

&#x20;  Obligatoire :

&#x20;  - aucun cloud ;

&#x20;  - aucun upload ;

&#x20;  - aucun secret exporté volontairement ;

&#x20;  - confirmation avant restore/delete ;

&#x20;  - backups locaux uniquement ;

&#x20;  - SHA256 obligatoire ;

&#x20;  - logs limités.



10\. Tests Windows

&#x20;  Étendre tests PowerShell :

&#x20;  - création backup ;

&#x20;  - listing ;

&#x20;  - verify ;

&#x20;  - restore simulé ;

&#x20;  - delete confirmation ;

&#x20;  - checksum ;

&#x20;  - archive ZIP ;

&#x20;  - absence secrets ;

&#x20;  - comportement si backup corrompu.



11\. Documentation

&#x20;  Créer :

&#x20;  - docs/PHASE40.md

&#x20;  - docs/BACKUP\_RESTORE.md



&#x20;  Inclure :

&#x20;  - architecture ;

&#x20;  - création backup ;

&#x20;  - restore ;

&#x20;  - checksum ;

&#x20;  - snapshots ;

&#x20;  - rollback ;

&#x20;  - sécurité ;

&#x20;  - dépannage ;

&#x20;  - limites connues.



12\. README / CHANGELOG / ROADMAP

&#x20;  Mettre à jour :

&#x20;  - README.md

&#x20;  - CHANGELOG.md

&#x20;  - ROADMAP.md

&#x20;  - docs/INDEX.md

&#x20;  - docs/RELEASE\_CHECKLIST.md



13\. Validations finales

&#x20;  Exécuter :

&#x20;  pnpm lint

&#x20;  pnpm test

&#x20;  pnpm build

&#x20;  pnpm test:backend

&#x20;  pnpm test:windows

&#x20;  pnpm release:build



14\. Livrable final attendu

&#x20;  Fournir :

&#x20;  - fichiers créés/modifiés ;

&#x20;  - procédure backup/restore ;

&#x20;  - intégration update ;

&#x20;  - résultats validations ;

&#x20;  - limitations restantes ;

&#x20;  - exemples de commandes utilisateur.



Contraintes :

\- Ne pas casser ZIP portable.

\- Ne pas casser installateur.

\- Ne pas casser service/tray/update.

\- Préserver local-only.

\- Aucun cloud.

\- Aucun secret.

\- Confirmation obligatoire avant restore/delete.

