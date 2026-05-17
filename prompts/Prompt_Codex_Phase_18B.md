Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 18 sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- ancien frontend conservé

\- PWA + mode TV

\- packaging Windows

\- tests automatisés

\- CI GitHub Actions

\- notifications locales

\- scheduler local

\- observability dashboard Phase 18

\- endpoints /api/observability/\*

\- sécurité confirmée : pas de secrets, pas de contenu runtime brut, pas de logs bruts



Objectif Phase 18B :

Ajouter un historique compact des snapshots d’observabilité.



Cette phase doit permettre :

\- de capturer l’état global du système à un instant donné

\- de stocker uniquement un résumé non sensible

\- de consulter les derniers snapshots

\- de calculer des tendances simples

\- d’intégrer l’action au scheduler local

\- d’afficher les tendances dans le frontend Next.js

\- de conserver les règles de sécurité Phase 18



Important :

\- Ne jamais stocker de token.

\- Ne jamais stocker de contenu runtime brut.

\- Ne jamais stocker de contenu de logs.

\- Ne jamais stocker d’IP complète.

\- Ne jamais stocker de chemin absolu complet.

\- Ne jamais lancer d’action sensible.

\- Ne jamais exécuter de tests depuis l’API.

\- Tout reste local.



1\. Variables d’environnement



Mettre à jour `.env.example` :



OBSERVABILITY\_SNAPSHOTS\_ENABLED=true

OBSERVABILITY\_SNAPSHOTS\_PATH=runtime/observability-snapshots.json

OBSERVABILITY\_SNAPSHOTS\_MAX\_ITEMS=200

OBSERVABILITY\_SNAPSHOTS\_NOTIFY\_ON\_WARNING=true

OBSERVABILITY\_SNAPSHOTS\_NOTIFY\_ON\_ERROR=true

OBSERVABILITY\_SNAPSHOTS\_AUTO\_CREATE\_ON\_START=false



Règles :

\- snapshots activés localement par défaut

\- stockage dans runtime/

\- historique limité

\- aucune donnée sensible

\- pas de création automatique au démarrage sauf activation explicite



2\. Service snapshots



Créer :



server/src/services/observability/snapshotStore.js

server/src/services/observability/snapshotEngine.js

server/src/services/observability/snapshotSafety.js



snapshotSafety.js doit contenir :

\- sanitizeSnapshot(input)

\- maskSnapshotSensitiveData(input)

\- validateSnapshotPayload(input)

\- buildSafeSnapshotError(error)



snapshotStore.js doit contenir :

\- loadSnapshots()

\- saveSnapshots(items)

\- addSnapshot(snapshot)

\- listSnapshots(filters)

\- getLatestSnapshot()

\- clearSnapshots()

\- getSnapshotStats()



snapshotEngine.js doit contenir :

\- createSnapshot(source)

\- createSnapshotFromOverview(overview, source)

\- computeTrends()

\- compareWithPreviousSnapshot()

\- notifySnapshotStatus(snapshot)



3\. Fichier runtime



Créer :



runtime/observability-snapshots.json



Initialiser avec :



\[]



Ne jamais versionner ce fichier.

Vérifier que `.gitignore` protège bien :



runtime/\*.json



4\. Modèle snapshot



Chaque snapshot doit contenir uniquement :



{

&nbsp; "id": "obs\_xxx",

&nbsp; "createdAt": "...",

&nbsp; "source": "manual | scheduler | startup",

&nbsp; "status": "ok | warning | error",

&nbsp; "phase": 18,

&nbsp; "backend": {

&nbsp;   "ok": true,

&nbsp;   "uptimeBucket": "short | medium | long",

&nbsp;   "memoryBucket": "low | medium | high"

&nbsp; },

&nbsp; "frontend": {

&nbsp;   "expectedPort": 3001,

&nbsp;   "configured": true

&nbsp; },

&nbsp; "integrations": {

&nbsp;   "adb": "disabled | available | warning | error",

&nbsp;   "dlna": "disabled | available | warning | error",

&nbsp;   "smartThings": "disabled | available | warning | error",

&nbsp;   "streaming": "disabled | available | warning | error"

&nbsp; },

&nbsp; "scheduler": {

&nbsp;   "running": true,

&nbsp;   "activeSchedules": 0

&nbsp; },

&nbsp; "notifications": {

&nbsp;   "totalBucket": "none | low | medium | high",

&nbsp;   "unreadBucket": "none | low | medium | high",

&nbsp;   "securityEventsBucket": "none | low | medium | high"

&nbsp; },

&nbsp; "security": {

&nbsp;   "secretsProtected": true,

&nbsp;   "runtimeHidden": true,

&nbsp;   "apiCacheDisabled": true,

&nbsp;   "sensitiveActionsBlocked": true

&nbsp; },

&nbsp; "runtime": {

&nbsp;   "runtimeFilesBucket": "none | low | medium | high",

&nbsp;   "logsBucket": "none | low | medium | high",

&nbsp;   "portableZipPresent": true

&nbsp; }

}



Important :

\- pas de noms complets de fichiers runtime

\- pas de chemins complets

\- pas de logs bruts

\- pas de secrets

\- pas d’IDs complets

\- pas d’IP complète



5\. Endpoints API



Créer ou compléter :



server/src/routes/observability.js



Ajouter :



GET /api/observability/snapshots

Retourne les derniers snapshots.



POST /api/observability/snapshots

Crée un snapshot manuel depuis l’overview actuel.



GET /api/observability/snapshots/latest

Retourne le dernier snapshot.



GET /api/observability/snapshots/stats

Retourne :

\- total

\- okCount

\- warningCount

\- errorCount

\- lastStatus

\- lastCreatedAt

\- statusChanges

\- mostCommonStatus



GET /api/observability/snapshots/trends

Retourne tendances simples :

\- statusTrend

\- warningFrequency

\- errorFrequency

\- memoryTrend

\- notificationTrend

\- schedulerTrend

\- integrationTrend



DELETE /api/observability/snapshots

Vide l’historique.



GET /api/observability/snapshots/safety

Retourne :

\- localOnly: true

\- runtimeContentHidden: true

\- logsContentHidden: true

\- secretsMasked: true

\- maxItems

\- storagePathMasked



6\. Intégration scheduler



Mettre à jour schedulerActions.js.



Ajouter ou compléter l’action autorisée :



observability.snapshot



Comportement :

\- crée un snapshot via snapshotEngine

\- écrit dans runtime/observability-snapshots.json

\- ajoute une entrée historique scheduler

\- crée une notification si warning/error selon .env

\- ne lance aucun test

\- ne lance aucune action sensible



Ajouter une tâche par défaut désactivée :



Nom :

Snapshot observabilité



Action :

observability.snapshot



Planification :

daily à 21:00



enabled: false par défaut



7\. Notifications



Utiliser notificationEngine Phase 12 :



\- si snapshot status = warning et OBSERVABILITY\_SNAPSHOTS\_NOTIFY\_ON\_WARNING=true

\- si snapshot status = error et OBSERVABILITY\_SNAPSHOTS\_NOTIFY\_ON\_ERROR=true

\- déduplication existante pour éviter le spam



Message exemple :

“Snapshot observabilité : état warning détecté.”



Ne pas inclure de détails sensibles.



8\. Frontend Next.js



Créer ou compléter :



frontend/src/components/observability/

&nbsp; SnapshotHistory.tsx

&nbsp; SnapshotStats.tsx

&nbsp; SnapshotTrends.tsx



Mettre à jour :



ObservabilityPanel.tsx



Ajouter :

\- bouton “Créer snapshot”

\- dernier snapshot

\- nombre total de snapshots

\- répartition OK / Warning / Error

\- tendances simples

\- bouton “Vider historique”

\- message sécurité : “résumés non sensibles uniquement”



Créer ou compléter :



frontend/src/hooks/useObservability.ts



Ajouter :

\- loadSnapshots()

\- createSnapshot()

\- loadSnapshotStats()

\- loadSnapshotTrends()

\- clearSnapshots()



9\. UI



Le dashboard doit afficher :



\- Dernier snapshot

\- Statut

\- Date

\- Source

\- Compteurs OK / Warning / Error

\- Tendance globale

\- Tendance notifications

\- Tendance mémoire

\- Tendance intégrations

\- Bouton créer snapshot

\- Bouton vider historique



Design :

\- cartes simples

\- badges OK / Warning / Error

\- responsive

\- mode TV lisible

\- aucun détail sensible



10\. Types



Mettre à jour :



frontend/src/lib/types.ts



Ajouter :

\- ObservabilitySnapshot

\- SnapshotStats

\- SnapshotTrends

\- SnapshotSource



11\. Tests backend



Créer ou compléter :



tests/backend/observability-snapshots.test.js



Tester :

\- POST /api/observability/snapshots crée un snapshot

\- GET /api/observability/snapshots retourne liste

\- GET /latest retourne dernier

\- GET /stats retourne compteurs

\- GET /trends retourne tendances

\- DELETE vide l’historique

\- safety localOnly true

\- aucune donnée sensible dans snapshot



Vérifier absence :

\- token

\- Bearer

\- IP complète

\- chemin absolu complet

\- runtime brut

\- logs bruts



12\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/SnapshotHistory.test.tsx



Tester :

\- empty state

\- rendu d’un snapshot OK

\- rendu warning/error

\- bouton créer snapshot

\- bouton vider historique

\- absence de secret affiché



13\. Documentation



Créer :



docs/PHASE18B.md



Contenu :

\- objectif Phase 18B

\- modèle snapshot

\- sécurité

\- endpoints

\- scheduler action

\- notifications

\- frontend

\- tests

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 18B

\- endpoints snapshots

\- action scheduler observability.snapshot

\- commandes de test

\- avertissement sécurité



14\. Commandes de test



Ajouter dans README :



curl http://localhost:3000/api/observability/snapshots/safety



curl -X POST http://localhost:3000/api/observability/snapshots



curl http://localhost:3000/api/observability/snapshots



curl http://localhost:3000/api/observability/snapshots/latest



curl http://localhost:3000/api/observability/snapshots/stats



curl http://localhost:3000/api/observability/snapshots/trends



curl -X DELETE http://localhost:3000/api/observability/snapshots



15\. Validation



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check

npm run health



Vérifier manuellement :

\- http://localhost:3000/api/observability/snapshots/safety

\- http://localhost:3000/api/observability/snapshots/stats

\- http://localhost:3001 section Observabilité



16\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- modèle snapshot

\- intégration scheduler

\- intégration notifications

\- composants frontend

\- tests ajoutés

\- résultats npm run check

\- sécurité confirmée

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas activer d’action sensible.

\- Ne pas exécuter de tests depuis l’API.

\- Ne jamais exposer secret/token/IP complète/chemin complet/ID complet.

\- Ne jamais stocker contenu runtime ou logs bruts.

\- Ne pas envoyer de télémétrie cloud.

\- Garder tout local, simple, stable et sécurisé.

