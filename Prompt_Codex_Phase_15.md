Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 14 sont terminées.



État actuel :

\- backend Express stable sur http://localhost:3000

\- ancien frontend HTML conservé sur http://localhost:3000

\- frontend Next.js TypeScript créé dans /frontend

\- frontend Next.js lancé sur http://localhost:3001

\- CORS configuré pour localhost:3001

\- API locale existante

\- fallback JSON existant

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- streaming assisté

\- audits locaux



Objectif Phase 15 :

Ajouter une couche PWA et un mode TV avancé au frontend Next.js, sans casser le backend ni l’ancien frontend.



Important :

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien index.html.

\- Ne pas supprimer le frontend Next.js existant.

\- Ne pas activer d’action sensible.

\- Ne jamais exposer token, IMEI, IP complète, ID complet, chemin complet ou donnée privée.

\- Ne pas envoyer de notification cloud.

\- Ne pas utiliser Firebase.

\- Garder le projet local, simple, stable et sécurisé.



1\. PWA manifest



Dans /frontend, ajouter :



frontend/public/manifest.webmanifest



Contenu attendu :

\- name : Sallon-ConnecT

\- short\_name : SallonConnecT

\- description : Hub local intelligent pour salon connecté

\- start\_url : /

\- scope : /

\- display : standalone

\- orientation : any

\- background\_color : #0A2540

\- theme\_color : #0A2540

\- categories : productivity, utilities, entertainment

\- icons :

&nbsp; - /icons/icon-192.png

&nbsp; - /icons/icon-512.png

&nbsp; - /icons/maskable-192.png

&nbsp; - /icons/maskable-512.png



Créer les icônes dans :



frontend/public/icons/



Si aucune image source n’existe, générer des icônes simples en SVG/PNG avec :

\- fond bleu nuit

\- symbole hub / maison / connexion

\- texte court “SC”



2\. Metadata Next.js



Mettre à jour :



frontend/src/app/layout.tsx



Ajouter les metadata nécessaires :

\- title

\- description

\- manifest

\- themeColor si compatible

\- viewport adapté

\- apple web app title

\- icons



Vérifier que l’app garde son thème sombre.



3\. Page offline



Créer :



frontend/src/app/offline/page.tsx



Contenu :

\- message clair : “Sallon-ConnecT est hors connexion”

\- expliquer que le backend local ou le réseau est indisponible

\- bouton “Réessayer”

\- bouton “Retour au tableau de bord”

\- design cohérent avec le thème



4\. Service worker simple et sûr



Ajouter :



frontend/public/sw.js



Fonctionnalités :

\- cache minimal des assets statiques principaux

\- fallback vers /offline si navigation échoue

\- ne pas mettre en cache les réponses API sensibles

\- ne pas cacher les tokens

\- ne pas stocker les audits

\- ne pas stocker les données runtime

\- ne pas intercepter les endpoints /api/\* sauf fallback réseau propre



Règles :

\- Cache uniquement :

&nbsp; - /

&nbsp; - /offline

&nbsp; - /manifest.webmanifest

&nbsp; - icônes

&nbsp; - assets Next.js statiques si disponibles

\- Network-first pour navigation

\- Pas de cache pour :

&nbsp; - /api/\*

&nbsp; - notifications

&nbsp; - SmartThings

&nbsp; - ADB

&nbsp; - DLNA

&nbsp; - streaming

&nbsp; - scheduler

&nbsp; - runtime



5\. Enregistrement du service worker



Créer :



frontend/src/components/pwa/ServiceWorkerRegister.tsx



Comportement :

\- composant client

\- enregistre /sw.js seulement en production ou si NEXT\_PUBLIC\_ENABLE\_SW=true

\- affiche une notification discrète si installation disponible

\- gère les erreurs sans casser l’application

\- pas d’enregistrement agressif en développement sauf variable explicite



Ajouter dans :



frontend/src/app/layout.tsx



6\. Composants PWA



Créer :



frontend/src/components/pwa/InstallPrompt.tsx

frontend/src/components/pwa/OfflineStatus.tsx



InstallPrompt :

\- détecte beforeinstallprompt si disponible

\- affiche bouton “Installer Sallon-ConnecT”

\- ne force jamais l’installation

\- cache le bouton après installation



OfflineStatus :

\- détecte navigator.onLine

\- affiche badge “Hors ligne” si nécessaire

\- vérifie aussi la disponibilité backend via /api/health ou endpoint existant

\- affiche “Backend local indisponible” si API ne répond pas



7\. Mode TV avancé



Créer :



frontend/src/components/tv/TvModeProvider.tsx

frontend/src/components/tv/TvDashboard.tsx

frontend/src/components/tv/TvFocusGrid.tsx

frontend/src/components/tv/TvQuickActions.tsx



Objectif :

\- offrir une vue grand écran dédiée

\- navigation claire à distance

\- cartes larges

\- contraste fort

\- police plus grande

\- focus visible

\- raccourcis clavier



Raccourcis clavier :

\- T : activer/désactiver mode TV

\- F : plein écran

\- R : refresh dashboard

\- N : notifications

\- S : scheduler

\- Echap : quitter panneau ou plein écran

\- flèches : navigation focus

\- Entrée : action sélectionnée



Important :

\- les actions sensibles restent désactivées ou demandent confirmation

\- aucune commande TV / SmartThings / streaming n’est déclenchée par simple raccourci

\- les raccourcis ne doivent lancer que des actions sûres :

&nbsp; - refresh statut

&nbsp; - ouvrir panneau

&nbsp; - afficher notifications

&nbsp; - basculer mode TV

&nbsp; - plein écran



8\. Bouton plein écran



Créer :



frontend/src/components/tv/FullscreenButton.tsx



Utiliser l’API fullscreen navigateur.

Si indisponible :

\- afficher message clair

\- ne pas planter



9\. Dashboard TV



Le TvDashboard doit afficher :

\- état backend

\- nombre appareils

\- statut Smart TV

\- statut ADB

\- statut DLNA

\- statut SmartThings

\- statut streaming

\- notifications non lues

\- prochaines tâches scheduler

\- dernier événement sécurité

\- gros bouton “Actualiser”

\- gros bouton “Notifications”

\- gros bouton “Tâches”

\- gros bouton “Mode multimédia”



10\. Intégration AppShell



Modifier :



frontend/src/components/layout/AppShell.tsx

frontend/src/components/layout/TopNav.tsx



Ajouter :

\- bouton Mode TV

\- bouton Installer PWA si disponible

\- badge online/offline

\- bouton plein écran

\- navigation adaptée mobile/TV



Conserver toutes les sections existantes.



11\. Styles Tailwind / globals



Mettre à jour :



frontend/src/app/globals.css



Ajouter :

\- classes utilitaires TV

\- focus visible très contrasté

\- tailles grand écran

\- mode reduced motion

\- styles offline

\- styles PWA install

\- styles fullscreen



12\. Types



Mettre à jour :



frontend/src/lib/types.ts



Ajouter :

\- PwaInstallState

\- OfflineStatus

\- TvModeState

\- TvQuickAction

\- BackendHealthStatus



13\. Hooks



Créer :



frontend/src/hooks/useOnlineStatus.ts

frontend/src/hooks/useBackendHealth.ts

frontend/src/hooks/useInstallPrompt.ts

frontend/src/hooks/useTvMode.ts

frontend/src/hooks/useKeyboardShortcuts.ts



Comportement :

\- hooks typés

\- cleanup correct des event listeners

\- pas de memory leak

\- pas d’accès window côté serveur sans garde typeof window



14\. Sécurité



Créer ou compléter :



frontend/src/lib/safety.ts



Ajouter :

\- isSafeDisplayText()

\- maskSensitiveClientText()

\- preventSensitiveCache()

\- safeNotificationMessage()



Vérifier que :

\- aucun token n’est affiché

\- aucun ID complet n’est affiché

\- aucun chemin complet n’est affiché

\- aucune IP complète n’est affichée

\- aucune donnée runtime sensible n’est mise dans localStorage

\- ne pas stocker les réponses API sensibles dans localStorage



15\. Documentation



Créer :



docs/PHASE15.md



Contenu :

\- objectif Phase 15

\- architecture PWA

\- manifest

\- service worker

\- limites offline

\- mode TV

\- raccourcis clavier

\- sécurité cache

\- commandes de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 15

\- lancement backend/frontend

\- installation PWA

\- mode TV

\- plein écran

\- offline

\- avertissement sécurité



16\. Scripts de test



Vérifier :



Depuis racine :



npm run dev



Ou séparément :



npm start

cd frontend

npm run dev -- --port 3001



Build :



cd frontend

npm run build



Test manuel :

\- http://localhost:3001

\- manifest accessible : http://localhost:3001/manifest.webmanifest

\- offline page accessible : http://localhost:3001/offline

\- service worker enregistré si activé

\- mode TV activable

\- plein écran activable

\- raccourcis clavier fonctionnent

\- backend indisponible affiché proprement si port 3000 arrêté

\- ancien frontend http://localhost:3000 fonctionne encore



17\. Critères d’acceptation



La Phase 15 est réussie si :

\- Next build réussit sans erreur TypeScript

\- PWA manifest valide

\- page offline existe

\- service worker ne cache pas /api/\*

\- bouton installer PWA fonctionne si navigateur compatible

\- mode TV activable

\- plein écran activable si navigateur compatible

\- focus clavier visible

\- raccourcis sûrs fonctionnent

\- backend offline géré proprement

\- aucune donnée sensible affichée ou stockée

\- ancien frontend conservé

\- backend Express non cassé

\- README et docs/PHASE15.md mis à jour



18\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- composants PWA créés

\- composants TV créés

\- hooks créés

\- manifest/icons

\- service worker

\- raccourcis clavier

\- limites offline

\- sécurité cache

\- commandes de test

\- résultats build

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas activer d’action sensible.

\- Ne jamais cacher /api/\* dans service worker.

\- Ne jamais stocker token ou données sensibles côté client.

\- Garder le projet local, simple, stable et sécurisé.

