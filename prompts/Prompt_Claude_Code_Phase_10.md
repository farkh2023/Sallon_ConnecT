Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 9 sont terminées.



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

\- SmartThings scene execution opt-in avec allowlist, confirmation et audit



Objectif de la Phase 10 :

Ajouter des commandes TV Samsung basiques via SmartThings, en opt-in strict, uniquement pour une TV explicitement autorisée.



Cette phase ne doit pas contrôler d’autres appareils.

Cette phase ne doit pas gérer serrure, caméra, alarme, garage, four, thermostat ou appareil sensible.

Cette phase ne doit pas créer, modifier ou supprimer de règles SmartThings.

Cette phase ne doit pas exécuter de commande non allowlistée.



1\. Variables d’environnement



Mettre à jour `.env.example` :



SMARTTHINGS\_TV\_COMMANDS\_ENABLED=false

SMARTTHINGS\_TV\_COMMANDS\_REQUIRE\_CONFIRMATION=true

SMARTTHINGS\_TV\_CONFIRMATION\_CODE=CONFIRMER\_TV

SMARTTHINGS\_TV\_DEVICE\_ALLOWLIST=

SMARTTHINGS\_TV\_COMMAND\_ALLOWLIST=switch.on,switch.off,mediaPlayback.play,mediaPlayback.pause,mediaPlayback.stop

SMARTTHINGS\_TV\_AUDIT\_ENABLED=true

SMARTTHINGS\_TV\_AUDIT\_PATH=runtime/smartthings-tv-audit.json

SMARTTHINGS\_TV\_BLOCK\_VOLUME\_COMMANDS=true

SMARTTHINGS\_TV\_BLOCK\_KEYPAD\_INPUT=true

SMARTTHINGS\_TV\_BLOCK\_SOURCE\_CHANGE=true



Règles :

\- commandes TV désactivées par défaut

\- confirmation obligatoire

\- allowlist TV obligatoire

\- audit obligatoire

\- volume bloqué par défaut

\- keypad input bloqué par défaut

\- changement de source bloqué par défaut



2\. Sécurité TV SmartThings



Compléter :



server/src/services/media/smartThingsSafety.js



Ajouter :



\- validateTvCommandsEnabled(config)

\- validateTvDeviceAllowed(deviceId, config)

\- validateTvCommandAllowed(command, config)

\- validateTvConfirmationCode(input, config)

\- blockSensitiveTvCommand(command)

\- sanitizeTvCommandResult(payload)

\- buildTvAuditEntry(data)



Bloquer explicitement :

\- toute commande hors allowlist

\- tout appareil non allowlisté

\- toute commande sans confirmation

\- volume si SMARTTHINGS\_TV\_BLOCK\_VOLUME\_COMMANDS=true

\- keypadInput si SMARTTHINGS\_TV\_BLOCK\_KEYPAD\_INPUT=true

\- source/input si SMARTTHINGS\_TV\_BLOCK\_SOURCE\_CHANGE=true

\- commandes vers appareils non TV

\- commandes vers appareils sensibles



Commandes autorisées par défaut :

\- switch.on

\- switch.off

\- mediaPlayback.play

\- mediaPlayback.pause

\- mediaPlayback.stop



Commandes interdites par défaut :

\- audioVolume.setVolume

\- audioVolume.volumeUp

\- audioVolume.volumeDown

\- audioMute.mute

\- audioMute.unmute

\- keypadInput.sendKey

\- mediaInputSource.setInputSource

\- toute commande inconnue



3\. Connecteur SmartThings



Compléter :



server/src/services/media/smartThingsConnector.js



Ajouter :



\- getTvCommandPolicy()

\- getAllowedTvDevices()

\- getTvCapabilities(deviceId)

\- previewTvCommand(deviceId, command)

\- executeTvCommand(deviceId, command, options)

\- writeTvAudit(entry)

\- getTvAuditHistory()

\- clearTvAuditHistory()



Comportement attendu :



Si SMARTTHINGS\_TV\_COMMANDS\_ENABLED=false :

retourner erreur :

"Commandes TV désactivées par sécurité."



Si TV non allowlistée :

retourner erreur :

"TV non autorisée. Ajoutez son ID à SMARTTHINGS\_TV\_DEVICE\_ALLOWLIST."



Si commande non allowlistée :

retourner erreur :

"Commande TV non autorisée."



Si confirmation absente ou incorrecte :

retourner erreur :

"Confirmation utilisateur requise."



Si tout est valide :

\- exécuter uniquement POST /devices/{deviceId}/commands

\- uniquement pour la TV allowlistée

\- uniquement pour la commande allowlistée

\- enregistrer un audit local non sensible

\- masquer les IDs

\- ne jamais afficher le token

\- ne jamais logger le token



4\. Routes API SmartThings TV



Créer ou compléter :



server/src/routes/smartthings.js



Ajouter :



GET /api/smartthings/tv/command-policy

Retourne :

\- enabled

\- confirmationRequired

\- allowlistCount

\- commandAllowlist

\- auditEnabled

\- blockedCommandFamilies

\- deviceCommandsRestrictedToTv: true



GET /api/smartthings/tv/allowed-devices

Retourne les TV allowlistées, IDs masqués.



GET /api/smartthings/tv/:id/capabilities

Retourne les capabilities connues de la TV, nettoyées.



POST /api/smartthings/tv/:id/commands/preview

Body :

{

&nbsp; "command": "mediaPlayback.pause"

}



Retourne ce qui serait exécuté, sans rien envoyer.



POST /api/smartthings/tv/:id/commands/execute

Body :

{

&nbsp; "command": "mediaPlayback.pause",

&nbsp; "confirmationCode": "CONFIRMER\_TV",

&nbsp; "reason": "Pause demandée depuis Sallon-ConnecT"

}



GET /api/smartthings/tv/audit

Retourne l’audit local non sensible.



DELETE /api/smartthings/tv/audit

Vide l’audit TV.



5\. Audit local



Créer :



runtime/smartthings-tv-audit.json



Chaque entrée doit contenir :

\- auditId

\- deviceIdMasked

\- deviceName

\- command

\- requestedAt

\- executedAt

\- status

\- reason

\- confirmationUsed

\- source: "Sallon-ConnecT"

\- tokenExposed: false

\- restrictedToTv: true



Ne jamais stocker :

\- token

\- deviceId complet si masquage activé

\- données personnelles

\- données réseau sensibles



6\. Frontend



Dans la section “SmartThings Samsung TV”, ajouter un sous-panneau :



“Commandes TV contrôlées”



Afficher :

\- policy commandes TV

\- commandes activées / désactivées

\- TV allowlistée ou non

\- commandes autorisées

\- commandes bloquées

\- champ confirmation

\- champ raison

\- boutons :

&nbsp; - Prévisualiser ON

&nbsp; - Prévisualiser OFF

&nbsp; - Prévisualiser Play

&nbsp; - Prévisualiser Pause

&nbsp; - Exécuter commande sélectionnée

\- historique audit TV



Important UI :

\- boutons d’exécution désactivés si policy refuse

\- confirmation obligatoire avant exécution

\- avertissement clair : “commande réelle envoyée à la TV”

\- jamais afficher token

\- jamais afficher ID complet



Dans `assets/js/app.js`, ajouter :



\- loadTvCommandPolicy()

\- loadAllowedTvDevices()

\- loadTvCapabilities(deviceId)

\- previewTvCommand(deviceId, command)

\- executeTvCommand(deviceId, command)

\- loadTvAudit()

\- clearTvAudit()

\- renderTvCommandPanel()

\- renderTvAudit()



Dans `assets/css/styles.css`, ajouter :

\- panneau commandes TV

\- badges opt-in / blocked / allowed

\- zone confirmation

\- audit compact

\- bouton danger maîtrisé



7\. Scénarios intelligents



Mettre à jour :



Mode Cinéma :

\- peut proposer une commande TV allowlistée

\- ne l’exécute jamais automatiquement

\- demande confirmation TV



Mode Présentation :

\- peut proposer play/pause si autorisé

\- demande confirmation



Mode Veille :

\- peut proposer switch.off si autorisé

\- demande confirmation



Mode Diagnostic réseau :

\- affiche policy commandes TV

\- affiche nombre de TV allowlistées

\- affiche dernier audit TV



Important :

Le scenarioEngine ne doit jamais exécuter automatiquement une commande TV.

Même en mode live, il doit retourner une demande de confirmation explicite.



8\. Documentation



Créer :



docs/PHASE10.md



Contenu :

\- objectif Phase 10

\- différence scène SmartThings / commande TV directe

\- variables .env

\- allowlist TV

\- allowlist commandes

\- confirmation utilisateur

\- audit local

\- commandes autorisées

\- commandes bloquées

\- limites actuelles

\- procédure de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 10

\- procédure d’activation

\- exemple .env sans vraie donnée

\- commandes curl de test

\- avertissement sécurité



9\. Exemple README pour activation



Ajouter :



SMARTTHINGS\_TV\_COMMANDS\_ENABLED=true

SMARTTHINGS\_TV\_COMMANDS\_REQUIRE\_CONFIRMATION=true

SMARTTHINGS\_TV\_CONFIRMATION\_CODE=CONFIRMER\_TV

SMARTTHINGS\_TV\_DEVICE\_ALLOWLIST=tv-device-id-1

SMARTTHINGS\_TV\_COMMAND\_ALLOWLIST=switch.on,switch.off,mediaPlayback.play,mediaPlayback.pause,mediaPlayback.stop

SMARTTHINGS\_TV\_AUDIT\_ENABLED=true



Important :

\- Ne jamais mettre de token réel dans Git.

\- Ne jamais autoriser de TV non identifiée.

\- Ne jamais autoriser de commande inconnue.

\- Garder l’audit activé.



10\. Commandes de test



Ajouter :



curl http://localhost:3000/api/smartthings/tv/command-policy



curl http://localhost:3000/api/smartthings/tv/allowed-devices



curl http://localhost:3000/api/smartthings/tv/TV\_ID/capabilities



curl -X POST http://localhost:3000/api/smartthings/tv/TV\_ID/commands/preview ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"command\\":\\"mediaPlayback.pause\\"}"



curl -X POST http://localhost:3000/api/smartthings/tv/TV\_ID/commands/execute ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"command\\":\\"mediaPlayback.pause\\",\\"confirmationCode\\":\\"CONFIRMER\_TV\\",\\"reason\\":\\"Test contrôlé depuis Sallon-ConnecT\\"}"



curl http://localhost:3000/api/smartthings/tv/audit



curl -X DELETE http://localhost:3000/api/smartthings/tv/audit



11\. Tests attendus



Vérifier :



\- commande refusée si SMARTTHINGS\_TV\_COMMANDS\_ENABLED=false

\- commande refusée si TV absente de allowlist

\- commande refusée si commande absente de allowlist

\- commande refusée si confirmation absente

\- commande refusée si confirmation incorrecte

\- commande refusée si famille bloquée : volume, keypad, source

\- commande acceptée seulement si :

&nbsp; - token valide

&nbsp; - TV allowlistée

&nbsp; - commande allowlistée

&nbsp; - confirmation correcte

&nbsp; - audit activé

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

\- politique commandes TV

\- commandes autorisées

\- commandes bloquées

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

\- Ne jamais envoyer une commande sans allowlist.

\- Ne jamais envoyer une commande sans confirmation.

\- Ne jamais contrôler d’appareil sensible.

\- Ne jamais autoriser de commande inconnue.

\- Garder le projet local, simple, stable et sécurisé.

