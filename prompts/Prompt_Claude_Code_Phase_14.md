Tu es Claude Code, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 13 sont terminées.



Le projet contient actuellement :

\- frontend HTML/CSS/JS modulaire

\- backend Node.js Express stable

\- API locale

\- fallback JSON

\- centre multimédia

\- orchestrateur de scénarios

\- moteur de notifications locales

\- moteur de tâches planifiées locales

\- ADB lecture seule sécurisé

\- DLNA / UPnP découverte seule sécurisée

\- SmartThings lecture seule sécurisé

\- scènes SmartThings opt-in

\- commandes TV SmartThings opt-in

\- streaming assisté

\- audits locaux



Objectif de la Phase 14 :

Migrer progressivement le frontend actuel vers React / Next.js, sans casser le backend Express existant.



Important :

Cette phase est une migration frontend.

Ne pas réécrire le backend.

Ne pas supprimer l’ancien frontend HTML.

Ne pas casser les endpoints existants.

Ne pas modifier la logique de sécurité existante.

Ne pas activer d’action sensible.

Ne pas ajouter de vraie donnée personnelle.

Ne pas supprimer les fichiers runtime.



1\. Créer une application frontend Next.js



Créer un nouveau dossier :



frontend/



Avec une application Next.js TypeScript.



Configuration souhaitée :

\- App Router

\- TypeScript

\- ESLint

\- Tailwind CSS

\- src/ directory

\- alias @/\*

\- composants React modulaires

\- design proche de l’interface actuelle



Commande possible :



npx create-next-app@latest frontend --typescript --eslint --tailwind --app --src-dir --import-alias "@/\*"



2\. Structure cible



Créer ou organiser :



frontend/

&nbsp; ├── package.json

&nbsp; ├── next.config.ts

&nbsp; ├── tsconfig.json

&nbsp; ├── src/

&nbsp; │   ├── app/

&nbsp; │   │   ├── layout.tsx

&nbsp; │   │   ├── page.tsx

&nbsp; │   │   └── globals.css

&nbsp; │   ├── components/

&nbsp; │   │   ├── layout/

&nbsp; │   │   │   ├── AppShell.tsx

&nbsp; │   │   │   ├── TopNav.tsx

&nbsp; │   │   │   └── SectionHeader.tsx

&nbsp; │   │   ├── dashboard/

&nbsp; │   │   │   ├── HeroPanel.tsx

&nbsp; │   │   │   ├── StatusBadge.tsx

&nbsp; │   │   │   └── MetricCard.tsx

&nbsp; │   │   ├── devices/

&nbsp; │   │   │   ├── DevicesPanel.tsx

&nbsp; │   │   │   └── DeviceCard.tsx

&nbsp; │   │   ├── agents/

&nbsp; │   │   │   ├── AgentsPanel.tsx

&nbsp; │   │   │   └── AgentCard.tsx

&nbsp; │   │   ├── media/

&nbsp; │   │   │   ├── MediaPanel.tsx

&nbsp; │   │   │   ├── AdbPanel.tsx

&nbsp; │   │   │   ├── DlnaPanel.tsx

&nbsp; │   │   │   ├── SmartThingsPanel.tsx

&nbsp; │   │   │   └── StreamingPanel.tsx

&nbsp; │   │   ├── scenarios/

&nbsp; │   │   │   ├── ScenariosPanel.tsx

&nbsp; │   │   │   └── ScenarioCard.tsx

&nbsp; │   │   ├── notifications/

&nbsp; │   │   │   └── NotificationsPanel.tsx

&nbsp; │   │   ├── scheduler/

&nbsp; │   │   │   └── SchedulerPanel.tsx

&nbsp; │   │   └── ui/

&nbsp; │   │       ├── Button.tsx

&nbsp; │   │       ├── Card.tsx

&nbsp; │   │       ├── Badge.tsx

&nbsp; │   │       ├── EmptyState.tsx

&nbsp; │   │       └── SafetyNotice.tsx

&nbsp; │   ├── lib/

&nbsp; │   │   ├── api.ts

&nbsp; │   │   ├── types.ts

&nbsp; │   │   ├── format.ts

&nbsp; │   │   └── safety.ts

&nbsp; │   └── hooks/

&nbsp; │       ├── useApi.ts

&nbsp; │       ├── usePolling.ts

&nbsp; │       └── useNotifications.ts



3\. Configuration API



Créer :



frontend/.env.example



Avec :



NEXT\_PUBLIC\_API\_BASE\_URL=http://localhost:3000



Créer :



frontend/src/lib/api.ts



Fonctions attendues :

\- apiGet(path)

\- apiPost(path, body)

\- apiPatch(path, body)

\- apiDelete(path)

\- getApiBaseUrl()

\- buildApiUrl(path)

\- handleApiError(error)



Important :

\- toutes les requêtes doivent utiliser NEXT\_PUBLIC\_API\_BASE\_URL

\- ne jamais mettre de token dans le frontend

\- ne jamais exposer les chemins runtime

\- gérer les erreurs réseau proprement



4\. Types TypeScript



Créer :



frontend/src/lib/types.ts



Types minimum :

\- Device

\- Agent

\- MediaService

\- Scenario

\- NotificationItem

\- Schedule

\- SchedulerStatus

\- IntegrationStatus

\- AdbStatus

\- DlnaStatus

\- SmartThingsStatus

\- StreamingPolicy

\- ApiResult

\- SafetyLevel



Les types doivent être simples, tolérants et adaptés aux réponses existantes.



5\. Migration visuelle progressive



Recréer dans React les sections principales :



\- Hero / résumé système

\- Appareils

\- Hub-Agent Workflow

\- Centre multimédia

\- ADB Diagnostic

\- DLNA Discovery

\- SmartThings Samsung TV

\- Streaming assisté

\- Scénarios intelligents

\- Notifications

\- Tâches planifiées



Important :

Pour cette phase, il est acceptable de migrer les actions critiques en lecture/preview uniquement.

Les actions sensibles comme exécution scène, commande TV ou streaming play doivent rester visibles mais sécurisées :

\- boutons désactivés si policy refuse

\- confirmation requise

\- message sécurité clair

\- aucun déclenchement automatique



6\. Hooks



Créer :



useApi.ts

\- wrapper de chargement API

\- loading / error / data

\- refresh



usePolling.ts

\- polling contrôlé

\- interval configurable

\- arrêt automatique si composant démonté



useNotifications.ts

\- chargement notifications

\- stats

\- mark read

\- poll optionnel



7\. Design



Utiliser Tailwind CSS.



Direction artistique :

\- fond sombre bleu nuit

\- cartes arrondies

\- badges couleur

\- grille responsive

\- affichage TV large

\- lisibilité forte

\- responsive mobile

\- style cohérent avec les phases précédentes



Palette :

\- navy : #0A2540

\- blue : #2563EB

\- coral : #FF6B6B

\- success : #10B981

\- warning : #F59E0B

\- danger : #EF4444

\- background : #F6F9FC



8\. Backend Express



Ne pas supprimer le serveur actuel.



Ajouter si nécessaire une configuration CORS locale dans le backend pour autoriser :



http://localhost:3001

http://localhost:3000



Mais attention :

\- si le backend utilise déjà le port 3000, le frontend Next.js doit tourner sur 3001

\- documenter clairement les ports



Option recommandée :

\- backend Express : http://localhost:3000

\- frontend Next.js : http://localhost:3001



9\. Scripts racine



Si le projet n’a pas encore de package.json racine, créer ou compléter :



package.json



Scripts souhaités :



"dev:backend": "npm start"

"dev:frontend": "cd frontend \&\& npm run dev -- -p 3001"

"dev": "concurrently \\"npm run dev:backend\\" \\"npm run dev:frontend\\""



Ajouter concurrently seulement si utile.



Ne pas casser le lancement backend existant.



10\. Documentation



Créer :



docs/PHASE14.md



Contenu :

\- objectif Phase 14

\- pourquoi React / Next.js

\- architecture frontend

\- ports utilisés

\- variables frontend

\- composants créés

\- endpoints consommés

\- limites actuelles

\- sécurité

\- commandes de test

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 14

\- lancement backend seul

\- lancement frontend Next.js

\- lancement complet

\- explication de l’ancien frontend conservé

\- avertissement sécurité



11\. Tests manuels



Commandes attendues :



Backend :



npm start



Frontend :



cd frontend

npm install

npm run dev -- -p 3001



Ou si scripts racine ajoutés :



npm run dev



Tester :



http://localhost:3001



Vérifier :

\- page Next.js visible

\- données backend chargées

\- erreurs API affichées proprement

\- notifications affichées

\- scheduler affiché

\- ADB / DLNA / SmartThings / Streaming affichés

\- aucun token visible

\- aucun ID complet sensible visible

\- ancien index.html fonctionne encore

\- backend fonctionne encore



12\. Qualité TypeScript



Ajouter :

\- composants typés

\- pas de any massif sauf fallback justifié

\- fonctions API centralisées

\- gestion loading / error / empty

\- pas d’accès direct aux tokens

\- pas d’action sensible automatique



13\. Rapport final attendu



À la fin, fournir :



\- fichiers créés

\- fichiers modifiés

\- structure frontend

\- composants créés

\- endpoints consommés

\- scripts ajoutés

\- ports utilisés

\- comportement backend

\- comportement frontend

\- ancien frontend conservé

\- commandes de test

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas réécrire le backend.

\- Ne pas casser les phases précédentes.

\- Ne pas activer d’action sensible.

\- Ne jamais exposer token, IMEI, IP complète, ID complet ou chemin complet.

\- Garder le projet local, simple, stable et sécurisé.

