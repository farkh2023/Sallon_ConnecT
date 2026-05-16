Tu es Claude Code, assistant développeur senior.



Objectif : créer le premier prototype professionnel du projet “Sallon-ConnecT”.



Contexte du projet :

Sallon-ConnecT est une plateforme personnelle de type “hub-agent” destinée à centraliser les appareils connectés d’un salon et à afficher un tableau de bord principal sur une Smart TV Samsung.



La plateforme doit simuler un workflow multi-agents :

1\. Chaque agent exécute une spécialité.

2\. Les résultats sont fusionnés.

3\. Le livrable final est affiché dans une interface web unique, autonome, responsive et moderne.



Appareils initiaux à intégrer dans le prototype :

\- PC portable Huawei : ID logique “IA\_ordinateur\_BOM\_WXX9”

\- Smart TV Samsung 7 Series : écran principal d’affichage

\- PC de bureau : ID logique “PC\_Bureau”

\- Smartphone Samsung Galaxy S23 Ultra : ID logique “Galaxy\_S23\_Ultra”

\- Box SFR fibre / réseau domestique : ID logique “Box\_SFR\_Fibre”

\- Prévoir la possibilité d’ajouter d’autres appareils et services plus tard



Important sécurité :

\- Ne jamais stocker dans le code de numéro de téléphone, IMEI, numéro de série, mot de passe Wi-Fi, adresse IP sensible ou clé API réelle.

\- Créer seulement des identifiants fictifs ou logiques.

\- Ajouter un fichier `.env.example` si nécessaire.

\- Ajouter une section sécurité dans le README.



Livrable demandé pour cette première étape :

Créer une page web autonome nommée :



`sallon-connect-hub.html`



Cette page doit fonctionner directement en ouvrant le fichier dans un navigateur, sans serveur obligatoire.



La page doit contenir :



1\. Hero section

\- Titre : “Sallon-ConnecT”

\- Sous-titre : “Hub intelligent pour centraliser mes appareils, services multimédias et agents IA”

\- Badge : “Prototype Hub-Agent local”

\- Design moderne, sérieux, technologique



2\. Vue des appareils connectés

Afficher les appareils sous forme de cartes :

\- PC portable Huawei

\- Smart TV Samsung

\- PC de bureau

\- Smartphone Galaxy S23 Ultra

\- Box SFR fibre

Chaque carte doit afficher :

\- Nom de l’appareil

\- Type

\- Rôle dans l’écosystème

\- Statut simulé : connecté, en attente, principal, disponible

\- Bouton ou interaction “Voir détails”



3\. Workflow multi-agents simulé

Créer une section “Hub-Agent Workflow” avec au moins 6 agents :



Agent 1 — Découverte réseau

Mission : détecter les appareils du salon et vérifier leur disponibilité.



Agent 2 — Appareils \& Inventaire

Mission : organiser les appareils par type, rôle et priorité.



Agent 3 — Affichage TV

Mission : préparer l’interface destinée à l’écran principal Samsung TV.



Agent 4 — Multimédia

Mission : proposer des services comme vidéo, musique, photos, YouTube, streaming local, galerie familiale.



Agent 5 — Automatisation

Mission : préparer des scénarios : mode cinéma, mode travail, mode réunion familiale, mode veille.



Agent 6 — Synthèse finale

Mission : fusionner les sorties des agents dans un tableau de bord final unique.



Chaque agent doit avoir :

\- Une carte visuelle

\- Une icône simple ou emoji

\- Un statut : prêt, en cours, terminé

\- Une courte description

\- Un bouton “Exécuter l’agent”

\- Une animation ou changement d’état simulé quand on clique



4\. Fusion finale

Créer une zone “Livrable final fusionné” qui affiche automatiquement une synthèse lorsque tous les agents sont exécutés.



La synthèse finale doit inclure :

\- Nombre d’appareils détectés

\- Appareil d’affichage principal : Smart TV Samsung

\- Services multimédias disponibles

\- Scénarios d’automatisation proposés

\- Prochaine étape technique recommandée



5\. Services multimédias à intégrer dans le prototype

Afficher une section avec les services possibles :

\- YouTube / vidéos

\- Galerie photos du smartphone

\- Musique locale

\- Streaming local depuis PC

\- Présentation familiale sur TV

\- Tableau de bord IA

\- Résumés de contenus

\- Commandes vocales futures



6\. Scénarios intelligents

Créer une section avec cartes :

\- Mode Cinéma

\- Mode Travail

\- Mode Présentation

\- Mode Famille

\- Mode Veille

\- Mode Diagnostic réseau



Chaque scénario doit expliquer :

\- Appareils utilisés

\- Résultat attendu

\- Niveau de priorité



7\. Design UI

Utiliser une direction artistique moderne :

\- Palette principale :

&nbsp; - Bleu nuit : #0A2540

&nbsp; - Bleu électrique : #2563EB

&nbsp; - Corail : #FF6B6B

&nbsp; - Blanc cassé : #F6F9FC

&nbsp; - Vert succès : #10B981

\- Typographie : Inter via Google Fonts

\- Interface responsive desktop/mobile

\- Cartes arrondies

\- Effets hover

\- Transitions fluides

\- Layout adapté à un affichage TV large



8\. JavaScript attendu

Ajouter un script intégré qui permet :

\- D’exécuter chaque agent individuellement

\- De lancer tous les agents via un bouton “Lancer le workflow complet”

\- De mettre à jour une barre de progression

\- De générer une synthèse finale

\- De filtrer les appareils par type si possible

\- De simuler les statuts sans backend réel



9\. Qualité attendue

Le fichier doit être :

\- 100 % autonome

\- Clair

\- Commenté aux endroits importants

\- Facile à modifier

\- Sans dépendance lourde

\- Compatible navigateur moderne

\- Adapté à l’affichage sur Smart TV



10\. README

Créer aussi un fichier `README.md` court mais professionnel contenant :

\- Présentation du projet

\- Objectif de Sallon-ConnecT

\- Appareils prévus

\- Fonctionnement du Hub-Agent

\- Comment ouvrir le prototype

\- Roadmap technique

\- Avertissement sécurité sur les données personnelles



11\. Roadmap à inclure dans le README

Proposer une roadmap en phases :



Phase 1 — Prototype HTML autonome

\- Interface visuelle

\- Simulation multi-agents

\- Dashboard TV



Phase 2 — Application locale

\- Passage vers React ou Next.js

\- Gestion des appareils dans un fichier JSON

\- Sauvegarde locale



Phase 3 — Détection réseau réelle

\- Scan réseau local

\- Découverte mDNS / UPnP / DLNA

\- Statuts réels des appareils



Phase 4 — Services multimédias

\- Galerie photos

\- Vidéos locales

\- YouTube

\- Streaming local vers TV



Phase 5 — Automatisation

\- Scénarios personnalisés

\- Commandes vocales

\- Planification

\- Notifications



Phase 6 — Hub IA

\- Agents IA spécialisés

\- Résumés automatiques

\- Assistant vocal

\- Recommandations intelligentes



12\. Structure de fichiers attendue

Créer au minimum :



/Sallon-ConnecT

&nbsp; ├── sallon-connect-hub.html

&nbsp; ├── README.md

&nbsp; └── .gitignore



13\. Après création

Afficher un rapport final avec :

\- Fichiers créés

\- Fonctionnalités ajoutées

\- Instructions pour ouvrir la page

\- Prochaines améliorations recommandées



Contraintes importantes :

\- Ne pas demander de clarification.

\- Faire une première version complète et fonctionnelle.

\- Ne pas utiliser les vraies données personnelles.

\- Garder le projet simple, local et évolutif.

\- Le résultat doit être directement testable.

