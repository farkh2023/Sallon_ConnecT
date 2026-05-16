Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 15 sont terminées.



État actuel :

\- backend Express local sur http://localhost:3000

\- ancien frontend HTML conservé sur http://localhost:3000

\- frontend Next.js TypeScript sur http://localhost:3001

\- PWA manifest

\- page offline

\- service worker sécurisé

\- mode TV avancé

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- streaming assisté

\- audits runtime ignorés par Git



Objectif Phase 16 :

Créer un packaging Windows local pour lancer Sallon-ConnecT facilement depuis Windows.



Cette phase doit rendre le projet utilisable par double-clic, avec scripts sûrs, diagnostic local, raccourcis et archive portable.



Important :

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas supprimer le frontend Next.js.

\- Ne pas inclure .env réel dans le package.

\- Ne pas inclure runtime/\*.json dans le package.

\- Ne pas inclure node\_modules dans Git.

\- Ne pas exposer token, IMEI, IP complète, ID complet ou chemin complet.

\- Ne pas activer d’action sensible.

\- Ne pas installer de service Windows automatiquement sans confirmation.

\- Rester local, simple, stable et sécurisé.



1\. Structure à créer



Créer :



scripts/

&nbsp; windows/

&nbsp;   install-deps.ps1

&nbsp;   start-sallon-connect.ps1

&nbsp;   stop-sallon-connect.ps1

&nbsp;   status-sallon-connect.ps1

&nbsp;   build-frontend.ps1

&nbsp;   package-portable.ps1

&nbsp;   create-desktop-shortcut.ps1

&nbsp;   open-dashboard.ps1

&nbsp;   diagnose.ps1

&nbsp;   start-sallon-connect.bat

&nbsp;   stop-sallon-connect.bat

&nbsp;   status-sallon-connect.bat

&nbsp;   open-dashboard.bat



Créer :



docs/

&nbsp; PHASE16.md



Créer si utile :



dist/

&nbsp; .gitkeep



2\. install-deps.ps1



Objectif :

Installer les dépendances racine et frontend.



Comportement :

\- vérifier que Node.js est installé

\- afficher la version de node et npm

\- lancer npm install à la racine

\- lancer npm install dans frontend/

\- ne jamais installer globalement sauf nécessité explicite

\- afficher un résumé clair



Commandes internes attendues :

\- npm install

\- cd frontend ; npm install



3\. start-sallon-connect.ps1



Objectif :

Lancer backend + frontend Next.js.



Comportement :

\- démarrer le backend sur :3000

\- démarrer le frontend Next.js sur :3001

\- écrire les logs dans logs/

\- créer logs/ si absent

\- vérifier si les ports sont déjà utilisés

\- si un service tourne déjà, ne pas le relancer en double

\- ouvrir automatiquement http://localhost:3001

\- afficher les URLs :

&nbsp; - Backend : http://localhost:3000

&nbsp; - Frontend Next : http://localhost:3001

&nbsp; - Ancien frontend : http://localhost:3000

\- utiliser Start-Process PowerShell ou npm scripts existants



Important :

\- ne pas afficher .env

\- ne pas afficher tokens

\- ne pas supprimer de fichiers



4\. stop-sallon-connect.ps1



Objectif :

Arrêter proprement les processus utilisant les ports 3000 et 3001.



Comportement :

\- détecter les PID sur ports 3000 et 3001

\- demander confirmation avant arrêt si plusieurs processus sont trouvés

\- arrêter seulement les processus liés au projet si possible

\- afficher ce qui est arrêté

\- ne jamais tuer des processus système



5\. status-sallon-connect.ps1



Objectif :

Afficher l’état du système.



Vérifier :

\- port 3000

\- port 3001

\- http://localhost:3000/api/health

\- http://localhost:3001

\- existence .env

\- existence frontend/.env.local

\- existence runtime/

\- existence logs/

\- dernière modification des logs



Résultat attendu :

\- tableau lisible PowerShell

\- statut OK / WARNING / ERROR



6\. build-frontend.ps1



Objectif :

Compiler le frontend Next.js.



Comportement :

\- cd frontend

\- npm run lint

\- npm run build

\- afficher succès / erreur

\- ne pas modifier le backend



7\. package-portable.ps1



Objectif :

Créer une archive portable ZIP.



Sortie :

dist/Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip



Inclure :

\- assets/

\- data/

\- docs/

\- frontend/

\- scripts/

\- server/

\- index.html

\- server.js

\- package.json

\- package-lock.json si présent

\- README.md

\- .env.example

\- frontend/.env.example

\- sallon-connect-hub.html si présent



Exclure :

\- .git/

\- .env

\- .env.local

\- frontend/.env.local

\- node\_modules/

\- frontend/node\_modules/

\- .next/

\- frontend/.next/

\- runtime/\*.json

\- logs/

\- dist/\*.zip

\- fichiers temporaires

\- tokens

\- clés

\- \*.pem

\- \*.key



Créer :

\- runtime/.gitkeep dans l’archive

\- logs/.gitkeep dans l’archive



8\. create-desktop-shortcut.ps1



Objectif :

Créer un raccourci Bureau Windows.



Raccourci :

“Sallon-ConnecT”



Il doit lancer :

scripts/windows/start-sallon-connect.bat



Icône :

\- utiliser une icône existante si disponible

\- sinon laisser l’icône par défaut



Ne pas demander de privilèges admin.



9\. open-dashboard.ps1



Objectif :

Ouvrir le tableau de bord.



Comportement :

\- tester http://localhost:3001

\- si disponible, ouvrir frontend Next.js

\- sinon tester http://localhost:3000

\- sinon afficher message : “Sallon-ConnecT ne semble pas démarré”



10\. diagnose.ps1



Objectif :

Diagnostic complet local.



Vérifier :

\- version Windows

\- version PowerShell

\- node -v

\- npm -v

\- git --version

\- ports 3000/3001

\- backend health

\- frontend status

\- présence des dossiers importants

\- présence de .env.example

\- présence de README.md

\- présence docs/PHASE15.md et docs/PHASE16.md

\- vérifier que .env n’est pas vide si présent

\- vérifier que runtime JSON n’est pas destiné au Git



Sortie :

\- console lisible

\- fichier logs/diagnostic-YYYYMMDD-HHMM.txt



Important :

\- masquer les secrets

\- ne jamais imprimer le contenu .env complet



11\. Scripts .bat



Créer des wrappers simples :



start-sallon-connect.bat

stop-sallon-connect.bat

status-sallon-connect.bat

open-dashboard.bat



Chaque .bat doit appeler le script PowerShell correspondant avec :



powershell -ExecutionPolicy Bypass -File ...



12\. Logs



Créer :



logs/.gitkeep



Mettre à jour .gitignore :



logs/\*.log

logs/\*.txt

!logs/.gitkeep



Conserver :

logs/.gitkeep



13\. README



Mettre à jour README.md avec une section Phase 16 :



Inclure :



Installation dépendances :



scripts\\windows\\install-deps.bat



Ou :



powershell -ExecutionPolicy Bypass -File scripts\\windows\\install-deps.ps1



Lancement :



scripts\\windows\\start-sallon-connect.bat



Statut :



scripts\\windows\\status-sallon-connect.bat



Arrêt :



scripts\\windows\\stop-sallon-connect.bat



Créer raccourci Bureau :



powershell -ExecutionPolicy Bypass -File scripts\\windows\\create-desktop-shortcut.ps1



Créer package portable :



powershell -ExecutionPolicy Bypass -File scripts\\windows\\package-portable.ps1



14\. Documentation PHASE16



Créer docs/PHASE16.md avec :

\- objectif

\- architecture packaging Windows

\- scripts disponibles

\- sécurité

\- logs

\- package portable

\- raccourci Bureau

\- limites actuelles

\- prochaines étapes



15\. Tests attendus



Vérifier :



\- install-deps.ps1 fonctionne

\- build-frontend.ps1 fonctionne

\- start-sallon-connect.ps1 démarre backend + frontend

\- open-dashboard.ps1 ouvre le bon dashboard

\- status-sallon-connect.ps1 affiche OK

\- stop-sallon-connect.ps1 arrête les services

\- diagnose.ps1 crée un rapport

\- package-portable.ps1 crée un ZIP

\- ZIP ne contient pas :

&nbsp; - .env

&nbsp; - frontend/.env.local

&nbsp; - node\_modules

&nbsp; - frontend/node\_modules

&nbsp; - runtime/\*.json

&nbsp; - logs/\*.log

&nbsp; - .git



16\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- scripts ajoutés

\- commandes de lancement

\- résultat des tests

\- contenu du ZIP

\- exclusions vérifiées

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à Electron.

\- Ne pas créer de MSI.

\- Ne pas installer de service Windows.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas casser le backend.

\- Ne jamais inclure .env réel dans le ZIP.

\- Ne jamais inclure runtime/\*.json dans le ZIP.

\- Ne jamais afficher de secret.

\- Garder le packaging simple, portable et sécurisé.

