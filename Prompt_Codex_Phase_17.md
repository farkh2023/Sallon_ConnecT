Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 16 sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- ancien frontend HTML conservé

\- frontend Next.js sur http://localhost:3001

\- PWA + mode TV avancé

\- scripts Windows PowerShell + .bat

\- packaging ZIP portable

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- scènes SmartThings opt-in

\- commandes TV opt-in

\- streaming assisté

\- audits runtime

\- service worker sécurisé

\- runtime et secrets exclus du ZIP



Objectif Phase 17 :

Ajouter une suite de tests automatisés complète pour sécuriser les évolutions futures.



Important :

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas casser les scripts Windows.

\- Ne pas lancer de vraies commandes ADB.

\- Ne pas lancer de vraie découverte DLNA agressive.

\- Ne pas appeler SmartThings réel dans les tests.

\- Ne pas envoyer de commande TV.

\- Ne pas exécuter de scène réelle.

\- Ne pas lancer de streaming réel.

\- Ne pas utiliser de token réel.

\- Ne pas dépendre d’Internet dans les tests.

\- Utiliser mocks/stubs/fakes pour les intégrations externes.



1\. Choix des outils



Backend :

\- utiliser Jest + Supertest si déjà compatible

\- sinon les ajouter comme devDependencies

\- tests Node.js en local



Frontend Next.js :

\- utiliser Vitest + React Testing Library si compatible

\- sinon Jest + Testing Library

\- préférer une configuration simple et stable



Scripts Windows :

\- ajouter des tests PowerShell légers si possible

\- au minimum ajouter un script de validation syntaxique



Packaging :

\- ajouter un test Node ou PowerShell qui inspecte le ZIP portable



2\. Structure cible



Créer :



tests/

&nbsp; backend/

&nbsp;   health.test.js

&nbsp;   notifications.test.js

&nbsp;   scheduler.test.js

&nbsp;   smartthings-safety.test.js

&nbsp;   tv-commands-safety.test.js

&nbsp;   streaming-safety.test.js

&nbsp;   adb-safety.test.js

&nbsp;   dlna-safety.test.js

&nbsp; integration/

&nbsp;   api-contracts.test.js

&nbsp;   security-regression.test.js

&nbsp; packaging/

&nbsp;   portable-zip.test.js

&nbsp; windows/

&nbsp;   validate-powershell.ps1



Créer côté frontend :



frontend/src/\_\_tests\_\_/

&nbsp; api.test.ts

&nbsp; safety.test.ts

&nbsp; components/

&nbsp;   AppShell.test.tsx

&nbsp;   OfflineStatus.test.tsx

&nbsp;   NotificationsPanel.test.tsx

&nbsp;   SchedulerPanel.test.tsx



3\. Scripts package.json racine



Ajouter ou compléter :



"test": "npm run test:backend \&\& npm run test:frontend \&\& npm run test:packaging",

"test:backend": "jest --runInBand",

"test:frontend": "cd frontend \&\& npm test",

"test:packaging": "node tests/packaging/portable-zip.test.js",

"test:windows": "powershell -ExecutionPolicy Bypass -File tests/windows/validate-powershell.ps1",

"lint": "npm run lint:frontend",

"lint:frontend": "cd frontend \&\& npm run lint",

"build": "npm run build:frontend",

"build:frontend": "cd frontend \&\& npm run build",

"check": "npm run lint \&\& npm run test \&\& npm run build"



4\. Tests backend santé



Tester :

\- GET /api/health retourne status ok

\- serveur exportable/testable si possible

\- aucune donnée sensible dans health

\- phase courante cohérente



5\. Tests notifications



Tester :

\- création notification sanitizée

\- masquage IP

\- masquage token

\- masquage IMEI

\- déduplication

\- mark read

\- stats

\- clear

\- safety localOnly true

\- firebase/cloud false



6\. Tests scheduler



Tester :

\- actions autorisées listées

\- actions sensibles bloquées

\- création tâche action autorisée

\- rejet tâche action interdite streaming.play

\- run manuel action system.healthCheck

\- historique écrit

\- pas d’exécution parallèle

\- notificationId généré si notifications activées



7\. Tests SmartThings safety



Tester sans token réel :

\- token absent → missing\_token

\- token jamais retourné

\- IDs masqués

\- opérations lecture seules autorisées

\- opérations écriture bloquées

\- scene execute bloqué par défaut

\- scène non allowlistée refusée

\- confirmation manquante refusée

\- preview scène non destructive



8\. Tests TV commands safety



Tester :

\- commandes TV désactivées par défaut

\- TV non allowlistée refusée

\- commande non allowlistée refusée

\- confirmation manquante refusée

\- volume bloqué

\- keypad bloqué

\- source/input bloqué

\- preview non destructive

\- audit créé uniquement en cas prévu



9\. Tests streaming safety



Tester :

\- streaming désactivé par défaut

\- dossier non configuré refusé

\- traversal ../ bloqué

\- extension interdite bloquée

\- taille maximale respectée

\- renderer non allowlisté refusé

\- confirmation manquante refusée

\- chemins masqués

\- aucun chemin absolu complet retourné



10\. Tests ADB safety



Tester :

\- ADB désactivé par défaut

\- allowlist commandes

\- adb pull bloqué

\- adb push bloqué

\- rm bloqué

\- /data/data bloqué

\- IDs masqués

\- sortie nettoyée



11\. Tests DLNA safety



Tester :

\- DLNA désactivé par défaut

\- IP publique refusée

\- IP locale acceptée puis masquée

\- LOCATION non locale refusée

\- actions SOAP bloquées

\- réponse SSDP nettoyée

\- XML description nettoyée



12\. Tests API contracts



Tester les endpoints principaux avec Supertest :

\- /api/health

\- /api/notifications/safety

\- /api/scheduler/safety

\- /api/adb/safety

\- /api/dlna/safety

\- /api/smartthings/safety

\- /api/streaming/policy



Chaque endpoint doit retourner JSON et ne pas contenir :

\- token

\- Bearer

\- IMEI

\- chemin absolu complet

\- IP complète non masquée



13\. Tests frontend



Créer tests simples :

\- api.ts construit les URLs correctement

\- api.ts utilise no-store

\- safety.ts masque token/IP/chemin

\- AppShell rend les sections principales

\- OfflineStatus affiche backend indisponible si mock fetch échoue

\- NotificationsPanel affiche empty state

\- SchedulerPanel affiche statut chargé depuis mock API



Important :

\- mocker fetch

\- ne pas dépendre du backend réel

\- ne pas tester de vraie PWA install

\- ne pas enregistrer réellement le service worker dans les tests



14\. Tests service worker



Ajouter test simple ou script de lecture :

\- vérifier que sw.js contient une règle pour ne pas cacher /api/

\- vérifier qu’il ne cache pas runtime

\- vérifier qu’il ne cache pas smartthings/adb/dlna/streaming/scheduler API

\- vérifier présence fallback /offline



15\. Tests packaging ZIP



Le test doit :

\- lancer ou simuler package-portable.ps1 si possible

\- ou inspecter le ZIP existant dans dist/

\- vérifier absence :

&nbsp; - .env

&nbsp; - .env.local

&nbsp; - frontend/.env.local

&nbsp; - .git

&nbsp; - node\_modules

&nbsp; - frontend/node\_modules

&nbsp; - .next

&nbsp; - frontend/.next

&nbsp; - runtime/\*.json

&nbsp; - logs/\*.log

&nbsp; - logs/\*.txt

&nbsp; - \*.pem

&nbsp; - \*.key

\- vérifier présence :

&nbsp; - README.md

&nbsp; - .env.example

&nbsp; - frontend/.env.example

&nbsp; - scripts/windows/start-sallon-connect.bat

&nbsp; - runtime/.gitkeep

&nbsp; - logs/.gitkeep



16\. Tests PowerShell



Créer :



tests/windows/validate-powershell.ps1



Il doit :

\- lister scripts/windows/\*.ps1

\- parser chaque script avec PowerShell AST

\- échouer si syntaxe invalide

\- ne pas exécuter les scripts dangereux

\- afficher résumé



17\. Documentation



Créer :



docs/PHASE17.md



Contenu :

\- objectif Phase 17

\- architecture tests

\- tests backend

\- tests frontend

\- tests sécurité

\- tests packaging

\- tests Windows

\- commandes

\- limites

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 17

\- commandes :

&nbsp; - npm test

&nbsp; - npm run test:backend

&nbsp; - npm run test:frontend

&nbsp; - npm run test:packaging

&nbsp; - npm run test:windows

&nbsp; - npm run check



18\. CI GitHub Actions



Créer :



.github/workflows/tests.yml



Workflow :

\- name: Tests

\- on push et pull\_request

\- Windows latest au minimum

\- Node.js 22.x

\- npm ci

\- npm run lint

\- npm run test:backend

\- npm run test:frontend

\- npm run test:windows

\- npm run build:frontend



Important :

\- ne pas exiger de vrais tokens

\- variables env fictives uniquement

\- ne pas lancer SmartThings réel

\- ne pas lancer ADB réel

\- ne pas lancer DLNA réel

\- ne pas lancer streaming réel



19\. Résultats attendus



À la fin, exécuter :



npm run test:backend

npm run test:frontend

npm run test:packaging

npm run test:windows

npm run build:frontend



Puis si possible :



npm run check



20\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- outils de test ajoutés

\- scripts npm ajoutés

\- tests backend ajoutés

\- tests frontend ajoutés

\- tests sécurité ajoutés

\- tests packaging ajoutés

\- tests Windows ajoutés

\- workflow CI ajouté

\- résultats des commandes

\- prochaines recommandations



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas lancer de vraie action sensible.

\- Ne jamais utiliser de vrai token.

\- Ne jamais appeler SmartThings réel dans les tests.

\- Ne jamais lancer de commande TV réelle.

\- Ne jamais lancer de streaming réel.

\- Ne jamais cacher ou exposer données sensibles.

\- Garder les tests rapides, locaux et reproductibles.

