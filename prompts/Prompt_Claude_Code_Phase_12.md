Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 11 sont terminées.



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

\- streaming assisté DLNA / TV

\- audits locaux



Objectif de la Phase 12 :

Ajouter un moteur de notifications locales sécurisé.



Cette phase doit permettre :

\- de centraliser les événements importants

\- de créer un centre de notifications dans l’interface

\- d’enregistrer les notifications localement

\- de filtrer les notifications par type et priorité

\- de déclencher des notifications navigateur uniquement si l’utilisateur donne la permission

\- de ne jamais exposer de données sensibles dans une notification



Important :

Ne pas envoyer de notification externe.

Ne pas utiliser Firebase, email, SMS ou service cloud.

Ne pas envoyer de push distant.

Ne pas afficher de token, ID complet, chemin complet, numéro de téléphone, IMEI, numéro de série ou adresse IP complète.

Ne pas afficher de contenu média privé.

Ne pas afficher de noms de fichiers sensibles.

Les notifications doivent rester locales.



1\. Variables d’environnement



Mettre à jour `.env.example` :



NOTIFICATIONS\_ENABLED=true

NOTIFICATIONS\_BROWSER\_ENABLED=false

NOTIFICATIONS\_AUDIT\_ENABLED=true

NOTIFICATIONS\_STORE\_PATH=runtime/notifications.json

NOTIFICATIONS\_MAX\_ITEMS=200

NOTIFICATIONS\_MASK\_SENSITIVE\_DATA=true

NOTIFICATIONS\_DEFAULT\_LEVEL=info

NOTIFICATIONS\_DEDUP\_WINDOW\_MS=30000

NOTIFICATIONS\_AUTO\_CLEANUP\_DAYS=30



Règles :

\- centre de notifications interne activé par défaut

\- notifications navigateur désactivées par défaut

\- audit activé

\- données sensibles masquées

\- limitation du nombre d’éléments

\- déduplication anti-spam



2\. Service notifications



Créer :



server/src/services/notifications/notificationSafety.js

server/src/services/notifications/notificationStore.js

server/src/services/notifications/notificationEngine.js



notificationSafety.js doit contenir :



\- maskSensitiveText(text)

\- sanitizeNotificationPayload(payload)

\- validateNotificationLevel(level)

\- validateNotificationType(type)

\- buildSafeNotification(input)



Masquer :

\- tokens

\- IMEI

\- numéros de téléphone

\- numéros de série

\- adresses MAC

\- IP locales complètes

\- chemins absolus

\- IDs SmartThings complets

\- IDs ADB complets

\- noms de fichiers suspects ou trop longs



notificationStore.js doit contenir :



\- loadNotifications()

\- saveNotifications(items)

\- addNotification(notification)

\- listNotifications(filters)

\- markAsRead(id)

\- markAllAsRead()

\- deleteNotification(id)

\- clearNotifications()

\- getNotificationStats()



notificationEngine.js doit contenir :



\- notify(input)

\- notifyInfo(title, message, meta)

\- notifySuccess(title, message, meta)

\- notifyWarning(title, message, meta)

\- notifyError(title, message, meta)

\- notifySecurity(title, message, meta)

\- deduplicateNotification(notification)

\- emitSystemEvent(event)



3\. Modèle notification



Chaque notification doit contenir :



{

&nbsp; "id": "notif\_xxx",

&nbsp; "type": "system | device | media | scenario | smartthings | dlna | adb | streaming | security",

&nbsp; "level": "info | success | warning | error | security",

&nbsp; "title": "...",

&nbsp; "message": "...",

&nbsp; "createdAt": "...",

&nbsp; "read": false,

&nbsp; "source": "Sallon-ConnecT",

&nbsp; "meta": {},

&nbsp; "sensitiveDataMasked": true

}



4\. Fichier runtime



Créer :



runtime/notifications.json



Initialiser :



\[]



5\. Routes API notifications



Créer :



server/src/routes/notifications.js



Ajouter :



GET /api/notifications

Query params optionnels :

\- type

\- level

\- unreadOnly=true

\- limit=50



GET /api/notifications/stats

Retourne :

\- total

\- unread

\- byType

\- byLevel

\- lastNotificationAt



POST /api/notifications

Crée une notification locale de test ou système.

Body :

{

&nbsp; "type": "system",

&nbsp; "level": "info",

&nbsp; "title": "Test",

&nbsp; "message": "Notification locale"

}



PATCH /api/notifications/:id/read

Marque une notification comme lue.



PATCH /api/notifications/read-all

Marque toutes les notifications comme lues.



DELETE /api/notifications/:id

Supprime une notification.



DELETE /api/notifications

Vide toutes les notifications.



GET /api/notifications/safety

Retourne :

\- localOnly: true

\- browserEnabled

\- auditEnabled

\- maxItems

\- maskingEnabled

\- dedupWindowMs

\- blockedSensitiveFields



6\. Intégration serveur



Monter la route dans server.js :



/api/notifications



Ajouter des notifications internes quand :



\- backend démarre

\- scan appareils lancé

\- ADB devient available / unauthorized / unavailable

\- DLNA découvre des appareils

\- SmartThings passe available / unauthorized / missing\_token

\- scène SmartThings exécutée ou refusée

\- commande TV exécutée ou refusée

\- streaming preview créé

\- streaming play refusé ou accepté

\- scénario terminé

\- violation sécurité détectée



Important :

Les messages doivent rester courts et propres.

Aucune donnée sensible ne doit apparaître.



7\. Intégration frontend



Dans `index.html`, ajouter une section ou bouton nav :



“Notifications”



Créer un panneau :



\- compteur non lu

\- filtres :

&nbsp; - Tous

&nbsp; - Système

&nbsp; - Appareils

&nbsp; - Média

&nbsp; - Scénarios

&nbsp; - Sécurité

\- filtres niveau :

&nbsp; - info

&nbsp; - success

&nbsp; - warning

&nbsp; - error

&nbsp; - security

\- liste des notifications

\- bouton “Marquer tout comme lu”

\- bouton “Vider”

\- bouton “Tester notification”

\- bouton “Activer notifications navigateur”



Dans `assets/js/app.js`, ajouter :



\- loadNotifications()

\- loadNotificationStats()

\- createTestNotification()

\- markNotificationRead(id)

\- markAllNotificationsRead()

\- deleteNotification(id)

\- clearNotifications()

\- requestBrowserNotificationPermission()

\- showBrowserNotification(notification)

\- renderNotificationsPanel()

\- renderNotificationStats()

\- pollNotifications()



Poll toutes les 15 secondes si backend actif.



Notifications navigateur :

\- demander permission explicitement

\- ne jamais demander automatiquement au chargement

\- afficher uniquement si permission === granted

\- afficher seulement titre/message sanitizés

\- fallback silencieux si non supporté



8\. CSS



Dans `assets/css/styles.css`, ajouter :

\- panneau notifications

\- badge compteur non lu

\- couleurs par niveau

\- filtres

\- cartes notification

\- statut lu/non lu

\- bouton sécurité

\- design responsive TV/mobile



9\. Intégration scénarios



Mettre à jour `scenarioEngine.js` :



\- notify au début d’un scénario

\- notify à la fin

\- notify si échec

\- notify si mode live refusé

\- notify si confirmation manquante



10\. Intégration SmartThings / TV / Streaming



Ajouter notifications :

\- preview scène créée

\- exécution scène acceptée

\- exécution scène refusée

\- commande TV preview créée

\- commande TV acceptée

\- commande TV refusée

\- streaming preview créé

\- streaming refusé

\- streaming accepté en mode assisté



11\. Documentation



Créer :



docs/PHASE12.md



Contenu :

\- objectif Phase 12

\- architecture notifications

\- sécurité données

\- notifications internes vs navigateur

\- endpoints ajoutés

\- variables .env

\- exemples d’événements

\- limites actuelles

\- commandes de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 12

\- variables .env

\- procédure d’activation navigateur

\- commandes curl

\- avertissement sécurité



12\. Commandes de test



Ajouter :



curl http://localhost:3000/api/notifications



curl http://localhost:3000/api/notifications/stats



curl http://localhost:3000/api/notifications/safety



curl -X POST http://localhost:3000/api/notifications ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"type\\":\\"system\\",\\"level\\":\\"info\\",\\"title\\":\\"Test\\",\\"message\\":\\"Notification locale\\"}"



curl -X PATCH http://localhost:3000/api/notifications/NOTIF\_ID/read



curl -X PATCH http://localhost:3000/api/notifications/read-all



curl -X DELETE http://localhost:3000/api/notifications/NOTIF\_ID



curl -X DELETE http://localhost:3000/api/notifications



13\. Tests attendus



Vérifier :



\- notifications internes disponibles sans permission navigateur

\- notification de test créée

\- compteur non lu mis à jour

\- mark read fonctionne

\- mark all read fonctionne

\- delete fonctionne

\- clear fonctionne

\- stats correctes

\- données sensibles masquées

\- déduplication fonctionne

\- navigateur demandé seulement par clic utilisateur

\- fallback propre si Notifications API indisponible

\- aucune donnée sensible affichée

\- phases précédentes fonctionnent encore



14\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- types de notifications

\- niveaux de notifications

\- événements intégrés

\- sécurité masquage

\- comportement frontend

\- comportement navigateur

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas envoyer de notification cloud.

\- Ne pas utiliser Firebase.

\- Ne pas utiliser email/SMS.

\- Ne jamais afficher de données sensibles.

\- Ne jamais demander la permission navigateur automatiquement.

\- Garder le projet local, simple, stable et sécurisé.

