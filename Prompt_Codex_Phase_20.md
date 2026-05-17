Tu es Codex, assistant développeur senior.



Projet : Sallon-ConnecT



Contexte :

Les Phases 1 à 19 sont terminées.



État actuel :

\- backend Express sur http://localhost:3000

\- frontend Next.js sur http://localhost:3001

\- ancien frontend conservé

\- PWA + mode TV avancé

\- packaging Windows

\- tests automatisés

\- observability dashboard

\- snapshots observability

\- graphes temporels observability

\- notifications locales

\- scheduler local

\- ADB lecture seule

\- DLNA découverte seule

\- SmartThings sécurisé

\- scènes SmartThings opt-in

\- commandes TV opt-in

\- streaming assisté

\- audits runtime

\- sécurité confirmée : pas de secrets, pas d’IP complète, pas de chemin complet, pas d’ID complet



Objectif Phase 20 :

Ajouter des profils utilisateurs locaux pour personnaliser Sallon-ConnecT.



Cette phase doit permettre :

\- de créer plusieurs profils locaux

\- de basculer entre profils

\- de stocker des préférences d’interface

\- d’appliquer des permissions locales

\- de limiter les actions sensibles selon le profil

\- de personnaliser le mode TV

\- de personnaliser les notifications

\- de personnaliser les sections visibles

\- de garder toutes les données localement



Important :

\- Ne pas créer encore un vrai système d’authentification distant.

\- Ne pas utiliser de compte cloud.

\- Ne pas utiliser OAuth.

\- Ne pas envoyer de profil à l’extérieur.

\- Ne pas stocker de mot de passe en clair.

\- Ne pas stocker de donnée personnelle sensible.

\- Ne pas stocker de numéro de téléphone, IMEI, adresse, token, IP complète ou chemin complet.

\- Les profils sont locaux et ne remplacent pas les garde-fous backend existants.



1\. Variables d’environnement



Mettre à jour `.env.example` :



PROFILES\_ENABLED=true

PROFILES\_STORE\_PATH=runtime/user-profiles.json

PROFILES\_ACTIVE\_PATH=runtime/active-profile.json

PROFILES\_MAX\_ITEMS=10

PROFILES\_ALLOW\_PIN=false

PROFILES\_REQUIRE\_PIN\_FOR\_SENSITIVE\_ACTIONS=false

PROFILES\_MASK\_PERSONAL\_DATA=true

PROFILES\_DEFAULT\_PROFILE\_ID=main

PROFILES\_AUDIT\_ENABLED=true

PROFILES\_AUDIT\_PATH=runtime/profile-audit.json



Règles :

\- profils activés localement

\- stockage dans runtime/

\- aucune donnée sensible

\- PIN désactivé par défaut

\- audit activé

\- runtime/\*.json reste exclu de Git



2\. Services backend profils



Créer :



server/src/services/profiles/profileSafety.js

server/src/services/profiles/profileStore.js

server/src/services/profiles/profileEngine.js

server/src/services/profiles/profilePermissions.js



profileSafety.js :

\- sanitizeProfile(input)

\- sanitizeProfileForResponse(profile)

\- maskProfileSensitiveData(text)

\- validateProfileInput(input)

\- validateProfilePreferences(preferences)

\- buildSafeProfileError(error)



profileStore.js :

\- loadProfiles()

\- saveProfiles(items)

\- getProfile(id)

\- createProfile(input)

\- updateProfile(id, patch)

\- deleteProfile(id)

\- getActiveProfile()

\- setActiveProfile(id)

\- resetProfiles()

\- getProfileStats()



profileEngine.js :

\- createDefaultProfiles()

\- ensureDefaultProfiles()

\- switchProfile(id)

\- getEffectiveProfile()

\- getProfileDashboardConfig(id)

\- auditProfileEvent(event)



profilePermissions.js :

\- getDefaultPermissions(profileType)

\- canViewSection(profile, section)

\- canRunAction(profile, actionType)

\- canUseSensitiveAction(profile, actionType)

\- mergePermissions(base, override)

\- explainPermissionDecision(profile, actionType)



3\. Fichiers runtime



Créer :



runtime/user-profiles.json

runtime/active-profile.json

runtime/profile-audit.json



Initialiser proprement, mais vérifier que `.gitignore` exclut :



runtime/\*.json



4\. Modèle profil



Chaque profil doit contenir :



{

&nbsp; "id": "main",

&nbsp; "name": "Profil principal",

&nbsp; "type": "owner | family | guest | tv | diagnostic",

&nbsp; "enabled": true,

&nbsp; "createdAt": "...",

&nbsp; "updatedAt": "...",

&nbsp; "preferences": {

&nbsp;   "theme": "dark",

&nbsp;   "accentColor": "blue",

&nbsp;   "defaultView": "dashboard",

&nbsp;   "tvModeDefault": false,

&nbsp;   "compactMode": false,

&nbsp;   "language": "fr",

&nbsp;   "refreshIntervalSeconds": 30,

&nbsp;   "visibleSections": \[

&nbsp;     "dashboard",

&nbsp;     "devices",

&nbsp;     "media",

&nbsp;     "scenarios",

&nbsp;     "notifications",

&nbsp;     "scheduler",

&nbsp;     "observability"

&nbsp;   ]

&nbsp; },

&nbsp; "permissions": {

&nbsp;   "viewDevices": true,

&nbsp;   "viewMedia": true,

&nbsp;   "viewNotifications": true,

&nbsp;   "viewScheduler": true,

&nbsp;   "viewObservability": true,

&nbsp;   "runSafeDiagnostics": true,

&nbsp;   "runSchedulerManual": true,

&nbsp;   "manageProfiles": false,

&nbsp;   "executeSmartThingsScenes": false,

&nbsp;   "executeTvCommands": false,

&nbsp;   "startStreaming": false,

&nbsp;   "clearAudits": false

&nbsp; },

&nbsp; "safety": {

&nbsp;   "sensitiveActionsRequireConfirmation": true,

&nbsp;   "hideSensitivePanels": true,

&nbsp;   "readOnlyMode": false

&nbsp; }

}



5\. Profils par défaut



Créer automatiquement :



Profil principal :

\- type owner

\- voit toutes les sections

\- peut lancer diagnostics sûrs

\- peut gérer profils

\- actions sensibles toujours soumises aux confirmations existantes



Profil Famille :

\- voit dashboard, media, scenarios, notifications

\- pas de scheduler avancé

\- pas d’observability technique complète

\- pas d’action sensible



Profil Invité :

\- voit dashboard limité et media preview

\- pas de SmartThings, pas d’ADB, pas de scheduler, pas d’audits

\- readOnlyMode true



Profil TV :

\- mode TV par défaut

\- grandes cartes

\- dashboard, media, notifications

\- pas de configuration

\- pas d’action sensible



Profil Diagnostic :

\- dashboard, observability, scheduler, notifications

\- diagnostics sûrs uniquement

\- pas de SmartThings execute

\- pas de TV commands

\- pas de streaming play



6\. Routes API profils



Créer :



server/src/routes/profiles.js



Ajouter :



GET /api/profiles

Liste les profils sanitizés.



GET /api/profiles/active

Retourne le profil actif.



POST /api/profiles

Crée un profil.



GET /api/profiles/:id

Retourne un profil.



PATCH /api/profiles/:id

Met à jour un profil.



DELETE /api/profiles/:id

Supprime un profil sauf profil principal.



POST /api/profiles/:id/activate

Active le profil.



GET /api/profiles/:id/permissions

Retourne les permissions effectives.



POST /api/profiles/:id/check-action

Body :

{

&nbsp; "actionType": "smartthings.scene.execute"

}



Retour :

{

&nbsp; "allowed": false,

&nbsp; "reason": "Action sensible interdite pour ce profil"

}



GET /api/profiles/stats

Retourne stats.



GET /api/profiles/audit

Retourne audit local non sensible.



DELETE /api/profiles/audit

Vide audit.



GET /api/profiles/safety

Retourne :

\- localOnly: true

\- cloudSync: false

\- secretsStored: false

\- pinEnabled

\- maxProfiles

\- runtimeProtected: true



7\. Intégration server.js



Monter :



/api/profiles



Ne pas casser les routes existantes.



8\. Intégration permissions dans les actions sensibles



Sans casser les garde-fous existants, ajouter une vérification profil dans :



\- SmartThings scene execution

\- TV command execution

\- streaming play

\- scheduler manual run

\- clear audits si applicable



Important :

Même si le profil autorise, les garde-fous existants restent obligatoires :

\- allowlist

\- confirmation

\- audit

\- variables .env

\- sécurité connecteurs



Le profil ne doit jamais être un raccourci pour contourner la sécurité.



9\. Frontend Next.js



Créer :



frontend/src/components/profiles/

&nbsp; ProfileSwitcher.tsx

&nbsp; ProfilesPanel.tsx

&nbsp; ProfileCard.tsx

&nbsp; ProfileEditor.tsx

&nbsp; ProfilePermissions.tsx

&nbsp; ProfileSafetyNotice.tsx

&nbsp; ProfileAudit.tsx



Créer :



frontend/src/hooks/useProfiles.ts



Fonctions :

\- loadProfiles()

\- loadActiveProfile()

\- createProfile()

\- updateProfile()

\- deleteProfile()

\- activateProfile()

\- loadProfilePermissions()

\- checkProfileAction()

\- loadProfileAudit()

\- clearProfileAudit()



Mettre à jour :



frontend/src/components/layout/AppShell.tsx

frontend/src/components/layout/TopNav.tsx

frontend/src/lib/types.ts



10\. Interface attendue



Ajouter une section :



“Profils locaux”



Elle doit afficher :

\- profil actif

\- sélecteur rapide dans TopNav

\- cartes profils

\- préférences principales

\- sections visibles

\- permissions

\- mode lecture seule

\- audit profils

\- bouton créer profil

\- bouton activer

\- bouton modifier

\- bouton supprimer si autorisé



TopNav :

\- afficher le profil actif

\- menu bascule rapide

\- si profil TV : proposer automatiquement mode TV

\- si profil Invité : masquer actions sensibles



11\. Application des préférences frontend



Le frontend doit appliquer :

\- sections visibles

\- compact mode

\- tvModeDefault

\- refreshIntervalSeconds

\- masquage panneaux sensibles

\- readOnlyMode



Important :

\- le masquage frontend améliore l’UX mais ne remplace pas la sécurité backend

\- les endpoints sensibles doivent rester protégés côté backend



12\. Types frontend



Ajouter dans `frontend/src/lib/types.ts` :



\- UserProfile

\- ProfileType

\- ProfilePreferences

\- ProfilePermissions

\- ProfileSafety

\- ProfileAuditEntry

\- ProfileActionCheckResult



13\. Tests backend



Créer :



tests/backend/profiles.test.js



Tester :

\- profils par défaut créés

\- liste profils

\- profil actif

\- création profil sanitizée

\- update préférences

\- activation profil

\- suppression impossible du profil principal

\- permissions guest refusent actions sensibles

\- check-action fonctionne

\- safety localOnly true

\- aucun secret/IP/chemin complet dans réponses



14\. Tests frontend



Créer :



frontend/src/\_\_tests\_\_/components/ProfilesPanel.test.tsx



Tester :

\- rendu profil actif

\- liste profils

\- activation profil

\- empty/error state

\- permissions affichées

\- aucune donnée sensible affichée



Mocker fetch.

Ne pas dépendre du backend réel.



15\. Documentation



Créer :



docs/PHASE20.md



Contenu :

\- objectif Phase 20

\- profils locaux

\- types de profils

\- préférences

\- permissions

\- intégration actions sensibles

\- sécurité

\- endpoints

\- frontend

\- tests

\- limites actuelles

\- prochaines étapes



Mettre à jour README.md :

\- section Phase 20

\- endpoints profils

\- fonctionnement profil actif

\- sécurité

\- commandes de test



16\. Commandes curl



Ajouter dans README :



curl http://localhost:3000/api/profiles



curl http://localhost:3000/api/profiles/active



curl http://localhost:3000/api/profiles/safety



curl -X POST http://localhost:3000/api/profiles/guest/activate



curl -X POST http://localhost:3000/api/profiles/guest/check-action ^

&nbsp; -H "Content-Type: application/json" ^

&nbsp; -d "{\\"actionType\\":\\"smartthings.scene.execute\\"}"



curl http://localhost:3000/api/profiles/audit



17\. Validation



Lancer :



npm run test:backend

npm run test:frontend

npm run build:frontend

npm run check

npm run health



Vérifier manuellement :

\- http://localhost:3000/api/profiles

\- http://localhost:3000/api/profiles/active

\- http://localhost:3001

\- section Profils locaux visible

\- sélecteur profil actif visible dans TopNav



18\. Rapport final attendu



À la fin, fournir :

\- fichiers créés

\- fichiers modifiés

\- endpoints ajoutés

\- profils par défaut

\- permissions

\- intégration backend

\- intégration frontend

\- tests ajoutés

\- résultats npm run check

\- sécurité confirmée

\- prochaine étape recommandée



Contraintes :

\- Ne pas demander de clarification.

\- Ne pas réécrire le backend.

\- Ne pas supprimer l’ancien frontend.

\- Ne pas ajouter d’auth cloud.

\- Ne pas stocker de mot de passe en clair.

\- Ne jamais exposer secret/token/IP complète/chemin complet/ID complet.

\- Ne jamais permettre à un profil de contourner allowlist/confirmation/audit existants.

\- Ne pas envoyer de données hors local.

\- Garder tout local, simple, stable et sécurisé.

