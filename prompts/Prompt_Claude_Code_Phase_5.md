Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 4 sont terminées.



Le projet contient maintenant :

\- frontend HTML/CSS/JS modulaire

\- backend Node.js Express

\- fichiers JSON de données

\- API locale avec fallback JSON

\- diagnostic appareils

\- centre multimédia

\- connecteurs préparés :

&nbsp; - YouTube embed actif

&nbsp; - galerie locale configurable

&nbsp; - ADB désactivé par défaut

&nbsp; - DLNA désactivé par défaut

&nbsp; - SmartThings désactivé par défaut



Objectif de la Phase 5 :

Ajouter un orchestrateur de scénarios intelligents et commencer l’intégration réelle mais prudente des connecteurs multimédias.



Cette phase doit rester sécurisée, locale, progressive et réversible.



Priorité :

1\. Orchestration des scénarios

2\. Exécution simulée des scénarios

3\. Préparation des connecteurs réels

4\. Lecture seule avant contrôle actif

5\. Aucune action risquée automatique



Important sécurité :

\- Ne jamais stocker de données sensibles.

\- Ne jamais inclure de numéro de téléphone, IMEI, numéro de série, token ou mot de passe dans le code.

\- Ne jamais déclencher ADB, DLNA ou SmartThings sans variable .env explicite.

\- Ne jamais supprimer, déplacer ou modifier des fichiers personnels.

\- Ne jamais envoyer de média vers la TV sans action explicite de l’utilisateur.

\- Ne jamais scanner Internet.

\- Limiter toute découverte réseau au réseau local.

\- Par défaut, tous les connecteurs réels restent désactivés.

\- Le mode simulation doit rester disponible.



Travail demandé :



1\. Créer un orchestrateur de scénarios



Créer :



server/src/services/scenarios/scenarioEngine.js

server/src/services/scenarios/scenarioRegistry.js

server/src/routes/scenariosRuntime.js



Le moteur doit gérer les scénarios suivants :

\- Mode Cinéma

\- Mode Travail

\- Mode Présentation

\- Mode Famille

\- Mode Veille

\- Mode Diagnostic réseau



Chaque scénario doit avoir :

\- id

\- name

\- description

\- requiredDevices

\- requiredServices

\- steps

\- safetyLevel

\- mode : simulated | assisted | live

\- status : ready | running | completed | failed



2\. Ajouter des endpoints API



Ajouter :



GET /api/scenarios/runtime

Retourne l’état des scénarios exécutables.



POST /api/scenarios/:id/preview

Retourne les étapes qui seraient exécutées sans rien lancer.



POST /api/scenarios/:id/run

Exécute le scénario en mode simulation par défaut.



POST /api/scenarios/:id/stop

Arrête un scénario en cours si applicable.



GET /api/scenarios/history

Retourne l’historique local des exécutions.



DELETE /api/scenarios/history

Vide l’historique local.



3\. Historique local



Créer :



data/scenario-history.json



Ou, si le projet a déjà un dossier runtime/cache, utiliser :



runtime/scenario-history.json



Chaque entrée doit contenir :

\- scenarioId

\- scenarioName

\- mode

\- startedAt

\- finishedAt

\- status

\- stepsExecuted

\- warnings

\- source



Ne jamais stocker de donnée sensible.



4\. Ajouter un mode simulation robuste



Par défaut, POST /api/scenarios/:id/run doit exécuter uniquement une simulation :



Exemple Mode Cinéma :

\- vérifier TV Samsung

\- vérifier service YouTube embed

\- préparer zone preview TV

\- suggérer baisse luminosité

\- suggérer source vidéo

\- générer synthèse finale



Aucune commande réelle TV.

Aucun envoi média réel.

Aucune action externe.



5\. Préparer le mode assisted



Ajouter un mode “assisted” activable par body JSON :



{

&nbsp; "mode": "assisted"

}



Dans ce mode :

\- afficher les actions que l’utilisateur doit confirmer manuellement

\- ne pas exécuter d’action sensible

\- retourner des instructions simples

\- journaliser seulement le statut général



6\. Préparer le mode live mais le bloquer par défaut



Le mode live doit être refusé si :



SCENARIO\_LIVE\_ENABLED=false



Ajouter dans .env.example :



SCENARIO\_LIVE\_ENABLED=false

SCENARIO\_HISTORY\_ENABLED=true



Si un utilisateur demande le mode live alors qu’il est désactivé, retourner :



{

&nbsp; "error": "Le mode live est désactivé par sécurité.",

&nbsp; "hint": "Activez SCENARIO\_LIVE\_ENABLED=true seulement si vous comprenez les risques."

}



7\. Connecteur ADB — Phase 5B en lecture seule



Compléter le connecteur :



server/src/services/media/adbConnector.js



Ajouter uniquement des fonctions non destructives :



\- getStatus()

\- listDevices()

\- getDeviceModel()

\- getBatteryInfo()

\- getStorageInfo()

\- getMediaSummary()



Contraintes :

\- ADB\_ENABLED=false par défaut.

\- Si ADB est désactivé, retourner disabled.

\- Si ADB n’est pas installé, retourner unavailable.

\- Si le téléphone n’est pas autorisé, retourner unauthorized.

\- Ne jamais extraire de photos réelles dans cette phase.

\- Ne jamais copier de fichiers.

\- Ne jamais supprimer de fichiers.

\- Ne jamais lire de contenu privé.

\- Ne retourner que des métadonnées générales.



Ajouter dans .env.example :



ADB\_ENABLED=false

ADB\_PATH=

ADB\_DEVICE\_ID=



Important :

ADB\_DEVICE\_ID doit être facultatif.

Ne jamais utiliser un vrai numéro de série dans .env.example.



8\. Connecteur DLNA / UPnP — Phase 5C en découverte seule



Compléter :



server/src/services/media/dlnaConnector.js



Ajouter uniquement :

\- getStatus()

\- discoverRenderers()

\- discoverMediaServers()

\- getCapabilities()



Contraintes :

\- DLNA\_ENABLED=false par défaut.

\- Découverte locale uniquement.

\- Timeout court.

\- Lecture seule.

\- Ne pas envoyer de média.

\- Ne pas contrôler la TV.

\- Ne pas faire de scan réseau global agressif.



Ajouter dans .env.example :



DLNA\_ENABLED=false

DLNA\_DISCOVERY\_TIMEOUT\_MS=3000



9\. Connecteur SmartThings — Phase 5D statut + scènes



Compléter :



server/src/services/media/smartThingsConnector.js



Ajouter :

\- getStatus()

\- listDevices()

\- getTvStatus()

\- listScenes()

\- previewSceneExecution(sceneId)



Contraintes :

\- SMARTTHINGS\_ENABLED=false par défaut.

\- SMARTTHINGS\_TOKEN vide dans .env.example.

\- Ne jamais afficher le token.

\- Masquer le token dans les logs.

\- Ne pas exécuter de scène réelle dans cette phase.

\- Ne pas envoyer de commande réelle à la TV dans cette phase.

\- Préparer seulement l’exécution future.



Ajouter dans .env.example :



SMARTTHINGS\_ENABLED=false

SMARTTHINGS\_TOKEN=

SMARTTHINGS\_TV\_DEVICE\_ID=

SMARTTHINGS\_DEFAULT\_LOCATION\_ID=



10\. Frontend



Dans index.html, ajouter ou améliorer la section :



“Scénarios intelligents”



Elle doit afficher :

\- liste des scénarios

\- statut

\- niveau de sécurité

\- appareils nécessaires

\- services nécessaires

\- bouton “Prévisualiser”

\- bouton “Exécuter simulation”

\- bouton “Mode assisté”

\- zone résultat

\- historique récent



Dans assets/js/app.js, ajouter :

\- chargement de /api/scenarios/runtime

\- prévisualisation scénario

\- exécution simulation

\- exécution assisted

\- affichage historique

\- rafraîchissement statut

\- gestion claire des erreurs



Dans assets/css/styles.css, ajouter :

\- cartes scénario avancées

\- badges simulated / assisted / live blocked

\- timeline d’exécution

\- historique compact

\- zone warning sécurité



11\. Documentation



Créer :



docs/PHASE5.md



Contenu :

\- objectif de Phase 5

\- architecture scenarioEngine

\- endpoints ajoutés

\- modes simulated / assisted / live

\- sécurité ADB

\- sécurité DLNA

\- sécurité SmartThings

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 5

\- commandes de test

\- variables .env

\- usage des scénarios

\- avertissement sécurité



12\. Tests manuels attendus



Commande :



npm start



Tester :



curl http://localhost:3000/api/scenarios/runtime



curl -X POST http://localhost:3000/api/scenarios/cinema/preview



curl -X POST http://localhost:3000/api/scenarios/cinema/run ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"mode\\":\\"simulated\\"}"



curl http://localhost:3000/api/scenarios/history



Tester aussi :



curl http://localhost:3000/api/integrations/status

curl http://localhost:3000/api/media/status



13\. Critères d’acceptation



La Phase 5 est réussie si :



\- les anciennes fonctionnalités Phase 1 à 4 fonctionnent encore

\- les scénarios sont visibles dans l’interface

\- chaque scénario peut être prévisualisé

\- chaque scénario peut être exécuté en simulation

\- le mode assisted retourne des instructions

\- le mode live est bloqué par défaut

\- l’historique fonctionne

\- ADB reste désactivé par défaut

\- DLNA reste désactivé par défaut

\- SmartThings reste désactivé par défaut

\- aucune donnée sensible n’est ajoutée

\- aucun média réel n’est déplacé, supprimé ou envoyé

\- le README et docs/PHASE5.md sont mis à jour



14\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- scénarios disponibles

\- modes disponibles

\- comportement simulation

\- comportement assisted

\- comportement live bloqué

\- état ADB

\- état DLNA

\- état SmartThings

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas passer à React/Next.js.

\- Ne pas casser les phases précédentes.

\- Ne pas supprimer le fallback JSON.

\- Ne jamais ajouter de vraies données personnelles.

\- Garder le projet local, simple, stable et sécurisé.

