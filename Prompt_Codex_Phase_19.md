Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 18B sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- observability dashboard Phase 18

\- snapshots d’observabilité Phase 18B

\- endpoints /api/observability/snapshots/\*

\- tests backend/frontend OK

\- sécurité confirmée : snapshots non sensibles uniquement



Objectif Phase 19 :

Ajouter un graphe temporel d’observabilité dans le frontend Next.js, basé sur l’historique des snapshots.



Important :

\- Ne pas stocker de données sensibles.

\- Ne pas afficher de token.

\- Ne pas afficher d’IP complète.

\- Ne pas afficher de chemin complet.

\- Ne pas afficher d’ID complet.

\- Ne pas exposer de contenu runtime ou logs bruts.

\- Ne pas lancer d’action sensible.

\- Ne pas exécuter de tests depuis l’API.

\- Ne pas envoyer de télémétrie cloud.

\- Tout reste local.



1\. Choix graphique



Utiliser Recharts si déjà compatible avec le projet Next.js.



Installer si nécessaire :



cd frontend

npm install recharts



Ne pas utiliser de service externe de graphique.

Ne pas charger de script CDN.



2\. Backend — endpoint timeline



Compléter les endpoints observability.



Ajouter :



GET /api/observability/snapshots/timeline



Query params optionnels :

\- limit=50

\- status=ok|warning|error

\- source=manual|scheduler|startup

\- from=ISO\_DATE

\- to=ISO\_DATE



Retourner une liste compacte :



{

&nbsp; "items": \[

&nbsp;   {

&nbsp;     "id": "obs\_xxx",

&nbsp;     "createdAt": "...",

&nbsp;     "source": "manual",

&nbsp;     "status": "ok",

&nbsp;     "statusScore": 1,

&nbsp;     "memoryScore": 1,

&nbsp;     "notificationScore": 0,

&nbsp;     "securityScore": 1,

&nbsp;     "integrationScore": 1,

&nbsp;     "schedulerScore": 1,

&nbsp;     "runtimeScore": 1

&nbsp;   }

&nbsp; ],

&nbsp; "summary": {

&nbsp;   "total": 10,

&nbsp;   "ok": 8,

&nbsp;   "warning": 2,

&nbsp;   "error": 0

&nbsp; }

}



Scores :

\- statusScore : ok=1, warning=0.5, error=0

\- memoryScore : low=1, medium=0.5, high=0

\- notificationScore : none=1, low=0.75, medium=0.5, high=0.25

\- securityScore : true/healthy=1, warning=0.5, error=0

\- integrationScore : moyenne simple des intégrations

\- schedulerScore : running=true → 1, false → 0.5

\- runtimeScore : buckets faibles → meilleur score



Ne jamais inclure :

\- chemin complet

\- logs bruts

\- fichiers runtime

\- token

\- IP complète

\- IDs complets



3\. Backend — export non sensible



Ajouter :



GET /api/observability/snapshots/export.json



Retourne les snapshots déjà sanitizés.



GET /api/observability/snapshots/export.csv



Retourne CSV compact :



createdAt,status,source,memoryBucket,notificationsBucket,schedulerRunning,portableZipPresent



Important :

\- export non sensible uniquement

\- pas de chemins

\- pas de noms complets de fichiers

\- pas de contenu runtime/logs



4\. Frontend — composants graphes



Créer :



frontend/src/components/observability/charts/

&nbsp; ObservabilityCharts.tsx

&nbsp; StatusTimelineChart.tsx

&nbsp; ScoreRadarChart.tsx

&nbsp; NotificationsTrendChart.tsx

&nbsp; IntegrationsTrendChart.tsx

&nbsp; SnapshotTimelineTable.tsx

&nbsp; SnapshotFilters.tsx



Composants attendus :



StatusTimelineChart :

\- ligne ou aire montrant statusScore dans le temps

\- badges OK / Warning / Error



NotificationsTrendChart :

\- évolution notificationScore ou unread bucket



IntegrationsTrendChart :

\- évolution ADB / DLNA / SmartThings / Streaming si disponible

\- sinon score global intégrations



ScoreRadarChart :

\- dernier snapshot :

&nbsp; - sécurité

&nbsp; - intégrations

&nbsp; - scheduler

&nbsp; - runtime

&nbsp; - notifications

&nbsp; - mémoire



SnapshotTimelineTable :

\- tableau compact :

&nbsp; - date

&nbsp; - source

&nbsp; - status

&nbsp; - mémoire

&nbsp; - notifications

&nbsp; - scheduler

&nbsp; - sécurité

\- aucune donnée sensible



SnapshotFilters :

\- limit

\- status

\- source

\- bouton actualiser

\- bouton exporter JSON

\- bouton exporter CSV



5\. Hook observability



Compléter :



frontend/src/hooks/useObservability.ts



Ajouter :

\- loadSnapshotTimeline(filters)

\- exportSnapshotsJson()

\- exportSnapshotsCsv()



6\. Types



Mettre à jour :



frontend/src/lib/types.ts



Ajouter :

\- SnapshotTimelineItem

\- SnapshotTimelineSummary

\- SnapshotTimelineResponse

\- SnapshotChartFilters



7\. Intégration ObservabilityPanel



Mettre à jour :



frontend/src/components/observability/ObservabilityPanel.tsx



Ajouter une sous-section :



“Graphes temporels”



Elle doit afficher :

\- filtres

\- timeline status

\- radar dernier snapshot

\- tendance notifications

\- tendance intégrations

\- tableau historique compact

\- boutons export



Si aucun snapshot :

\- afficher EmptyState :

&nbsp; “Aucun snapshot disponible. Créez un snapshot pour générer les graphes.”



8\. Design



Utiliser Tailwind.



Contraintes :

\- responsive mobile

\- lisible en mode TV

\- contraste fort

\- focus visible

\- pas de surcharge visuelle

\- pas de couleurs agressives

\- pas de données sensibles



9\. Sécurité frontend



Vérifier :

\- les exports appellent uniquement endpoints sanitizés

\- aucune réponse sensible stockée dans localStorage

\- aucun token affiché

\- aucun chemin complet affiché

\- les erreurs passent par maskSensitiveClientText()



10\. Tests backend



Créer ou compléter :



tests/backend/observability-timeline.test.js



Tester :

\- GET /api/observability/snapshots/timeline

\- filtres limit/status/source

\- scores calculés

\- summary correct

\- export JSON

\- export CSV

\- absence token/Bearer/IP complète/chemin complet/log brut



11\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/ObservabilityCharts.test.tsx



Tester :

\- empty state sans snapshot

\- rendu avec snapshots

\- filtres

\- boutons export visibles

\- aucune donnée sensible affichée



Mocker Recharts si nécessaire pour éviter erreurs jsdom.



12\. Documentation



Créer :



docs/PHASE19.md



Contenu :

\- objectif Phase 19

\- endpoints timeline/export

\- scores utilisés

\- composants graphiques

\- exports non sensibles

\- sécurité

\- tests

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 19

\- graphe observability

\- exports JSON/CSV

\- commandes de test

\- sécurité



13\. Validation



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check



Tester manuellement :



http://localhost:3000/api/observability/snapshots/timeline

http://localhost:3000/api/observability/snapshots/export.json

http://localhost:3000/api/observability/snapshots/export.csv

http://localhost:3001



14\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- composants graphiques ajoutés

\- types ajoutés

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

\- Ne jamais exposer contenu runtime/logs bruts.

\- Ne pas envoyer de télémétrie cloud.

\- Garder tout local, simple, stable et sécurisé.

