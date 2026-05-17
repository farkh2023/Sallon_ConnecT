Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 21B sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- ancien frontend HTML conservé

\- PWA + mode TV

\- packaging Windows portable

\- tests automatisés backend/frontend/packaging/PowerShell

\- CI GitHub Actions

\- observability dashboard

\- snapshots + graphes temporels

\- profils utilisateurs locaux

\- backup / restore local sécurisé

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- scènes SmartThings opt-in

\- commandes TV opt-in

\- streaming assisté

\- audits runtime

\- sécurité confirmée : aucun secret, aucune IP complète, aucun chemin complet, aucun ID complet exposé



Objectif Phase 22 :

Préparer le projet pour une publication GitHub propre, professionnelle et sécurisée.



Important :

\- Ne jamais pousser de secret.

\- Ne jamais inclure .env réel.

\- Ne jamais inclure frontend/.env.local.

\- Ne jamais inclure runtime/\*.json.

\- Ne jamais inclure backups/\*.zip.

\- Ne jamais inclure logs/\*.json, logs/\*.txt, logs/\*.log.

\- Ne jamais inclure node\_modules.

\- Ne jamais inclure frontend/node\_modules.

\- Ne jamais inclure .next ou frontend/.next.

\- Ne pas publier de token SmartThings.

\- Ne pas publier d’IMEI, numéro de téléphone, numéro de série, IP complète ou chemin personnel.

\- Garder le projet local, sûr et reproductible.



1\. Audit Git avant publication



Créer un script :



scripts/release/preflight-github.ps1



Il doit vérifier :

\- git status

\- branche courante

\- présence README.md

\- présence .gitignore

\- présence .env.example

\- présence frontend/.env.example

\- présence docs/

\- présence .github/workflows/tests.yml

\- présence package.json

\- présence frontend/package.json

\- absence .env suivi par Git

\- absence frontend/.env.local suivi par Git

\- absence runtime/\*.json suivi par Git

\- absence backups/\*.zip suivi par Git

\- absence logs/\*.json/log/txt suivi par Git

\- absence node\_modules suivi par Git

\- absence frontend/node\_modules suivi par Git

\- absence .next/frontend/.next suivi par Git

\- absence fichiers \*.pem, \*.key, \*.p12, \*.crt suivis par Git

\- absence chaînes sensibles connues :

&nbsp; - Bearer

&nbsp; - SMARTTHINGS\_TOKEN=

&nbsp; - IMEI

&nbsp; - phone

&nbsp; - telephone

&nbsp; - numéro de téléphone

&nbsp; - R5C

&nbsp; - 353079

&nbsp; - /Users/

&nbsp; - C:\\Users\\



Le script doit :

\- afficher OK/WARNING/ERROR

\- échouer si secret ou fichier interdit détecté

\- ne jamais afficher la valeur complète d’un secret

\- produire un rapport :

&nbsp; logs/github-preflight-YYYYMMDD-HHMM.txt



2\. Script release local



Créer :



scripts/release/prepare-release.ps1



Il doit :

\- lancer npm run check

\- lancer npm run health si backend actif, sinon afficher warning non bloquant

\- lancer le preflight GitHub

\- vérifier docs principales

\- vérifier ZIP portable récent si présent

\- générer un résumé release local

\- ne pas pousser automatiquement



Sortie :

logs/release-prep-YYYYMMDD-HHMM.txt



3\. Documentation GitHub



Créer ou mettre à jour :



README.md

CHANGELOG.md

ROADMAP.md

SECURITY.md

CONTRIBUTING.md

docs/ARCHITECTURE.md

docs/SECURITY\_MODEL.md

docs/LOCAL\_SETUP.md

docs/RELEASE\_CHECKLIST.md



README.md doit contenir :

\- titre Sallon-ConnecT

\- badges CI

\- description courte

\- capture ou emplacement prévu pour capture

\- fonctionnalités principales

\- architecture

\- démarrage rapide Windows

\- démarrage backend/frontend

\- scripts utiles

\- sécurité

\- phases réalisées

\- commandes test

\- lien vers docs

\- avertissement données sensibles



CHANGELOG.md :

\- ajouter une entrée v0.1.0

\- résumer Phases 1 à 22

\- mentionner backend, frontend, PWA, tests, backup, observability



ROADMAP.md :

\- prochaines phases :

&nbsp; - Phase 23 Documentation utilisateur finale

&nbsp; - Phase 24 Assistant vocal local

&nbsp; - Phase 25 Profils avancés / permissions fines

&nbsp; - Phase 26 Installateur Windows

&nbsp; - Phase 27 Mode multi-pièces

&nbsp; - Phase 28 Intégrations domotiques avancées



SECURITY.md :

\- modèle local

\- secrets dans .env seulement

\- runtime ignoré

\- SmartThings opt-in

\- ADB lecture seule

\- DLNA sécurisé

\- streaming assisté

\- backup sans secrets

\- procédure de signalement local



CONTRIBUTING.md :

\- installation

\- tests

\- conventions commits

\- règles sécurité

\- interdiction de secrets

\- npm run check obligatoire



docs/ARCHITECTURE.md :

\- backend Express

\- frontend Next.js

\- runtime local

\- modules

\- APIs

\- sécurité

\- PWA

\- scheduler

\- backup

\- observability



docs/SECURITY\_MODEL.md :

\- défense en profondeur

\- .env

\- allowlists

\- confirmations

\- audits

\- profils

\- backup

\- tests

\- CI



docs/LOCAL\_SETUP.md :

\- prérequis Node 22.13+

\- npm install

\- frontend npm install

\- lancement scripts Windows

\- lancement manuel

\- ports 3000/3001

\- dépannage



docs/RELEASE\_CHECKLIST.md :

\- npm run check

\- npm run health

\- package portable

\- preflight GitHub

\- git status propre

\- tag

\- GitHub release



4\. Badges README



Ajouter badges :

\- Tests GitHub Actions

\- Node.js 22.x

\- Local-first

\- PWA

\- Security: no secrets



Le badge CI doit pointer vers :



.github/workflows/tests.yml



Ne pas utiliser de badge externe nécessitant secret.



5\. GitHub Actions



Vérifier ou améliorer :



.github/workflows/tests.yml



Le workflow doit :

\- tourner sur push/pull\_request

\- utiliser Windows latest

\- Node 22.x

\- npm ci

\- npm run lint

\- npm run test:backend

\- npm run test:frontend

\- npm run test:packaging

\- npm run test:windows

\- npm run build:frontend



Ajouter si utile :

\- upload artifact des rapports de tests non sensibles

\- ne pas uploader logs contenant chemins ou secrets

\- ne jamais exécuter actions sensibles réelles



6\. Git ignore final



Vérifier .gitignore.



Il doit contenir au minimum :

\- .env

\- .env.local

\- frontend/.env.local

\- node\_modules/

\- frontend/node\_modules/

\- .next/

\- frontend/.next/

\- runtime/\*.json

\- backups/\*.zip

\- backups/\*.json

\- logs/\*.log

\- logs/\*.txt

\- logs/\*.json

\- dist/\*.zip

\- tests/.runtime/\*

\- \*.pem

\- \*.key

\- \*.p12

\- \*.crt



Conserver :

\- runtime/.gitkeep

\- backups/.gitkeep

\- logs/.gitkeep

\- dist/.gitkeep

\- tests/.runtime/.gitkeep



7\. Nettoyage package



Vérifier :

\- package.json racine

\- frontend/package.json



Ajouter metadata si utile :

\- name

\- version: 0.1.0

\- description

\- private: true ou false selon stratégie

\- scripts propres



Important :

Par défaut, garder private: true si le projet n’est pas destiné à npm.



8\. Version



Créer ou vérifier un fichier :



VERSION



Contenu :

0.1.0



Créer ou mettre à jour :



docs/VERSIONING.md



Expliquer :

\- v0.1.0 = premier prototype local complet

\- versionnement semver

\- tags Git recommandés



9\. Tests validation



Lancer :



npm run check

npm run test:backend

npm run test:frontend

npm run test:packaging

npm run test:windows

npm run build:frontend



Puis lancer :



powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1

powershell -ExecutionPolicy Bypass -File scripts/release/prepare-release.ps1



10\. Préparer commit



Ne pas pousser automatiquement.



Afficher commandes recommandées :



git status

git add .

git commit -m "Prepare v0.1.0 GitHub release"



Puis proposer :



git tag v0.1.0



Ne pas exécuter git push automatiquement sauf demande explicite.



11\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- docs ajoutées

\- scripts release ajoutés

\- badges ajoutés

\- sécurité vérifiée

\- résultats npm run check

\- résultat preflight

\- commandes Git recommandées

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas pousser automatiquement.

\- Ne pas créer de remote automatiquement.

\- Ne jamais afficher de secret.

\- Ne jamais inclure .env réel.

\- Ne jamais inclure runtime/\*.json.

\- Ne jamais inclure backup ZIP.

\- Ne jamais inclure logs.

\- Ne jamais exposer données personnelles.

\- Garder la publication GitHub propre, locale et sécurisée.

