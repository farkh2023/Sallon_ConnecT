Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 17B sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- ancien frontend HTML conservé

\- PWA + mode TV avancé

\- packaging Windows portable

\- tests automatisés backend/frontend/packaging/PowerShell

\- CI GitHub Actions

\- maintenance dépendances Phase 17B documentée

\- notifications locales

\- scheduler local

\- ADB lecture seule sécurisé

\- DLNA découverte seule sécurisée

\- SmartThings sécurisé

\- scènes SmartThings opt-in

\- commandes TV opt-in

\- streaming assisté

\- audits runtime

\- secrets et runtime exclus du Git/ZIP



Objectif Phase 18 :

Créer un tableau d’observabilité global pour Sallon-ConnecT.



Important :

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas casser le frontend Next.js.

\- Ne pas lancer d’action sensible.

\- Ne pas lancer SmartThings, ADB, DLNA ou streaming réel automatiquement.

\- Ne jamais exposer token, secret, IP complète, chemin complet, IMEI, ID complet ou contenu runtime.

\- Ne pas envoyer de télémétrie cloud.

\- Tout doit rester local.



1\. Backend — collecteurs observability



Créer :



server/src/services/observability/healthCollector.js

server/src/services/observability/securityCollector.js

server/src/services/observability/runtimeCollector.js

server/src/services/observability/testCollector.js

server/src/services/observability/logCollector.js

server/src/routes/observability.js



2\. Endpoints à ajouter



Créer les endpoints :



GET /api/observability/overview

GET /api/observability/health

GET /api/observability/security

GET /api/observability/runtime

GET /api/observability/tests

GET /api/observability/logs

GET /api/observability/safety



3\. GET /api/observability/overview



Retour attendu :



{

&nbsp; "status": "ok | warning | error",

&nbsp; "phase": 18,

&nbsp; "backend": {},

&nbsp; "frontend": {},

&nbsp; "integrations": {},

&nbsp; "scheduler": {},

&nbsp; "notifications": {},

&nbsp; "security": {},

&nbsp; "runtime": {},

&nbsp; "tests": {},

&nbsp; "lastUpdatedAt": "..."

}



La synthèse doit rester non sensible.



4\. healthCollector.js



Collecter :

\- uptime backend

\- version Node

\- mémoire utilisée

\- port backend

\- frontend attendu sur localhost:3001

\- environnement local

\- disponibilité /api/health

\- phase actuelle



Ne pas faire d’appel externe.



5\. securityCollector.js



Vérifier :

\- .gitignore protège .env

\- .gitignore protège runtime/\*.json

\- .gitignore protège frontend/.env.local

\- service worker ne cache pas /api/\*

\- SmartThings reste opt-in

\- TV commands restent opt-in

\- streaming confirmation obligatoire

\- ADB lecture seule

\- DLNA lecture seule

\- scheduler bloque les actions sensibles

\- logs JSON ignorés si logs/\*.json ajouté



Ne jamais afficher le contenu de .env.



6\. runtimeCollector.js



Inspecter :

\- runtime/

\- logs/

\- dist/

\- dernier ZIP portable si présent

\- fichiers .gitkeep

\- taille totale arrondie

\- nombre de fichiers runtime JSON



Ne jamais retourner le contenu des fichiers runtime.



Masquer :

\- chemins absolus

\- noms suspects

\- IDs longs



7\. testCollector.js



Lire package.json et détecter :

\- test

\- test:backend

\- test:frontend

\- test:packaging

\- test:windows

\- build:frontend

\- check



Détecter aussi :

\- jest.config.js

\- frontend/vitest.config.ts

\- .github/workflows/tests.yml

\- docs/PHASE17.md

\- docs/PHASE17B.md



Ne pas exécuter les tests depuis l’API.



8\. logCollector.js



Lister seulement :

\- nombre de fichiers logs

\- noms sûrs

\- tailles arrondies

\- dernière modification



Ne jamais retourner le contenu complet des logs.

Ne jamais retourner de token ou secret.



9\. Route safety



GET /api/observability/safety doit retourner :



{

&nbsp; "localOnly": true,

&nbsp; "secretsMasked": true,

&nbsp; "noCloudTelemetry": true,

&nbsp; "sensitiveActionsBlocked": true,

&nbsp; "apiCacheDisabled": true,

&nbsp; "runtimeContentHidden": true

}



10\. Intégration server.js



Monter :



/api/observability



Ne pas casser les routes existantes.



11\. Frontend Next.js



Créer :



frontend/src/components/observability/

&nbsp; ObservabilityPanel.tsx

&nbsp; HealthOverview.tsx

&nbsp; SecurityOverview.tsx

&nbsp; RuntimeOverview.tsx

&nbsp; TestsOverview.tsx

&nbsp; LogsOverview.tsx

&nbsp; ObservabilityMetric.tsx

&nbsp; ObservabilityStatusBadge.tsx



Créer :



frontend/src/hooks/useObservability.ts



Mettre à jour :



frontend/src/lib/types.ts

frontend/src/components/layout/AppShell.tsx

frontend/src/components/layout/TopNav.tsx



12\. Interface attendue



Ajouter une section :



“Observabilité”



Elle doit afficher :

\- statut global

\- backend

\- frontend

\- intégrations

\- sécurité

\- runtime

\- logs

\- tests

\- scheduler

\- notifications

\- dernier refresh

\- bouton “Actualiser”



Ajouter un raccourci clavier sûr :



H = ouvrir Observabilité / Health Dashboard



13\. Design



Utiliser Tailwind.



Prévoir :

\- cartes lisibles

\- badges OK / Warning / Error

\- responsive mobile

\- mode TV lisible

\- focus visible

\- aucune donnée sensible affichée



14\. Scheduler



Ajouter une action autorisée :



observability.snapshot



Elle doit :

\- collecter /api/observability/overview ou appeler la logique collector

\- enregistrer un résumé non sensible dans l’historique scheduler

\- créer une notification si status warning/error

\- ne jamais lancer de test automatiquement

\- ne jamais lancer d’action sensible



Mettre à jour la liste des actions autorisées/interdites.



15\. Notifications



Utiliser Phase 12 :

\- notifier si l’état global passe à warning ou error

\- éviter le spam grâce à la déduplication existante

\- ne pas notifier à chaque refresh si l’état n’a pas changé



16\. Tests backend



Créer :



tests/backend/observability.test.js



Tester :

\- GET /api/observability/overview

\- GET /api/observability/health

\- GET /api/observability/security

\- GET /api/observability/runtime

\- GET /api/observability/tests

\- GET /api/observability/logs

\- GET /api/observability/safety



Vérifier :

\- JSON valide

\- localOnly true dans safety

\- aucun token

\- aucun Bearer

\- aucune IP complète

\- aucun chemin absolu complet

\- aucun contenu runtime brut



17\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/ObservabilityPanel.test.tsx



Tester :

\- rendu loading

\- rendu status ok

\- rendu warning/error

\- bouton refresh

\- aucun secret affiché



Mocker fetch.

Ne pas dépendre du backend réel.



18\. Documentation



Créer :



docs/PHASE18.md



Contenu :

\- objectif Phase 18

\- architecture observability

\- endpoints ajoutés

\- collecteurs backend

\- composants frontend

\- sécurité

\- scheduler snapshot

\- notifications

\- tests ajoutés

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 18

\- endpoints observability

\- raccourci H

\- commandes de test

\- sécurité



19\. Scripts optionnels



Créer si utile :



scripts/health-check.js



Ce script doit appeler :

\- http://localhost:3000/api/health

\- http://localhost:3000/api/observability/overview

\- http://localhost:3000/api/observability/safety



Ajouter script package.json si utile :



"health": "node scripts/health-check.js"



20\. Commandes de validation



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check



Tester manuellement :



http://localhost:3000/api/observability/overview

http://localhost:3000/api/observability/safety

http://localhost:3001



21\. Critères d’acceptation



La Phase 18 est réussie si :

\- endpoints observability fonctionnent

\- frontend affiche la section Observabilité

\- raccourci H fonctionne

\- aucune donnée sensible n’est affichée

\- runtime n’est jamais exposé

\- logs ne sont pas exposés en contenu brut

\- scheduler accepte observability.snapshot comme action sûre

\- notifications warning/error fonctionnent sans spam

\- npm run check passe

\- backend et ancien frontend restent fonctionnels



22\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- composants frontend ajoutés

\- hooks ajoutés

\- action scheduler ajoutée

\- tests ajoutés

\- résultats npm run check

\- sécurité confirmée

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas activer d’action sensible.

\- Ne jamais exposer secret/token/IP complète/chemin complet/ID complet.

\- Ne pas exécuter les tests depuis l’API.

\- Ne pas envoyer de télémétrie cloud.

\- Garder tout local, simple, stable et sécurisé.

