Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 7 sont terminées.



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

\- SmartThings préparé mais désactivé



Objectif de la Phase 8 :

Ajouter une intégration SmartThings prudente, en lecture seule, pour préparer le contrôle futur de la Smart TV Samsung et des scènes.



Cette phase doit permettre :

\- de vérifier la configuration SmartThings

\- de tester la présence du token sans l’afficher

\- de lister les locations SmartThings

\- de lister les appareils SmartThings

\- d’identifier une TV Samsung si visible

\- de lire certains statuts d’appareils

\- de lister les scènes SmartThings

\- de prévisualiser une scène sans l’exécuter



Important :

Ne pas exécuter de scène réelle.

Ne pas envoyer de commande à la TV.

Ne pas allumer, éteindre ou modifier un appareil.

Ne pas modifier les scènes.

Ne pas créer de règles.

Ne pas stocker de token.

Ne jamais afficher le token.

Ne jamais logger le token.

Ne jamais ajouter de token réel dans Git.



1\. Variables d’environnement



Mettre à jour `.env.example` :



SMARTTHINGS\_ENABLED=false

SMARTTHINGS\_TOKEN=

SMARTTHINGS\_READ\_ONLY=true

SMARTTHINGS\_API\_BASE\_URL=https://api.smartthings.com/v1

SMARTTHINGS\_TV\_DEVICE\_ID=

SMARTTHINGS\_DEFAULT\_LOCATION\_ID=

SMARTTHINGS\_COMMAND\_TIMEOUT\_MS=5000

SMARTTHINGS\_MASK\_IDS=true

SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false



Explication :

\- SMARTTHINGS\_ENABLED=false par défaut

\- SMARTTHINGS\_READ\_ONLY=true obligatoire

\- SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false obligatoire pour cette phase

\- SMARTTHINGS\_TOKEN vide dans .env.example

\- IDs masqués dans les réponses et les logs



2\. Sécurité centrale SmartThings



Créer :



server/src/services/media/smartThingsSafety.js



Ce module doit contenir :



\- maskSmartThingsId(value)

\- maskToken(value)

\- sanitizeSmartThingsResponse(payload)

\- sanitizeSmartThingsError(error)

\- validateSmartThingsConfig(config)

\- assertReadOnlyOperation(operationName)

\- buildSmartThingsHeaders(config)



Règles obligatoires :

\- ne jamais retourner le token

\- ne jamais logger le token

\- masquer les IDs si SMARTTHINGS\_MASK\_IDS=true

\- refuser toute opération d’écriture

\- refuser toute exécution de scène

\- refuser toute commande device command

\- refuser toute création/modification/suppression de règle

\- timeout court obligatoire



Opérations autorisées :

\- GET /locations

\- GET /devices

\- GET /devices/{deviceId}

\- GET /devices/{deviceId}/status

\- GET /scenes



Opérations interdites :

\- POST /scenes/{sceneId}/execute

\- POST /devices/{deviceId}/commands

\- POST /rules

\- PUT /rules

\- DELETE /rules

\- toute commande d’appareil

\- toute modification de scène

\- toute modification de location



3\. Connecteur SmartThings



Compléter :



server/src/services/media/smartThingsConnector.js



Fonctions attendues :



\- getStatus()

\- getCapabilities()

\- listLocations()

\- listDevices()

\- getDevice(deviceId)

\- getDeviceStatus(deviceId)

\- findSamsungTv()

\- getTvStatus()

\- listScenes()

\- previewSceneExecution(sceneId)

\- getSafeDiagnostics()



Comportement attendu :



Si SMARTTHINGS\_ENABLED=false :

retourner status: "disabled"



Si token absent :

retourner status: "missing\_token"



Si token invalide ou expiré :

retourner status: "unauthorized"



Si API inaccessible :

retourner status: "unavailable"



Si API disponible :

retourner status: "available"



Important :

\- previewSceneExecution(sceneId) ne doit jamais appeler l’endpoint d’exécution réelle.

\- Il doit seulement retourner :

&nbsp; - sceneId masqué

&nbsp; - nom de scène si disponible

&nbsp; - message : “Prévisualisation uniquement — aucune scène exécutée”

&nbsp; - actions théoriques si disponibles

&nbsp; - warning sécurité



4\. Endpoints API SmartThings



Créer :



server/src/routes/smartthings.js



Ajouter :



GET /api/smartthings/status

Retourne l’état global SmartThings.



GET /api/smartthings/locations

Liste les locations, IDs masqués.



GET /api/smartthings/devices

Liste les appareils, IDs masqués.



GET /api/smartthings/devices/:id/status

Retourne le statut d’un appareil si autorisé, avec ID masqué.



GET /api/smartthings/tv

Tente d’identifier la TV Samsung configurée ou détectée.



GET /api/smartthings/scenes

Liste les scènes disponibles, IDs masqués.



POST /api/smartthings/scenes/:id/preview

Prévisualise une scène sans exécution.



GET /api/smartthings/safety

Retourne :

\- readOnly: true

\- sceneExecutionAllowed: false

\- allowedOperations

\- blockedOperations

\- idMasking

\- tokenMasked

\- timeout



5\. Intégration avec /api/integrations/status



Mettre à jour :



GET /api/integrations/status



Ajouter :



smartThings: {

&nbsp; status,

&nbsp; readOnly,

&nbsp; available,

&nbsp; tokenConfigured,

&nbsp; locationConfigured,

&nbsp; tvConfigured,

&nbsp; sceneExecutionAllowed,

&nbsp; masked,

&nbsp; lastCheckedAt

}



6\. Frontend



Dans `index.html`, ajouter une section dans le Centre multimédia :



“SmartThings Samsung TV”



La section doit afficher :

\- état SmartThings

\- token configuré ou non, sans jamais l’afficher

\- mode lecture seule

\- TV détectée ou non

\- nombre d’appareils

\- nombre de scènes

\- bouton “Actualiser SmartThings”

\- bouton “Lister appareils”

\- bouton “Lister scènes”

\- zone TV Samsung

\- zone scènes SmartThings

\- avertissement : “aucune scène ni commande TV n’est exécutée”



Dans `assets/js/app.js`, ajouter :



\- loadSmartThingsStatus()

\- loadSmartThingsDevices()

\- loadSmartThingsTv()

\- loadSmartThingsScenes()

\- previewSmartThingsScene(sceneId)

\- renderSmartThingsPanel()

\- renderSmartThingsDevices()

\- renderSmartThingsScenes()



Gérer les états :

\- disabled

\- missing\_token

\- unauthorized

\- unavailable

\- available

\- error



Dans `assets/css/styles.css`, ajouter :

\- carte SmartThings

\- badges disabled / missing\_token / unauthorized / available

\- liste appareils

\- liste scènes

\- bloc sécurité lecture seule

\- masquage IDs visible



7\. Scénarios intelligents



Mettre à jour :



Mode Cinéma :

\- peut vérifier si SmartThings voit la TV

\- peut proposer une scène SmartThings

\- ne l’exécute pas



Mode Présentation :

\- peut vérifier si une TV Samsung est disponible

\- propose des actions manuelles



Mode Veille :

\- peut lister une scène “Veille” si disponible

\- ne l’exécute pas



Mode Diagnostic réseau :

\- ajoute résumé SmartThings :

&nbsp; - statut API

&nbsp; - token configuré oui/non

&nbsp; - appareils détectés

&nbsp; - TV détectée

&nbsp; - scènes disponibles



8\. Documentation



Créer :



docs/PHASE8.md



Contenu :

\- objectif Phase 8

\- fonctionnement SmartThings

\- token et sécurité

\- scopes nécessaires

\- endpoints ajoutés

\- mode lecture seule

\- scènes en prévisualisation

\- limites actuelles

\- procédure de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 8

\- variables .env

\- procédure d’activation SmartThings

\- avertissement sécurité

\- commandes curl de test



9\. Procédure d’activation à documenter



Dans README.md, ajouter :



1\. Créer un token SmartThings temporaire depuis le compte Samsung.

2\. Sélectionner uniquement les scopes nécessaires en lecture :

&nbsp;  - devices:read

&nbsp;  - locations:read

&nbsp;  - scenes:read

3\. Copier le token dans `.env`, jamais dans le code :

&nbsp;  SMARTTHINGS\_TOKEN=...

4\. Activer :

&nbsp;  SMARTTHINGS\_ENABLED=true

5\. Garder :

&nbsp;  SMARTTHINGS\_READ\_ONLY=true

&nbsp;  SMARTTHINGS\_ALLOW\_SCENE\_EXECUTION=false



Important :

Ne pas recommander scenes:execute pour cette phase.



10\. Commandes de test



Ajouter :



npm start



curl http://localhost:3000/api/smartthings/status



curl http://localhost:3000/api/smartthings/locations



curl http://localhost:3000/api/smartthings/devices



curl http://localhost:3000/api/smartthings/tv



curl http://localhost:3000/api/smartthings/scenes



curl http://localhost:3000/api/smartthings/safety



Exemple preview scène :



curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE\_ID/preview



11\. Critères d’acceptation



La Phase 8 est réussie si :



\- SmartThings est désactivé par défaut

\- l’application fonctionne sans token

\- l’application fonctionne avec token valide

\- le token n’est jamais affiché

\- le token n’est jamais loggé

\- les IDs sont masqués si configuré

\- les locations peuvent être listées

\- les devices peuvent être listés

\- une TV Samsung peut être identifiée si elle existe dans SmartThings

\- les scènes peuvent être listées

\- les scènes peuvent être prévisualisées

\- aucune scène n’est exécutée

\- aucune commande TV n’est envoyée

\- aucun endpoint d’écriture n’est appelé

\- /api/integrations/status inclut SmartThings

\- README.md et docs/PHASE8.md sont mis à jour

\- les phases précédentes continuent de fonctionner



12\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- opérations SmartThings autorisées

\- opérations SmartThings bloquées

\- comportement SmartThings désactivé

\- comportement token absent

\- comportement token invalide

\- comportement token valide

\- comportement frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne jamais ajouter de token réel.

\- Ne jamais afficher le token.

\- Ne jamais exécuter de scène réelle.

\- Ne jamais envoyer de commande à la TV.

\- Ne jamais modifier un appareil SmartThings.

\- Garder le projet local, simple, stable et sécurisé.

