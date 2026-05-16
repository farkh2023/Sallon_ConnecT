Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 8 sont terminées.



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

\- preview de scènes SmartThings sans exécution



Objectif de la Phase 9 :

Ajouter une exécution SmartThings très contrôlée, uniquement pour les scènes, avec opt-in explicite.



Important :

Cette phase ne doit pas ajouter de commandes directes d’appareil.

Ne pas envoyer de commande directe à la TV.

Ne pas ajouter de commande power, volume, source, input ou media playback.

Ne pas contrôler de serrure, caméra, alarme, garage, four, thermostat ou appareil sensible.

Ne pas créer, modifier ou supprimer de règle SmartThings.

Autoriser uniquement l’exécution de scènes SmartThings déjà existantes, et seulement si l’utilisateur active explicitement cette capacité dans .env.



1\. Variables d’environnement



Mettre à jour `.env.example` :



SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false

SMARTTHINGS\_SCENE\_EXECUTION\_REQUIRE\_CONFIRMATION=true

SMARTTHINGS\_SCENE\_EXECUTION\_CONFIRMATION\_CODE=CONFIRMER

SMARTTHINGS\_SCENE\_ALLOWLIST=

SMARTTHINGS\_SCENE\_AUDIT\_ENABLED=true

SMARTTHINGS\_SCENE\_AUDIT\_PATH=runtime/smartthings-scene-audit.json

SMARTTHINGS\_BLOCK\_DEVICE\_COMMANDS=true

SMARTTHINGS\_BLOCK\_SENSITIVE\_DEVICES=true



Règles :

\- SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false par défaut

\- confirmation obligatoire par défaut

\- allowlist vide = aucune scène exécutable

\- audit obligatoire

\- commandes directes d’appareils bloquées

\- appareils sensibles bloqués



2\. Sécurité SmartThings Phase 9



Compléter :



server/src/services/media/smartThingsSafety.js



Ajouter :



\- validateSceneExecutionEnabled(config)

\- validateSceneInAllowlist(sceneId, config)

\- validateConfirmationCode(input, config)

\- blockSensitiveDeviceTypes(device)

\- blockDeviceCommands()

\- sanitizeSceneExecutionResult(payload)

\- buildSceneAuditEntry(data)



Bloquer explicitement :

\- device commands

\- rules create/update/delete

\- scenes inconnues

\- scènes non allowlistées

\- scènes sans confirmation

\- scènes contenant appareils sensibles si détectables

\- tout endpoint autre que POST /scenes/{sceneId}/execute



Appareils sensibles à bloquer si présents dans la scène ou dans le nom/capabilities :

\- lock

\- camera

\- alarm

\- garage

\- oven

\- stove

\- thermostat

\- security

\- door

\- window

\- siren



3\. Connecteur SmartThings



Compléter :



server/src/services/media/smartThingsConnector.js



Ajouter :



\- executeScene(sceneId, options)

\- validateSceneBeforeExecution(sceneId, options)

\- getExecutableScenes()

\- getSceneExecutionPolicy()

\- writeSceneAudit(entry)

\- getSceneAuditHistory()

\- clearSceneAuditHistory()



Comportement attendu :



Si SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false :

retourner erreur :

"Exécution de scènes désactivée par sécurité."



Si scène non allowlistée :

retourner erreur :

"Scène non autorisée. Ajoutez son ID à SMARTTHINGS\_SCENE\_ALLOWLIST."



Si confirmation absente ou incorrecte :

retourner erreur :

"Confirmation utilisateur requise."



Si tout est valide :

\- exécuter uniquement POST /scenes/{sceneId}/execute

\- enregistrer un audit local non sensible

\- retourner un résultat nettoyé

\- ne jamais retourner le token

\- ne jamais logger le token



4\. Routes API SmartThings



Compléter :



server/src/routes/smartthings.js



Ajouter :



GET /api/smartthings/scenes/execution-policy

Retourne :

\- enabled

\- confirmationRequired

\- allowlistCount

\- auditEnabled

\- deviceCommandsBlocked

\- sensitiveDevicesBlocked



GET /api/smartthings/scenes/executable

Retourne seulement les scènes allowlistées et exécutables.



POST /api/smartthings/scenes/:id/execute

Body attendu :

{

&nbsp; "confirmationCode": "CONFIRMER",

&nbsp; "reason": "Mode cinéma demandé depuis Sallon-ConnecT"

}



Retour :

\- success

\- sceneId masqué

\- executedAt

\- auditId

\- warning sécurité



GET /api/smartthings/scenes/audit

Retourne l’historique local non sensible.



DELETE /api/smartthings/scenes/audit

Vide l’historique d’exécution.



Conserver :

POST /api/smartthings/scenes/:id/preview

Cette route doit rester disponible et ne jamais exécuter.



5\. Audit local



Créer :



runtime/smartthings-scene-audit.json



Chaque entrée doit contenir :

\- auditId

\- sceneIdMasked

\- sceneName

\- requestedAt

\- executedAt

\- status

\- reason

\- confirmationUsed: true/false

\- source: "Sallon-ConnecT"

\- tokenExposed: false

\- deviceCommandsUsed: false



Ne jamais stocker :

\- token

\- sceneId complet si masquage activé

\- deviceId complet

\- données personnelles

\- données réseau sensibles



6\. Frontend



Dans la section “SmartThings Samsung TV”, ajouter :



\- bloc “Politique d’exécution”

\- indicateur :

&nbsp; - scènes exécutables activées / désactivées

&nbsp; - confirmation requise

&nbsp; - allowlist configurée ou non

&nbsp; - audit activé

\- liste des scènes exécutables

\- bouton “Prévisualiser”

\- bouton “Exécuter scène”

\- champ confirmation

\- champ raison

\- historique d’exécution



Important UI :

\- le bouton “Exécuter scène” doit être désactivé si la policy refuse l’exécution

\- afficher un avertissement clair avant exécution

\- demander le code de confirmation

\- afficher le résultat et l’auditId

\- ne jamais afficher d’ID complet si masquage activé



Dans `assets/js/app.js`, ajouter :



\- loadSmartThingsExecutionPolicy()

\- loadExecutableScenes()

\- executeSmartThingsScene(sceneId)

\- loadSmartThingsSceneAudit()

\- clearSmartThingsSceneAudit()

\- renderSmartThingsExecutionPolicy()

\- renderExecutableScenes()

\- renderSceneAudit()



Dans `assets/css/styles.css`, ajouter :

\- badges opt-in / blocked / allowed

\- bloc confirmation

\- timeline audit

\- warning sécurité

\- bouton danger maîtrisé pour exécution scène



7\. Scénarios intelligents



Mettre à jour :



Mode Cinéma :

\- peut proposer une scène SmartThings allowlistée

\- demande confirmation avant exécution

\- si non activé, reste en assisted/simulated



Mode Présentation :

\- peut proposer une scène de présentation allowlistée

\- demande confirmation



Mode Veille :

\- peut proposer une scène veille allowlistée

\- demande confirmation



Mode Diagnostic réseau :

\- affiche la policy SmartThings

\- affiche nombre de scènes exécutables

\- affiche dernier audit



Important :

Le scenarioEngine ne doit jamais exécuter automatiquement une scène.

Même si l’utilisateur lance un scénario, il doit passer par confirmation explicite.



8\. Documentation



Créer :



docs/PHASE9.md



Contenu :

\- objectif Phase 9

\- différence preview / execute

\- variables .env

\- allowlist des scènes

\- confirmation utilisateur

\- audit local

\- appareils sensibles bloqués

\- commandes directes bloquées

\- endpoints ajoutés

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 9

\- procédure d’activation

\- exemple .env sans vraie donnée

\- commandes curl de test

\- avertissement sécurité



9\. Exemple README pour activation



Ajouter dans README :



Pour autoriser une scène SmartThings :



1\. Garder le mode général sécurisé :

SMARTTHINGS\_READ\_ONLY=false uniquement si nécessaire pour exécuter une scène

SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=true

SMARTTHINGS\_SCENE\_EXECUTION\_REQUIRE\_CONFIRMATION=true

SMARTTHINGS\_SCENE\_EXECUTION\_CONFIRMATION\_CODE=CONFIRMER

SMARTTHINGS\_BLOCK\_DEVICE\_COMMANDS=true

SMARTTHINGS\_BLOCK\_SENSITIVE\_DEVICES=true



2\. Ajouter uniquement les scènes autorisées :

SMARTTHINGS\_SCENE\_ALLOWLIST=scene-id-1,scene-id-2



3\. Redémarrer :

npm start



Important :

Ne jamais ajouter de token réel dans Git.

Ne jamais autoriser une scène sensible.

Ne jamais désactiver l’audit.



10\. Commandes de test



Ajouter :



curl http://localhost:3000/api/smartthings/scenes/execution-policy



curl http://localhost:3000/api/smartthings/scenes/executable



curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE\_ID/preview



curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE\_ID/execute ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"confirmationCode\\":\\"CONFIRMER\\",\\"reason\\":\\"Test contrôlé depuis Sallon-ConnecT\\"}"



curl http://localhost:3000/api/smartthings/scenes/audit



curl -X DELETE http://localhost:3000/api/smartthings/scenes/audit



11\. Tests attendus



Vérifier :



\- exécution refusée si SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false

\- exécution refusée si scène absente de allowlist

\- exécution refusée si confirmation absente

\- exécution refusée si confirmation incorrecte

\- exécution acceptée seulement si :

&nbsp; - token valide

&nbsp; - scène allowlistée

&nbsp; - confirmation correcte

&nbsp; - audit activé

&nbsp; - aucun blocage sécurité

\- audit créé après exécution

\- token jamais affiché

\- IDs masqués

\- preview reste non destructive

\- phases précédentes fonctionnent encore



12\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- politique d’exécution

\- scènes exécutables

\- comportements refusés

\- comportement exécution autorisée

\- audit local

\- comportement frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne jamais ajouter de token réel.

\- Ne jamais afficher le token.

\- Ne jamais exécuter une scène sans allowlist.

\- Ne jamais exécuter une scène sans confirmation.

\- Ne jamais envoyer de commande directe à un appareil.

\- Ne jamais contrôler serrure, caméra, alarme, garage, four ou appareil sensible.

\- Garder le projet local, simple, stable et sécurisé.

