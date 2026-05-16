Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 10 sont terminées.



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

\- exécution de scènes SmartThings opt-in avec audit

\- commandes TV SmartThings basiques opt-in avec audit



Objectif de la Phase 11 :

Ajouter un module de streaming assisté DLNA / TV, sécurisé, progressif et auditable.



Cette phase doit permettre :

\- de sélectionner des médias locaux autorisés

\- de créer une file de lecture locale

\- de prévisualiser l’envoi vers un renderer DLNA

\- d’autoriser une lecture DLNA uniquement si tous les garde-fous sont validés

\- d’enregistrer un audit local

\- de garder une alternative “mode assisté” si le streaming réel est désactivé



Important :

Ne pas scanner tout le disque.

Ne pas lire de dossiers privés.

Ne pas exposer de chemins complets dans l’interface.

Ne pas envoyer de média sans confirmation.

Ne pas envoyer de média vers un renderer non allowlisté.

Ne pas supprimer, déplacer ou modifier les fichiers.

Ne pas télécharger de contenu externe.

Ne pas contourner YouTube, Netflix, IPTV ou services protégés.

Ne pas ajouter de DRM bypass.

Ne pas faire de scraping de plateformes vidéo.

Ne pas lancer de lecture automatiquement dans les scénarios.



1\. Variables d’environnement



Mettre à jour `.env.example` :



MEDIA\_STREAMING\_ENABLED=false

MEDIA\_STREAMING\_REQUIRE\_CONFIRMATION=true

MEDIA\_STREAMING\_CONFIRMATION\_CODE=CONFIRMER\_STREAM

MEDIA\_STREAMING\_ALLOWED\_DIR=

MEDIA\_STREAMING\_ALLOWED\_EXTENSIONS=.mp4,.mkv,.mp3,.jpg,.jpeg,.png

MEDIA\_STREAMING\_MAX\_FILE\_MB=500

MEDIA\_STREAMING\_MASK\_PATHS=true

MEDIA\_STREAMING\_AUDIT\_ENABLED=true

MEDIA\_STREAMING\_AUDIT\_PATH=runtime/media-streaming-audit.json



DLNA\_STREAMING\_ENABLED=false

DLNA\_RENDERER\_ALLOWLIST=

DLNA\_STREAMING\_TIMEOUT\_MS=5000

DLNA\_BLOCK\_AUTOPLAY\_IN\_SCENARIOS=true



Règles :

\- streaming désactivé par défaut

\- confirmation obligatoire

\- dossier média autorisé obligatoire

\- allowlist renderer obligatoire

\- audit obligatoire

\- aucun autoplay depuis les scénarios



2\. Sécurité streaming



Créer :



server/src/services/media/streamingSafety.js



Fonctions attendues :



\- validateStreamingConfig(config)

\- validateAllowedMediaDirectory(path)

\- validateMediaFilePath(filePath, config)

\- validateMediaExtension(filePath, config)

\- validateMediaSize(filePath, config)

\- validateRendererAllowed(rendererId, config)

\- validateStreamingConfirmation(input, config)

\- maskMediaPath(filePath)

\- sanitizeMediaItem(item)

\- sanitizeStreamingError(error)

\- buildStreamingAuditEntry(data)



Règles :

\- accepter uniquement les fichiers dans MEDIA\_STREAMING\_ALLOWED\_DIR

\- bloquer les chemins relatifs dangereux :

&nbsp; - ../

&nbsp; - ~/

&nbsp; - C:\\Users\\...\\AppData

&nbsp; - /home/\*/.ssh

&nbsp; - /etc

&nbsp; - /Windows/System32

\- bloquer toute extension non autorisée

\- bloquer fichiers trop gros

\- masquer les chemins complets

\- ne jamais exposer de chemin absolu complet côté frontend

\- ne jamais modifier les fichiers



3\. Registre multimédia local



Créer :



server/src/services/media/localMediaLibrary.js



Fonctions attendues :



\- getLibraryStatus()

\- scanAllowedDirectory()

\- listMediaItems()

\- getMediaItemById(id)

\- refreshLibrary()

\- clearLibraryCache()



Comportement :

\- scanne uniquement MEDIA\_STREAMING\_ALLOWED\_DIR

\- ignore les sous-dossiers cachés

\- ignore les fichiers non autorisés

\- génère un id local non sensible pour chaque média

\- retourne :

&nbsp; - id

&nbsp; - title

&nbsp; - type

&nbsp; - extension

&nbsp; - sizeMb

&nbsp; - pathMasked

&nbsp; - addedAt

\- ne retourne jamais le chemin absolu complet



Types :

\- video

\- audio

\- image

\- unknown



4\. File de lecture



Créer :



server/src/services/media/playQueue.js



Fonctions attendues :



\- getQueue()

\- addToQueue(mediaId)

\- removeFromQueue(itemId)

\- clearQueue()

\- moveQueueItem(itemId, direction)

\- previewQueue()

\- getQueueSummary()



Créer :



runtime/media-queue.json



Chaque entrée :

\- queueItemId

\- mediaId

\- title

\- type

\- addedAt

\- status



5\. Streaming DLNA assisté



Compléter :



server/src/services/media/dlnaConnector.js



Ajouter sans casser la découverte existante :



\- getStreamingPolicy()

\- getAllowedRenderers()

\- previewStreamToRenderer(mediaId, rendererId)

\- streamToRenderer(mediaId, rendererId, options)

\- stopRendererPlayback(rendererId, options)

\- getStreamingAuditHistory()

\- clearStreamingAuditHistory()



Important :

Si DLNA\_STREAMING\_ENABLED=false :

retourner erreur :

"Streaming DLNA désactivé par sécurité."



Si renderer non allowlisté :

retourner erreur :

"Renderer non autorisé."



Si confirmation absente ou incorrecte :

retourner erreur :

"Confirmation utilisateur requise."



Si média invalide :

retourner erreur :

"Média non autorisé."



Pour cette phase :

\- previewStreamToRenderer doit être complet

\- streamToRenderer peut être implémenté en mode assisté si l’action DLNA réelle n’est pas encore fiable

\- si une action réelle est ajoutée, elle doit être strictement limitée au renderer allowlisté et au média autorisé



6\. Routes API streaming



Créer :



server/src/routes/streaming.js



Ajouter :



GET /api/streaming/policy

Retourne la policy streaming.



GET /api/streaming/library/status

Retourne l’état de la médiathèque locale.



POST /api/streaming/library/scan

Scanne le dossier autorisé.



GET /api/streaming/library/items

Liste les médias autorisés.



GET /api/streaming/queue

Retourne la file de lecture.



POST /api/streaming/queue

Body :

{

&nbsp; "mediaId": "..."

}



DELETE /api/streaming/queue/:itemId

Supprime un item de la file.



DELETE /api/streaming/queue

Vide la file.



POST /api/streaming/preview

Body :

{

&nbsp; "mediaId": "...",

&nbsp; "rendererId": "..."

}



POST /api/streaming/play

Body :

{

&nbsp; "mediaId": "...",

&nbsp; "rendererId": "...",

&nbsp; "confirmationCode": "CONFIRMER\_STREAM",

&nbsp; "reason": "Lecture demandée depuis Sallon-ConnecT"

}



GET /api/streaming/audit

Retourne l’audit local.



DELETE /api/streaming/audit

Vide l’audit.



7\. Audit streaming



Créer :



runtime/media-streaming-audit.json



Chaque entrée doit contenir :

\- auditId

\- mediaId

\- mediaTitle

\- mediaType

\- rendererIdMasked

\- rendererName

\- requestedAt

\- executedAt

\- mode

\- status

\- reason

\- confirmationUsed

\- source: "Sallon-ConnecT"

\- filePathExposed: false

\- rendererAllowed: true/false



Ne jamais stocker :

\- chemin absolu complet

\- token

\- donnée personnelle

\- identifiant matériel complet



8\. Frontend



Dans `index.html`, ajouter une section :



“Streaming assisté”



Elle doit afficher :

\- policy streaming

\- dossier média configuré ou non

\- nombre de médias trouvés

\- renderers DLNA allowlistés

\- bouton “Scanner médiathèque”

\- grille médias

\- file de lecture

\- formulaire preview

\- formulaire lecture confirmée

\- audit streaming



Dans `assets/js/app.js`, ajouter :



\- loadStreamingPolicy()

\- loadMediaLibraryStatus()

\- scanMediaLibrary()

\- loadMediaItems()

\- loadPlayQueue()

\- addMediaToQueue(mediaId)

\- removeMediaFromQueue(itemId)

\- clearPlayQueue()

\- previewStreaming(mediaId, rendererId)

\- playStreaming(mediaId, rendererId)

\- loadStreamingAudit()

\- clearStreamingAudit()

\- renderStreamingPanel()

\- renderMediaLibrary()

\- renderPlayQueue()

\- renderStreamingAudit()



Dans `assets/css/styles.css`, ajouter :

\- cartes médias

\- tags video / audio / image

\- file de lecture

\- bloc renderer

\- badges streaming disabled / assisted / ready

\- warning sécurité

\- audit compact



9\. Scénarios intelligents



Mettre à jour :



Mode Cinéma :

\- peut proposer un média de type video

\- peut proposer un renderer DLNA allowlisté

\- ne lance pas automatiquement

\- demande confirmation streaming



Mode Famille :

\- peut proposer des images ou vidéos familiales

\- ne lit rien automatiquement

\- demande confirmation



Mode Présentation :

\- peut proposer image ou vidéo de présentation

\- demande confirmation



Mode Diagnostic réseau :

\- affiche :

&nbsp; - streaming activé ou non

&nbsp; - dossier configuré ou non

&nbsp; - nombre de médias indexés

&nbsp; - renderers allowlistés

&nbsp; - dernier audit streaming



10\. Documentation



Créer :



docs/PHASE11.md



Contenu :

\- objectif Phase 11

\- différence découverte DLNA / streaming

\- variables .env

\- dossier média autorisé

\- extensions autorisées

\- renderer allowlist

\- confirmation utilisateur

\- audit local

\- limites actuelles

\- sécurité fichiers

\- sécurité réseau

\- commandes curl de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 11

\- procédure d’activation

\- exemple .env sans vraie donnée

\- commandes de test

\- avertissement sécurité



11\. Exemple README



Ajouter :



MEDIA\_STREAMING\_ENABLED=true

MEDIA\_STREAMING\_REQUIRE\_CONFIRMATION=true

MEDIA\_STREAMING\_CONFIRMATION\_CODE=CONFIRMER\_STREAM

MEDIA\_STREAMING\_ALLOWED\_DIR=C:\\Users\\Youss\\Videos\\SallonConnect

MEDIA\_STREAMING\_ALLOWED\_EXTENSIONS=.mp4,.mkv,.mp3,.jpg,.jpeg,.png

MEDIA\_STREAMING\_MAX\_FILE\_MB=500

MEDIA\_STREAMING\_AUDIT\_ENABLED=true



DLNA\_STREAMING\_ENABLED=true

DLNA\_RENDERER\_ALLOWLIST=renderer-id-1



Important :

\- Ne jamais utiliser un dossier privé complet comme Documents, Desktop entier ou Téléchargements entier.

\- Créer plutôt un dossier dédié : Videos\\SallonConnect.

\- Ne jamais mettre de chemin personnel réel dans Git.

\- Garder l’audit activé.



12\. Commandes de test



Ajouter :



curl http://localhost:3000/api/streaming/policy



curl http://localhost:3000/api/streaming/library/status



curl -X POST http://localhost:3000/api/streaming/library/scan



curl http://localhost:3000/api/streaming/library/items



curl http://localhost:3000/api/streaming/queue



curl -X POST http://localhost:3000/api/streaming/queue ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"mediaId\\":\\"MEDIA\_ID\\"}"



curl -X POST http://localhost:3000/api/streaming/preview ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"mediaId\\":\\"MEDIA\_ID\\",\\"rendererId\\":\\"RENDERER\_ID\\"}"



curl -X POST http://localhost:3000/api/streaming/play ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"mediaId\\":\\"MEDIA\_ID\\",\\"rendererId\\":\\"RENDERER\_ID\\",\\"confirmationCode\\":\\"CONFIRMER\_STREAM\\",\\"reason\\":\\"Test contrôlé depuis Sallon-ConnecT\\"}"



curl http://localhost:3000/api/streaming/audit



curl -X DELETE http://localhost:3000/api/streaming/audit



13\. Tests attendus



Vérifier :



\- streaming refusé si MEDIA\_STREAMING\_ENABLED=false

\- scan refusé si dossier non configuré

\- fichier refusé si extension interdite

\- fichier refusé si trop gros

\- renderer refusé si non allowlisté

\- lecture refusée sans confirmation

\- lecture refusée avec confirmation incorrecte

\- preview fonctionne sans exécution

\- audit créé après tentative de lecture

\- chemins masqués

\- aucun fichier modifié

\- aucune donnée sensible exposée

\- scénarios ne lancent jamais automatiquement le streaming

\- phases précédentes fonctionnent encore



14\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- policy streaming

\- comportement médiathèque

\- comportement file de lecture

\- comportement preview

\- comportement lecture confirmée

\- comportements refusés

\- audit local

\- comportement frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne jamais scanner tout le disque.

\- Ne jamais exposer les chemins complets.

\- Ne jamais modifier les fichiers média.

\- Ne jamais envoyer de média sans confirmation.

\- Ne jamais envoyer vers renderer non allowlisté.

\- Ne jamais lancer streaming automatiquement depuis un scénario.

\- Garder le projet local, simple, stable et sécurisé.

