Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

La Phase 3 est terminée. Le projet contient maintenant :

\- frontend modulaire HTML/CSS/JS

\- fichiers JSON dans /data

\- backend Node.js Express

\- API locale

\- fallback JSON

\- statuts appareils simulés/réels selon configuration

\- badge “En direct” ou “Simulé”

\- bouton de scan réseau contrôlé



Objectif de la Phase 4 :

Ajouter une première couche “Services multimédias” propre, locale, sécurisée et extensible.



Important :

Ne pas encore faire de streaming complexe réel vers la TV.

Ne pas ajouter de dépendance lourde inutile.

Ne pas exposer de données sensibles.

Créer une architecture de connecteurs multimédias activables progressivement.



Objectifs fonctionnels :

1\. Créer un tableau de bord multimédia dans l’interface.

2\. Ajouter des connecteurs multimédias modulaires côté backend.

3\. Ajouter des endpoints API pour lire l’état des services.

4\. Préparer les futures intégrations :

&nbsp;  - YouTube

&nbsp;  - galerie locale

&nbsp;  - galerie smartphone via ADB, optionnel

&nbsp;  - DLNA / UPnP, optionnel

&nbsp;  - SmartThings Samsung TV, optionnel

5\. Garder une version stable même si aucun connecteur réel n’est configuré.



Contraintes de sécurité :

\- Ne jamais stocker de numéro de téléphone, IMEI, numéro de série, mot de passe ou clé API réelle.

\- Les clés éventuelles doivent être uniquement dans `.env`.

\- Le fichier `.env.example` doit contenir seulement des placeholders.

\- Aucun service externe ne doit être appelé automatiquement sans configuration explicite.

\- ADB doit être désactivé par défaut.

\- SmartThings doit être désactivé par défaut.

\- DLNA doit être désactivé par défaut.

\- YouTube peut fonctionner en mode embed public sans clé API.



Structure à créer ou compléter :



/Sallon-ConnecT

&nbsp; ├── server/

&nbsp; │   ├── src/

&nbsp; │   │   ├── routes/

&nbsp; │   │   │   ├── media.js

&nbsp; │   │   │   └── integrations.js

&nbsp; │   │   ├── services/

&nbsp; │   │   │   ├── media/

&nbsp; │   │   │   │   ├── mediaRegistry.js

&nbsp; │   │   │   │   ├── youtubeConnector.js

&nbsp; │   │   │   │   ├── localGalleryConnector.js

&nbsp; │   │   │   │   ├── adbConnector.js

&nbsp; │   │   │   │   ├── dlnaConnector.js

&nbsp; │   │   │   │   └── smartThingsConnector.js

&nbsp; │   │   │   └── config.js

&nbsp; ├── data/

&nbsp; │   ├── media-services.json

&nbsp; │   └── media-playlists.json

&nbsp; ├── docs/

&nbsp; │   └── PHASE4.md



Backend attendu :



Créer les endpoints suivants :



GET /api/media/services

Retourne la liste des services multimédias disponibles :

\- YouTube

\- Galerie locale

\- Photos smartphone

\- Musique locale

\- Streaming PC vers TV

\- Tableau de bord IA

\- Présentation familiale

\- Commandes vocales futures



GET /api/media/status

Retourne l’état des connecteurs :

{

&nbsp; "youtube": "available",

&nbsp; "localGallery": "available",

&nbsp; "adb": "disabled",

&nbsp; "dlna": "disabled",

&nbsp; "smartThings": "disabled"

}



GET /api/media/playlists

Retourne des playlists ou collections simulées depuis `data/media-playlists.json`.



POST /api/media/youtube/preview

Reçoit un identifiant ou une URL YouTube publique et retourne un objet prêt à afficher dans le frontend.

Ne pas télécharger la vidéo.

Ne pas contourner YouTube.

Utiliser uniquement un embed légal.



POST /api/media/gallery/scan

Scanne uniquement un dossier local autorisé configuré dans `.env`.

Si aucun dossier n’est configuré, retourner une erreur claire :

“Galerie locale non configurée”.



GET /api/integrations/status

Retourne l’état des intégrations optionnelles :

\- ADB

\- DLNA

\- SmartThings

\- YouTube embed

\- Local gallery



Fichier `.env.example` à compléter :



PORT=3000

HOST=127.0.0.1



NETWORK\_SCAN\_ENABLED=false



MEDIA\_LOCAL\_GALLERY\_ENABLED=false

MEDIA\_LOCAL\_GALLERY\_PATH=



ADB\_ENABLED=false

ADB\_PATH=



DLNA\_ENABLED=false



SMARTTHINGS\_ENABLED=false

SMARTTHINGS\_TOKEN=



YOUTUBE\_EMBED\_ENABLED=true



Frontend attendu :



Dans `index.html`, ajouter une section :



“Centre multimédia Sallon-ConnecT”



Elle doit afficher :

\- état des services multimédias

\- cartes de services

\- bouton “Actualiser services”

\- bouton “Scanner galerie locale”

\- champ de test YouTube embed

\- zone d’aperçu multimédia

\- message clair si un service est désactivé



Dans `assets/js/app.js`, ajouter :

\- chargement de `/api/media/services`

\- chargement de `/api/media/status`

\- chargement de `/api/media/playlists`

\- fallback vers `data/media-services.json`

\- rendu dynamique des cartes multimédias

\- affichage d’un lecteur YouTube embed si l’utilisateur entre une URL compatible

\- gestion propre des erreurs API



Dans `assets/css/styles.css`, ajouter :

\- cartes multimédias

\- badges enabled / disabled / simulated

\- zone preview TV

\- layout responsive adapté grand écran TV



Données JSON :



Créer `data/media-services.json` avec au moins 8 services :

1\. YouTube / vidéos

2\. Galerie photos locale

3\. Photos smartphone

4\. Musique locale

5\. Streaming PC vers TV

6\. Présentation familiale

7\. Tableau de bord IA

8\. Commandes vocales futures



Créer `data/media-playlists.json` avec des exemples fictifs :

\- Soirée famille

\- Présentation photos

\- Musique calme

\- Mode cinéma

\- Tutoriels IA



Connecteurs :



Chaque connecteur doit exporter au minimum :

\- getStatus()

\- getCapabilities()

\- runPreview() si pertinent



Les connecteurs ADB, DLNA et SmartThings doivent être des squelettes propres :

\- pas d’appel réel si désactivé

\- statut “disabled”

\- message expliquant comment l’activer plus tard

\- aucune clé réelle dans le code



Documentation :



Créer `docs/PHASE4.md` avec :

\- objectif de la phase

\- architecture multimédia

\- endpoints ajoutés

\- intégrations disponibles

\- intégrations simulées

\- règles de sécurité

\- comment activer plus tard ADB / DLNA / SmartThings

\- limites actuelles

\- prochaines étapes



Mettre à jour `README.md` avec :

\- section Phase 4

\- commandes de lancement

\- variables `.env`

\- explication du centre multimédia

\- avertissement sécurité



Tests manuels attendus :



1\. Lancer :

npm start



2\. Ouvrir :

http://localhost:3000



3\. Tester :

curl http://localhost:3000/api/media/services

curl http://localhost:3000/api/media/status

curl http://localhost:3000/api/integrations/status



4\. Vérifier :

\- l’interface fonctionne toujours

\- le dashboard appareils fonctionne toujours

\- le workflow agents fonctionne toujours

\- le centre multimédia s’affiche

\- YouTube embed fonctionne sans clé API

\- les connecteurs désactivés ne provoquent pas d’erreur

\- aucune donnée sensible n’est présente



Rapport final attendu :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- comportement frontend

\- comportement backend

\- connecteurs activés

\- connecteurs préparés mais désactivés

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne pas ajouter de vraies données personnelles.

\- Ne pas télécharger de contenu YouTube.

\- Ne pas déclencher ADB, DLNA ou SmartThings sans activation explicite.

