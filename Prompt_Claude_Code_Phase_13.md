Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 12 sont terminées.



Le projet contient maintenant :

\- frontend HTML/CSS/JS modulaire

\- backend Node.js Express

\- API locale

\- fallback JSON

\- centre multimédia

\- orchestrateur de scénarios

\- historique local

\- ADB lecture seule sécurisé

\- DLNA / UPnP découverte seule sécurisée

\- SmartThings lecture seule sécurisé

\- exécution scènes SmartThings opt-in

\- commandes TV SmartThings opt-in

\- streaming assisté

\- moteur de notifications locales

\- audits locaux



Objectif de la Phase 13 :

Ajouter un moteur de tâches planifiées locales.



Cette phase doit permettre :

\- de créer des tâches locales récurrentes

\- d’exécuter des diagnostics non sensibles

\- de nettoyer les notifications anciennes

\- de créer un résumé périodique du système

\- d’afficher les tâches dans l’interface

\- d’enregistrer l’historique d’exécution

\- de notifier l’utilisateur après chaque exécution importante



Important :

Ne pas utiliser de service cloud.

Ne pas utiliser cron système obligatoire.

Ne pas envoyer d’email, SMS ou push externe.

Ne pas exécuter automatiquement de scène SmartThings.

Ne pas exécuter automatiquement de commande TV.

Ne pas lancer automatiquement de streaming.

Ne pas modifier les fichiers personnels.

Ne pas scanner Internet.

Toutes les tâches doivent rester locales.



1\. Variables d’environnement



Mettre à jour `.env.example` :



SCHEDULER\_ENABLED=true

SCHEDULER\_TICK\_MS=30000

SCHEDULER\_STORE\_PATH=runtime/schedules.json

SCHEDULER\_HISTORY\_PATH=runtime/schedule-history.json

SCHEDULER\_MAX\_HISTORY=200

SCHEDULER\_NOTIFY\_ON\_SUCCESS=true

SCHEDULER\_NOTIFY\_ON\_FAILURE=true

SCHEDULER\_ALLOW\_SENSITIVE\_ACTIONS=false

SCHEDULER\_DEFAULT\_TIMEZONE=Europe/Paris

SCHEDULER\_AUTO\_START=true



Règles :

\- scheduler activé localement par défaut

\- actions sensibles bloquées par défaut

\- historique limité

\- notifications intégrées au moteur Phase 12

\- timezone Europe/Paris par défaut



2\. Services scheduler



Créer :



server/src/services/scheduler/schedulerSafety.js

server/src/services/scheduler/schedulerStore.js

server/src/services/scheduler/schedulerEngine.js

server/src/services/scheduler/schedulerActions.js



schedulerSafety.js doit contenir :



\- validateScheduleInput(input)

\- validateActionType(actionType)

\- validateScheduleExpression(schedule)

\- blockSensitiveAction(actionType)

\- sanitizeSchedulePayload(payload)

\- buildSafeScheduleError(error)



Actions interdites par défaut :

\- smartthings.scene.execute

\- smartthings.tv.command

\- streaming.play

\- file.delete

\- file.move

\- adb.pull

\- adb.push

\- network.aggressiveScan



Actions autorisées :

\- system.healthCheck

\- devices.refreshStatus

\- dlna.discover

\- adb.readOnlyDiagnostics

\- media.scanLibrary

\- notifications.cleanup

\- notifications.summary

\- scenarios.preview

\- integrations.statusCheck

\- streaming.libraryStatus



3\. Stockage local



Créer :



runtime/schedules.json

runtime/schedule-history.json



`schedules.json` doit contenir une liste de tâches.



Modèle tâche :



{

&nbsp; "id": "schedule\_xxx",

&nbsp; "name": "Diagnostic réseau local",

&nbsp; "description": "Vérifie l’état général du salon connecté",

&nbsp; "actionType": "devices.refreshStatus",

&nbsp; "enabled": true,

&nbsp; "schedule": {

&nbsp;   "type": "interval | daily | weekly | manual",

&nbsp;   "intervalMinutes": 15,

&nbsp;   "time": "08:00",

&nbsp;   "daysOfWeek": \["monday", "friday"]

&nbsp; },

&nbsp; "lastRunAt": null,

&nbsp; "nextRunAt": null,

&nbsp; "createdAt": "...",

&nbsp; "updatedAt": "...",

&nbsp; "source": "Sallon-ConnecT"

}



Modèle historique :



{

&nbsp; "id": "run\_xxx",

&nbsp; "scheduleId": "schedule\_xxx",

&nbsp; "scheduleName": "Diagnostic réseau local",

&nbsp; "actionType": "devices.refreshStatus",

&nbsp; "startedAt": "...",

&nbsp; "finishedAt": "...",

&nbsp; "status": "success | failed | skipped",

&nbsp; "durationMs": 123,

&nbsp; "message": "...",

&nbsp; "safe": true,

&nbsp; "notificationId": "notif\_xxx"

}



Ne jamais stocker :

\- token

\- ID complet sensible

\- chemin absolu complet

\- numéro de téléphone

\- IMEI

\- adresse IP complète

\- contenu média privé



4\. schedulerActions.js



Implémenter les actions locales autorisées :



system.healthCheck :

\- appelle la logique de santé du backend

\- retourne status ok/error



devices.refreshStatus :

\- rafraîchit les statuts appareils existants

\- ne lance pas de scan agressif



dlna.discover :

\- lance la découverte DLNA Phase 7

\- respecte DLNA\_ENABLED et les timeouts



adb.readOnlyDiagnostics :

\- lance les diagnostics ADB Phase 6

\- respecte ADB\_ENABLED et ADB\_READ\_ONLY



media.scanLibrary :

\- lance scan médiathèque Phase 11

\- respecte MEDIA\_STREAMING\_ALLOWED\_DIR



notifications.cleanup :

\- nettoie anciennes notifications selon configuration



notifications.summary :

\- crée un résumé local :

&nbsp; - nombre de notifications

&nbsp; - nombre d’erreurs

&nbsp; - derniers événements sécurité

&nbsp; - appareils connus

&nbsp; - statut intégrations



integrations.statusCheck :

\- vérifie ADB / DLNA / SmartThings / Streaming

\- retourne un résumé non sensible



scenarios.preview :

\- prévisualise un scénario

\- ne l’exécute jamais



streaming.libraryStatus :

\- retourne l’état de la médiathèque

\- ne lance pas de lecture



5\. schedulerEngine.js



Le moteur doit contenir :



\- startScheduler()

\- stopScheduler()

\- getSchedulerStatus()

\- tick()

\- computeNextRun(schedule)

\- runSchedule(scheduleId, options)

\- runDueSchedules()

\- createDefaultSchedules()

\- notifyScheduleResult(result)



Comportement :

\- démarrage automatique si SCHEDULER\_AUTO\_START=true

\- tick toutes les SCHEDULER\_TICK\_MS

\- ne jamais exécuter deux fois la même tâche en parallèle

\- ignorer les tâches désactivées

\- créer une notification après succès/échec selon .env

\- écrire l’historique

\- limiter l’historique à SCHEDULER\_MAX\_HISTORY



6\. Tâches par défaut



Créer quelques tâches désactivées ou sûres par défaut :



\- “Health check local” — system.healthCheck — toutes les 30 minutes

\- “Résumé notifications” — notifications.summary — tous les jours à 20:00

\- “Nettoyage notifications” — notifications.cleanup — tous les jours à 23:00

\- “Statut intégrations” — integrations.statusCheck — toutes les 60 minutes

\- “Diagnostic appareils” — devices.refreshStatus — toutes les 30 minutes



Éviter par défaut :

\- DLNA discovery automatique

\- ADB automatique

\- scan médiathèque automatique



Ces tâches peuvent exister mais désactivées par défaut.



7\. Routes API scheduler



Créer :



server/src/routes/scheduler.js



Ajouter :



GET /api/scheduler/status

Retourne l’état du moteur.



GET /api/scheduler/schedules

Liste les tâches.



POST /api/scheduler/schedules

Crée une tâche.



GET /api/scheduler/schedules/:id

Lit une tâche.



PATCH /api/scheduler/schedules/:id

Modifie une tâche.



PATCH /api/scheduler/schedules/:id/enable

Active une tâche.



PATCH /api/scheduler/schedules/:id/disable

Désactive une tâche.



POST /api/scheduler/schedules/:id/run

Exécute manuellement une tâche sûre.



DELETE /api/scheduler/schedules/:id

Supprime une tâche.



GET /api/scheduler/history

Retourne l’historique.



DELETE /api/scheduler/history

Vide l’historique.



GET /api/scheduler/actions

Liste les actions autorisées/interdites.



GET /api/scheduler/safety

Retourne :

\- localOnly

\- sensitiveActionsAllowed

\- allowedActions

\- blockedActions

\- tickMs

\- maxHistory

\- notificationsEnabled



8\. Intégration server.js



Monter :



/api/scheduler



Démarrer le scheduler au lancement si :

SCHEDULER\_ENABLED=true

SCHEDULER\_AUTO\_START=true



Créer une notification :

\- scheduler démarré

\- scheduler arrêté

\- tâche réussie

\- tâche échouée

\- tâche bloquée par sécurité



9\. Frontend



Dans `index.html`, ajouter une section :



“Tâches planifiées”



Elle doit afficher :

\- état du scheduler

\- nombre de tâches actives

\- prochaine tâche prévue

\- liste des tâches

\- actions autorisées

\- historique récent

\- bouton “Exécuter maintenant”

\- bouton “Activer”

\- bouton “Désactiver”

\- bouton “Créer tâche simple”

\- bouton “Vider historique”



Dans `assets/js/app.js`, ajouter :



\- loadSchedulerStatus()

\- loadSchedules()

\- loadSchedulerHistory()

\- loadSchedulerActions()

\- createSchedule()

\- updateSchedule()

\- enableSchedule(id)

\- disableSchedule(id)

\- runScheduleNow(id)

\- deleteSchedule(id)

\- clearSchedulerHistory()

\- renderSchedulerPanel()

\- renderSchedules()

\- renderSchedulerHistory()

\- renderSchedulerActions()



10\. CSS



Dans `assets/css/styles.css`, ajouter :

\- panneau scheduler

\- cartes tâches

\- badges active / disabled / running / failed

\- timeline historique

\- formulaire création simple

\- bloc sécurité actions interdites

\- design responsive TV/mobile



11\. Intégration notifications



Utiliser notificationEngine Phase 12 pour créer des notifications lors de :



\- démarrage scheduler

\- tâche exécutée avec succès

\- tâche échouée

\- tâche ignorée

\- tentative action sensible bloquée

\- historique nettoyé



12\. Documentation



Créer :



docs/PHASE13.md



Contenu :

\- objectif Phase 13

\- architecture scheduler

\- actions autorisées

\- actions interdites

\- modèle de tâche

\- modèle historique

\- variables .env

\- sécurité

\- endpoints

\- exemples curl

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 13

\- variables .env

\- exemples de tâches

\- commandes curl

\- avertissement sécurité



13\. Commandes de test



Ajouter :



curl http://localhost:3000/api/scheduler/status



curl http://localhost:3000/api/scheduler/actions



curl http://localhost:3000/api/scheduler/safety



curl http://localhost:3000/api/scheduler/schedules



curl -X POST http://localhost:3000/api/scheduler/schedules ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"name\\":\\"Health check test\\",\\"actionType\\":\\"system.healthCheck\\",\\"schedule\\":{\\"type\\":\\"manual\\"}}"



curl -X POST http://localhost:3000/api/scheduler/schedules/SCHEDULE\_ID/run



curl -X PATCH http://localhost:3000/api/scheduler/schedules/SCHEDULE\_ID/enable



curl -X PATCH http://localhost:3000/api/scheduler/schedules/SCHEDULE\_ID/disable



curl http://localhost:3000/api/scheduler/history



curl -X DELETE http://localhost:3000/api/scheduler/history



14\. Tests attendus



Vérifier :



\- scheduler démarre si activé

\- status retourne running/stopped

\- tâches listées

\- tâche manuelle créée

\- action autorisée exécutée

\- action interdite refusée

\- historique écrit

\- notification créée après exécution

\- enable/disable fonctionne

\- aucune tâche sensible ne s’exécute

\- pas de doublon en parallèle

\- phases précédentes fonctionnent encore



15\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- actions autorisées

\- actions bloquées

\- tâches par défaut

\- comportement scheduler

\- historique local

\- notifications intégrées

\- comportement frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas exécuter d’action sensible automatiquement.

\- Ne jamais lancer scène SmartThings automatiquement.

\- Ne jamais lancer commande TV automatiquement.

\- Ne jamais lancer streaming automatiquement.

\- Ne jamais scanner Internet.

\- Ne jamais exposer de donnée sensible.

\- Garder le projet local, simple, stable et sécurisé.

