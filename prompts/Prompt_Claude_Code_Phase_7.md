Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 6 sont terminées.



Le projet contient maintenant :

\- frontend HTML/CSS/JS modulaire

\- backend Node.js Express

\- API locale

\- fallback JSON

\- centre multimédia

\- orchestrateur de scénarios

\- historique local

\- connecteur ADB lecture seule sécurisé

\- connecteur DLNA préparé mais désactivé

\- connecteur SmartThings préparé mais désactivé



Objectif de la Phase 7 :

Implémenter la découverte DLNA / UPnP en lecture seule.



Cette phase doit permettre à Sallon-ConnecT de découvrir les appareils multimédias locaux compatibles UPnP/DLNA :

\- Smart TV Samsung

\- serveurs médias locaux

\- renderers multimédias

\- players multimédias

\- services UPnP disponibles



Important :

Ne pas encore envoyer de média.

Ne pas contrôler la TV.

Ne pas lancer de lecture.

Ne pas modifier l’état d’un appareil.

Ne pas scanner Internet.

Ne pas faire de scan réseau agressif.

Limiter la découverte au réseau local.



1\. Variables d’environnement



Mettre à jour `.env.example` :



DLNA\_ENABLED=false

DLNA\_DISCOVERY\_TIMEOUT\_MS=3000

DLNA\_MULTICAST\_ADDRESS=239.255.255.250

DLNA\_MULTICAST\_PORT=1900

DLNA\_READ\_ONLY=true

DLNA\_MAX\_RESPONSES=30

DLNA\_FETCH\_DESCRIPTIONS=false

DLNA\_MASK\_LOCAL\_IPS=true



Explication :

\- DLNA\_ENABLED=false par défaut

\- DLNA\_READ\_ONLY=true obligatoire

\- DLNA\_FETCH\_DESCRIPTIONS=false par défaut pour limiter les requêtes

\- DLNA\_MASK\_LOCAL\_IPS=true masque les IP locales dans l’interface et les logs



2\. Sécurité centrale DLNA



Créer :



server/src/services/media/dlnaSafety.js



Ce module doit contenir :



\- validateDlnaConfig()

\- isLocalAddress(address)

\- maskLocalIp(value)

\- sanitizeSsdpResponse(response)

\- sanitizeDeviceDescription(description)

\- buildSafeDlnaError(error)



Règles :

\- accepter uniquement les réponses venant du réseau local

\- ignorer les adresses publiques

\- ignorer les URLs non locales dans LOCATION

\- refuser toute action de contrôle

\- masquer les IP locales si DLNA\_MASK\_LOCAL\_IPS=true

\- ne jamais stocker d’adresse MAC complète

\- ne jamais stocker d’identifiant matériel sensible complet

\- timeout court obligatoire



3\. Connecteur DLNA



Compléter :



server/src/services/media/dlnaConnector.js



Fonctions attendues :



\- getStatus()

\- getCapabilities()

\- discoverDevices()

\- discoverRenderers()

\- discoverMediaServers()

\- discoverPlayers()

\- getLastDiscovery()

\- clearDiscoveryCache()

\- getSafeDiagnostics()



Comportement attendu :



Si DLNA\_ENABLED=false :

retourner status: "disabled"



Si le module réseau UDP n’est pas disponible :

retourner status: "unavailable"



Si aucun appareil n’est trouvé :

retourner status: "no\_device"



Si des appareils sont trouvés :

retourner status: "available"



4\. Découverte SSDP en lecture seule



Implémenter une requête SSDP M-SEARCH locale avec Node.js natif `dgram`.



Requête cible :

\- adresse multicast : 239.255.255.250

\- port : 1900

\- méthode : M-SEARCH

\- ST possibles :

&nbsp; - ssdp:all

&nbsp; - upnp:rootdevice

&nbsp; - urn:schemas-upnp-org:device:MediaRenderer:1

&nbsp; - urn:schemas-upnp-org:device:MediaServer:1

&nbsp; - urn:schemas-upnp-org:device:MediaPlayer:1



Contraintes :

\- timeout court

\- nombre de réponses limité

\- déduplication par USN

\- aucune action SOAP

\- aucune requête POST vers appareil

\- aucune commande de lecture

\- aucune commande de pause

\- aucune commande volume

\- aucune commande power



5\. Option description XML



Si DLNA\_FETCH\_DESCRIPTIONS=true :

\- récupérer uniquement les URLs LOCATION locales

\- timeout court

\- parser uniquement :

&nbsp; - friendlyName

&nbsp; - manufacturer

&nbsp; - modelName

&nbsp; - deviceType

&nbsp; - serviceList

\- ne pas appeler d’action de service

\- ne pas stocker les XML bruts complets

\- nettoyer les champs avant retour API



6\. Endpoints API DLNA



Créer ou compléter :



server/src/routes/dlna.js



Ajouter :



GET /api/dlna/status

Retourne l’état DLNA.



POST /api/dlna/discover

Lance une découverte locale en lecture seule.



GET /api/dlna/devices

Retourne les derniers appareils découverts.



GET /api/dlna/renderers

Retourne seulement les MediaRenderer.



GET /api/dlna/servers

Retourne seulement les MediaServer.



GET /api/dlna/players

Retourne seulement les MediaPlayer.



GET /api/dlna/safety

Retourne :

\- readOnly: true

\- multicastTarget

\- timeout

\- maxResponses

\- fetchDescriptions

\- blockedActions

\- localOnly: true

\- ipMasking: true



DELETE /api/dlna/cache

Vide le cache de découverte.



7\. Intégration avec /api/integrations/status



Mettre à jour l’endpoint existant pour inclure :



dlna: {

&nbsp; status,

&nbsp; readOnly,

&nbsp; available,

&nbsp; lastDiscoveryAt,

&nbsp; deviceCount,

&nbsp; rendererCount,

&nbsp; serverCount,

&nbsp; playerCount,

&nbsp; masked

}



8\. Frontend



Dans `index.html`, ajouter une section :



“Découverte TV \& DLNA”



La section doit afficher :

\- état DLNA

\- mode lecture seule

\- bouton “Découvrir appareils DLNA”

\- bouton “Vider cache DLNA”

\- nombre d’appareils trouvés

\- renderers détectés

\- serveurs médias détectés

\- players détectés

\- avertissement sécurité : “aucune lecture ou commande TV n’est envoyée”



Dans `assets/js/app.js`, ajouter :

\- loadDlnaStatus()

\- runDlnaDiscovery()

\- loadDlnaDevices()

\- loadDlnaRenderers()

\- loadDlnaServers()

\- loadDlnaPlayers()

\- clearDlnaCache()

\- renderDlnaPanel()



Gérer clairement les états :

\- disabled

\- unavailable

\- no\_device

\- available

\- error



Dans `assets/css/styles.css`, ajouter :

\- carte diagnostic DLNA

\- badges disabled / unavailable / no\_device / available

\- grille appareils DLNA

\- tags renderer / server / player

\- bloc sécurité lecture seule

\- affichage clair des IP masquées



9\. Scénarios intelligents



Mettre à jour :



Mode Cinéma :

\- peut utiliser DLNA discovery pour vérifier si une TV ou un renderer est visible

\- ne lance aucune vidéo

\- ne contrôle pas la TV

\- propose seulement “renderer détecté pour future lecture”



Mode Présentation :

\- vérifie si un renderer compatible est visible

\- ne lance aucune présentation

\- génère une recommandation



Mode Diagnostic réseau :

\- ajoute un résumé DLNA :

&nbsp; - appareils trouvés

&nbsp; - renderers

&nbsp; - serveurs médias

&nbsp; - players

&nbsp; - dernière découverte



10\. Documentation



Créer :



docs/PHASE7.md



Contenu :

\- objectif Phase 7

\- explication DLNA / UPnP / SSDP

\- architecture dlnaConnector

\- variables .env

\- endpoints ajoutés

\- lecture seule

\- sécurité réseau

\- limites actuelles

\- comment tester

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 7

\- procédure d’activation DLNA

\- commandes de test

\- avertissement sécurité



11\. Commandes de test



Ajouter dans README :



npm start



Tester :



curl http://localhost:3000/api/dlna/status



curl -X POST http://localhost:3000/api/dlna/discover



curl http://localhost:3000/api/dlna/devices



curl http://localhost:3000/api/dlna/renderers



curl http://localhost:3000/api/dlna/servers



curl http://localhost:3000/api/dlna/players



curl http://localhost:3000/api/dlna/safety



curl -X DELETE http://localhost:3000/api/dlna/cache



12\. Critères d’acceptation



La Phase 7 est réussie si :



\- DLNA est désactivé par défaut

\- l’application fonctionne sans DLNA

\- l’application fonctionne avec DLNA activé

\- la découverte est locale uniquement

\- aucun média n’est envoyé

\- aucune commande TV n’est envoyée

\- aucune action SOAP n’est exécutée

\- les appareils sont dédupliqués

\- les IP locales sont masquées si configuré

\- les scénarios Cinéma, Présentation et Diagnostic réseau utilisent DLNA sans contrôle réel

\- README.md et docs/PHASE7.md sont mis à jour

\- les phases précédentes continuent de fonctionner



13\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- variables .env ajoutées

\- comportement DLNA désactivé

\- comportement DLNA activé sans appareil

\- comportement DLNA avec appareils trouvés

\- garanties sécurité

\- résultat frontend

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne jamais ajouter de vraies données personnelles.

\- Ne jamais envoyer de média.

\- Ne jamais contrôler la TV.

\- Ne jamais exécuter d’action SOAP.

\- Garder le projet local, simple, stable et sécurisé.

