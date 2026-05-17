Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

La Phase 21 est terminée fonctionnellement :

\- système de sauvegarde locale

\- restauration avec dry-run obligatoire

\- rollback

\- manifest SHA256

\- exclusions sécurité

\- intégration profils / scheduler / notifications

\- frontend BackupPanel

\- tests backup ajoutés



Problème restant :

npm run test:backend retourne 92/93 tests.

Un échec pré-existant est lié à une pollution d’état runtime des profils.



Objectif Phase 21B :

Corriger l’isolation des tests profils/runtime pour obtenir 100 % des tests backend verts.



Important :

\- Ne pas modifier les fonctionnalités métier inutilement.

\- Ne pas casser la Phase 21.

\- Ne pas supprimer les profils par défaut.

\- Ne pas supprimer les tests existants.

\- Ne pas masquer l’échec en retirant le test.

\- Corriger la cause : isolation runtime / état partagé / fichiers temporaires.



Tâches demandées :



1\. Identifier le test backend qui échoue



Lancer :



npm run test:backend



Puis identifier :

\- fichier de test en échec

\- nom exact du test

\- cause exacte

\- fichier runtime impliqué



2\. Vérifier les fichiers runtime utilisés par les tests



Inspecter :

\- tests/backend/profiles.test.js

\- server/src/services/profiles/profileStore.js

\- server/src/services/profiles/profileEngine.js

\- server/src/services/profiles/profilePermissions.js

\- tests/.runtime/

\- configuration éventuelle de chemins runtime de test



3\. Corriger l’isolation



Mettre en place une stratégie propre :



Option recommandée :

\- utiliser un dossier runtime temporaire par suite de test

\- nettoyer avant chaque suite

\- nettoyer après chaque suite

\- ne jamais utiliser runtime/ réel dans les tests



Exemple attendu :

tests/.runtime/profiles/

tests/.runtime/backup/

tests/.runtime/notifications/



4\. Ajouter ou corriger les variables d’environnement de test



Si nécessaire, définir dans les tests :



PROFILES\_STORE\_PATH=tests/.runtime/profiles/user-profiles.json

PROFILES\_ACTIVE\_PATH=tests/.runtime/profiles/active-profile.json

PROFILES\_AUDIT\_PATH=tests/.runtime/profiles/profile-audit.json



BACKUP\_AUDIT\_PATH=tests/.runtime/backup/backup-audit.json



NOTIFICATIONS\_STORE\_PATH=tests/.runtime/notifications/notifications.json



Important :

Chaque suite doit éviter de polluer une autre suite.



5\. Ajouter un helper de test si utile



Créer si nécessaire :



tests/helpers/runtimeTestUtils.js



Avec fonctions :

\- createTestRuntimeDir(name)

\- resetTestRuntimeDir(name)

\- cleanupTestRuntimeDir(name)

\- setRuntimeEnvForSuite(name, envMap)



6\. Vérifier que les services lisent bien la config au bon moment



Si certains modules lisent les chemins runtime au chargement du module, corriger prudemment :

\- éviter les constantes figées trop tôt

\- permettre aux tests de définir process.env avant import

\- ou exposer une fonction de reset interne sûre uniquement pour les tests



7\. Ajouter un test anti-régression



Ajouter un test qui vérifie :

\- créer/modifier un profil dans une suite ne pollue pas une autre

\- le profil actif est réinitialisé correctement

\- les profils par défaut sont recréés proprement



8\. Validation obligatoire



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check

npm run health



Résultat attendu :

\- backend : 93/93 ou plus, 0 échec

\- frontend : 46/46 ou plus, 0 échec

\- check : OK



9\. Documentation



Créer :



docs/PHASE21B.md



Contenu :

\- problème identifié

\- cause racine

\- correction appliquée

\- stratégie d’isolation runtime

\- commandes de validation

\- résultat final



Mettre à jour README.md si nécessaire avec une courte note :

\- tests runtime isolés dans tests/.runtime/

\- aucun fichier runtime réel utilisé pendant les tests



10\. Rapport final attendu



À la fin, fournir :

\- test en échec identifié

\- cause exacte

\- fichiers modifiés

\- helper ajouté si applicable

\- stratégie d’isolation

\- résultats npm run check

\- confirmation que Phase 21 reste fonctionnelle



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas supprimer de test.

\- Ne pas ignorer l’échec.

\- Ne pas utiliser runtime/ réel pendant les tests.

\- Ne pas exposer de secret.

\- Ne pas casser backup/profiles/notifications/scheduler.

