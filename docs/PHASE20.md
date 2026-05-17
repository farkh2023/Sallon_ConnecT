# Phase 20 — Profils utilisateurs locaux

## Objectif

Ajouter un système de profils utilisateurs 100% local pour personnaliser Sallon-ConnecT : préférences d'interface, permissions locales, sections visibles, mode TV, mode lecture seule. Aucune authentification distante, aucun compte cloud, aucun mot de passe stocké.

---

## Profils locaux

### Types de profils

| Type | Description |
|------|-------------|
| `owner` | Propriétaire — accès complet, peut gérer les profils |
| `family` | Famille — dashboard, médias, scénarios, notifications |
| `guest` | Invité — dashboard limité, médias, lecture seule |
| `tv` | TV — mode TV par défaut, dashboard/médias/notifications |
| `diagnostic` | Diagnostic — observabilité, scheduler, diagnostics sûrs |

### Profils créés automatiquement

Au premier démarrage (ou si `runtime/user-profiles.json` est vide), 5 profils par défaut sont créés : `main`, `family`, `guest`, `tv`, `diagnostic`.

---

## Modèle profil

```json
{
  "id": "main",
  "name": "Profil principal",
  "type": "owner",
  "enabled": true,
  "createdAt": "...",
  "updatedAt": "...",
  "preferences": {
    "theme": "dark",
    "accentColor": "blue",
    "defaultView": "dashboard",
    "tvModeDefault": false,
    "compactMode": false,
    "language": "fr",
    "refreshIntervalSeconds": 30,
    "visibleSections": ["dashboard", "devices", "media", "scenarios", "notifications", "scheduler", "observability"]
  },
  "permissions": {
    "viewDevices": true,
    "viewMedia": true,
    "viewNotifications": true,
    "viewScheduler": true,
    "viewObservability": true,
    "runSafeDiagnostics": true,
    "runSchedulerManual": true,
    "manageProfiles": true,
    "executeSmartThingsScenes": false,
    "executeTvCommands": false,
    "startStreaming": false,
    "clearAudits": true
  },
  "safety": {
    "sensitiveActionsRequireConfirmation": true,
    "hideSensitivePanels": false,
    "readOnlyMode": false
  }
}
```

---

## Permissions

### Actions sensibles

Les actions suivantes nécessitent une permission explicite dans le profil :

- `smartthings.scene.execute` → `executeSmartThingsScenes`
- `smartthings.tv.command` → `executeTvCommands`
- `streaming.play` → `startStreaming`
- `scheduler.run` → `runSchedulerManual`
- `profiles.manage` → `manageProfiles`
- `profiles.clear_audit` → `clearAudits`
- `observability.snapshot` → `runSafeDiagnostics`

### Règle de sécurité absolue

**Le profil ne remplace jamais les garde-fous backend.** Les allowlists, confirmations, audits, variables `.env`, et sécurité des connecteurs restent obligatoires quel que soit le profil actif.

---

## Endpoints API

### Liste

| Méthode | URL | Description |
|---------|-----|-------------|
| `GET` | `/api/profiles/safety` | Confirmation sécurité locale |
| `GET` | `/api/profiles/stats` | Statistiques profils |
| `GET` | `/api/profiles/audit` | Journal d'audit |
| `DELETE` | `/api/profiles/audit` | Effacer audit |
| `GET` | `/api/profiles/active` | Profil actif |
| `GET` | `/api/profiles` | Liste tous les profils |
| `POST` | `/api/profiles` | Créer un profil |
| `GET` | `/api/profiles/:id` | Lire un profil |
| `PATCH` | `/api/profiles/:id` | Modifier un profil |
| `DELETE` | `/api/profiles/:id` | Supprimer (sauf `main`) |
| `POST` | `/api/profiles/:id/activate` | Activer le profil |
| `GET` | `/api/profiles/:id/permissions` | Permissions effectives |
| `POST` | `/api/profiles/:id/check-action` | Vérifier une action |

### check-action

```
POST /api/profiles/guest/check-action
Body: { "actionType": "smartthings.scene.execute" }
Response: { "allowed": false, "reason": "Action interdite pour le profil Invité (guest)." }
```

---

## Sécurité

- Profils stockés dans `runtime/user-profiles.json` (exclu de Git)
- Aucun mot de passe, aucun token, aucune donnée personnelle sensible
- IDs tronqués à 16 caractères dans les réponses API
- Masquage automatique : Bearer, IPs, chemins absolus
- Audit local dans `runtime/profile-audit.json` (max 200 entrées)
- `localOnly: true`, `cloudSync: false`, `secretsStored: false`

---

## Frontend

### Composants

| Composant | Description |
|-----------|-------------|
| `ProfilesPanel` | Panneau principal — profil actif, liste, éditeur, permissions, audit |
| `ProfileCard` | Carte d'un profil avec actions (activer/modifier/supprimer) |
| `ProfileEditor` | Formulaire création/modification (nom, type, sections, options) |
| `ProfilePermissions` | Grille des permissions avec indicateurs visuels |
| `ProfileSwitcher` | Menu déroulant dans la TopNav pour basculer rapidement |
| `ProfileAudit` | Journal d'audit local avec bouton effacer |
| `ProfileSafetyNotice` | Notice de sécurité (100% local, aucun cloud) |

### Hook `useProfiles`

Fonctions exposées : `loadProfiles`, `loadActiveProfile`, `createProfile`, `updateProfile`, `deleteProfile`, `activateProfile`, `loadProfilePermissions`, `checkProfileAction`, `loadProfileAudit`, `clearProfileAudit`.

### Intégration TopNav

Le sélecteur de profil (`ProfileSwitcher`) est affiché dans la TopNav dès qu'au moins un profil est chargé. Il montre le type abrégé (OW/FA/GU/TV/DX) et le nom du profil actif.

---

## Tests

### Backend — `tests/backend/profiles.test.js` (15 tests)

- Profils par défaut créés
- `GET /api/profiles` : liste et types
- `GET /api/profiles/active` : profil actif
- `GET /api/profiles/stats` : statistiques
- `POST /api/profiles` : création sanitizée + rejets invalides
- `POST /api/profiles/:id/activate` : basculement
- `GET /api/profiles/guest/permissions` : permissions invité
- `POST /api/profiles/guest/check-action` : refus action sensible
- `DELETE /api/profiles/main` : protection profil principal (403)
- `PATCH /api/profiles/family` : mise à jour préférences
- Absence de données sensibles

### Frontend — `frontend/src/__tests__/components/ProfilesPanel.test.tsx` (7 tests)

- Rendu profil actif
- Liste profils
- Bouton Activer visible
- Mode lecture seule badge
- Notice sécurité
- Section permissions
- Aucune donnée sensible dans le DOM

---

## Limites actuelles

- Pas de PIN (désactivé par défaut, variable `PROFILES_ALLOW_PIN=false`)
- Les permissions frontend améliorent l'UX mais ne protègent pas le backend
- Pas de synchronisation entre instances
- Le profil `main` ne peut pas être supprimé
- Les préférences de thème ne modifient pas encore les couleurs CSS globales

---

## Prochaines étapes suggérées

- Phase 21 : application du thème CSS par profil (CSS variables par accentColor)
- Masquage frontend conditionnel des sections selon `visibleSections`
- PIN optionnel pour les actions sensibles (`PROFILES_ALLOW_PIN=true`)
- Historique de connexion par profil
