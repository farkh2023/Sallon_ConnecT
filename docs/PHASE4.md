# Phase 4 — Services multimédias

## Objectif

Ajouter une couche "Services multimédias" modulaire, locale et sécurisée.
Architecture de connecteurs activables progressivement — sans streaming complexe ni dépendance lourde.

## Architecture multimédia

```
server.js
  ├── /api/media/*          ← routes/media.js
  │     ├── GET /services   ← data/media-services.json + statut connecteur
  │     ├── GET /status     ← mediaRegistry.getAllStatuses()
  │     ├── GET /playlists  ← data/media-playlists.json
  │     ├── POST /youtube/preview   ← youtubeConnector.runPreview()
  │     └── POST /gallery/scan      ← localGalleryConnector.runPreview()
  └── /api/integrations/*   ← routes/integrations.js
        └── GET /status     ← getAllStatuses() + getAllCapabilities()

server/src/services/
  ├── config.js             ← lecture centralisée du .env
  └── media/
        ├── mediaRegistry.js          ← agrège tous les connecteurs
        ├── youtubeConnector.js       ← embed public, sans clé API
        ├── localGalleryConnector.js  ← scan dossier local configuré
        ├── adbConnector.js           ← squelette ADB (désactivé)
        ├── dlnaConnector.js          ← squelette DLNA (désactivé)
        └── smartThingsConnector.js   ← squelette SmartThings (désactivé)
```

## Endpoints ajoutés (Phase 4)

| Méthode | Route                          | Description                                  |
|---------|--------------------------------|----------------------------------------------|
| GET     | `/api/media/services`          | Services multimédias + statut connecteur     |
| GET     | `/api/media/status`            | Statut de tous les connecteurs               |
| GET     | `/api/media/playlists`         | Playlists et collections                     |
| POST    | `/api/media/youtube/preview`   | Validation URL + embed URL légal             |
| POST    | `/api/media/gallery/scan`      | Scan du dossier local configuré              |
| GET     | `/api/integrations/status`     | Statut + capacités de toutes les intégrations|

## Intégrations disponibles en Phase 4

| Connecteur     | Statut défaut | Activation          |
|----------------|---------------|---------------------|
| YouTube embed  | ✅ Disponible | `YOUTUBE_EMBED_ENABLED=true` (défaut) |
| Galerie locale | ⚙ Configurer  | `MEDIA_LOCAL_GALLERY_ENABLED=true` + `MEDIA_LOCAL_GALLERY_PATH=<chemin>` |

## Intégrations préparées (activables en Phase 5)

| Connecteur    | Statut défaut | Pour activer                                   |
|---------------|---------------|------------------------------------------------|
| ADB (mobile)  | ○ Désactivé   | `ADB_ENABLED=true` + `ADB_PATH=<chemin adb>`   |
| DLNA / UPnP   | ○ Désactivé   | `DLNA_ENABLED=true`                            |
| SmartThings   | ○ Désactivé   | `SMARTTHINGS_ENABLED=true` + `SMARTTHINGS_TOKEN=<token>` |

## Règles de sécurité

- Aucun token, clé API ou mot de passe dans le code source
- Les clés sont uniquement dans `.env` (non commité — `.gitignore`)
- `.env.example` contient uniquement des placeholders
- ADB, DLNA et SmartThings désactivés par défaut
- La galerie locale ne retourne que les noms de fichiers — jamais le contenu binaire
- Le scan galerie est limité à 100 fichiers et au dossier configuré (pas de traversée)
- YouTube : embed public légal uniquement — aucun téléchargement, aucun contournement

## Comment activer ADB (Phase 5)

1. Installer [Android Platform Tools](https://developer.android.com/tools/releases/platform-tools)
2. Connecter Galaxy S23 Ultra en USB, activer le débogage USB
3. Dans `.env` : `ADB_ENABLED=true` et `ADB_PATH=<chemin vers adb.exe>`
4. Implémenter `adbConnector.runPreview()` pour lister les photos

## Comment activer DLNA (Phase 5)

1. Ajouter `npm install node-upnp-client` (ou équivalent)
2. Dans `.env` : `DLNA_ENABLED=true`
3. Implémenter `dlnaConnector.runPreview()` pour découvrir les renderers UPnP

## Comment activer SmartThings (Phase 5)

1. Créer un Personal Access Token sur https://account.smartthings.com/tokens
2. Dans `.env` : `SMARTTHINGS_ENABLED=true` et `SMARTTHINGS_TOKEN=<votre token>`
3. Implémenter `smartThingsConnector.runPreview()` pour contrôler la Samsung TV

## Limites actuelles

- Pas de streaming vidéo réel (Phase 5)
- Pas de lecture audio via le serveur (Phase 5)
- ADB / DLNA / SmartThings : squelettes uniquement
- La galerie locale n'affiche pas les vignettes (noms uniquement)

## Prochaine étape — Phase 5 : Automatisation et contrôle

- Implémenter ADB pour accéder à la galerie Galaxy S23 Ultra
- Implémenter DLNA pour streamer vers Samsung TV
- Implémenter SmartThings pour contrôler la TV
- Scénarios activables automatiquement (mode cinéma, veille, famille…)
- Notifications et planification
