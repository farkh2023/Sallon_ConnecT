# Phase 11 — Streaming assisté DLNA

## Objectif

Permettre à Sallon-ConnecT de suggérer et préparer la lecture de fichiers médias locaux sur un renderer DLNA (TV, enceinte, lecteur réseau), avec :
- Médiathèque locale scannée uniquement dans `MEDIA_STREAMING_ALLOWED_DIR`
- File de lecture ordonnée
- Prévisualisation avant toute action
- Confirmation obligatoire avant lecture
- Renderer DLNA uniquement si dans l'allowlist
- Audit complet de chaque tentative
- **Mode assisté** : instructions à l'utilisateur, aucune commande SOAP automatique

## Différence avec les phases précédentes

| | Phase 7 | Phase 11 |
|---|---|---|
| Objectif | Découverte réseau DLNA | Lecture locale assistée |
| Action | Aucune | Instructions à l'utilisateur |
| Fichiers | Aucun accès | Dossier autorisé uniquement |
| Confirmation | N/A | Obligatoire |

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `server/src/services/media/streamingSafety.js` | CRÉÉ — sécurité centrale |
| `server/src/services/media/localMediaLibrary.js` | CRÉÉ — médiathèque locale |
| `server/src/services/media/playQueue.js` | CRÉÉ — file de lecture |
| `server/src/services/media/dlnaConnector.js` | MODIFIÉ — ajout streaming assisté |
| `server/src/routes/streaming.js` | CRÉÉ — 14 endpoints |
| `server.js` | MODIFIÉ — Phase 11 |
| `server/src/services/scenarios/scenarioRegistry.js` | MODIFIÉ — étapes streaming |
| `index.html` | MODIFIÉ — section streaming |
| `assets/js/app.js` | MODIFIÉ — fonctions streaming |
| `assets/css/styles.css` | MODIFIÉ — styles streaming |
| `.env.example` | MODIFIÉ — 13 variables Phase 11 |
| `runtime/media-queue.json` | CRÉÉ |
| `runtime/media-streaming-audit.json` | CRÉÉ |

## Variables d'environnement

### Streaming media

| Variable | Défaut | Description |
|---|---|---|
| `MEDIA_STREAMING_ENABLED` | `false` | Active le module streaming (opt-in) |
| `MEDIA_STREAMING_REQUIRE_CONFIRMATION` | `true` | Code obligatoire avant lecture |
| `MEDIA_STREAMING_CONFIRMATION_CODE` | `CONFIRMER_STREAM` | Code de confirmation |
| `MEDIA_STREAMING_ALLOWED_DIR` | *(vide)* | Seul dossier scanné — jamais le disque entier |
| `MEDIA_STREAMING_ALLOWED_EXTENSIONS` | `.mp4,.mkv,.mp3,.jpg,.jpeg,.png` | Extensions autorisées |
| `MEDIA_STREAMING_MAX_FILE_MB` | `500` | Taille max par fichier |
| `MEDIA_STREAMING_MASK_PATHS` | `true` | Masque les chemins dans les réponses |
| `MEDIA_STREAMING_AUDIT_ENABLED` | `true` | Enregistre chaque tentative |
| `MEDIA_STREAMING_AUDIT_PATH` | `runtime/media-streaming-audit.json` | Fichier d'audit |

### DLNA streaming

| Variable | Défaut | Description |
|---|---|---|
| `DLNA_STREAMING_ENABLED` | `false` | Active les fonctions de lecture DLNA |
| `DLNA_RENDERER_ALLOWLIST` | *(vide)* | IDs des renderers DLNA autorisés (vide = aucun) |
| `DLNA_STREAMING_TIMEOUT_MS` | `5000` | Timeout actions DLNA |
| `DLNA_BLOCK_AUTOPLAY_IN_SCENARIOS` | `true` | Bloque l'autoplay dans les scénarios |

## Endpoints API

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/streaming/policy` | Politique de streaming |
| `GET` | `/api/streaming/renderers` | Renderers DLNA autorisés |
| `GET` | `/api/streaming/library/status` | Statut de la médiathèque |
| `POST` | `/api/streaming/library/scan` | Lancer un scan |
| `GET` | `/api/streaming/library/items` | Lister les médias |
| `GET` | `/api/streaming/queue` | Voir la file de lecture |
| `POST` | `/api/streaming/queue` | Ajouter un média à la file |
| `DELETE` | `/api/streaming/queue` | Vider la file |
| `DELETE` | `/api/streaming/queue/:itemId` | Retirer un élément |
| `POST` | `/api/streaming/queue/:itemId/move` | Réordonner |
| `POST` | `/api/streaming/preview` | Prévisualiser (sans lancer) |
| `POST` | `/api/streaming/play` | Lancer (mode assisté) |
| `POST` | `/api/streaming/stop` | Arrêter (mode assisté) |
| `GET` | `/api/streaming/audit` | Historique d'audit |
| `DELETE` | `/api/streaming/audit` | Vider l'audit |

## Gardes de sécurité (ordre d'exécution)

1. **Streaming global activé** (`MEDIA_STREAMING_ENABLED=true`)
2. **DLNA streaming activé** (`DLNA_STREAMING_ENABLED=true`)
3. **Renderer dans l'allowlist** (`DLNA_RENDERER_ALLOWLIST` non vide)
4. **Média dans la bibliothèque scannée** + chemin dans `MEDIA_STREAMING_ALLOWED_DIR`
5. **Code de confirmation valide** (`MEDIA_STREAMING_CONFIRMATION_CODE`)
6. Audit enregistré si `MEDIA_STREAMING_AUDIT_ENABLED=true`

## Dossiers bloqués absolument

Même si `MEDIA_STREAMING_ALLOWED_DIR` pointe vers un sous-chemin, les patterns suivants sont **toujours refusés** :

- `../` (traversal)
- `~/` (répertoire home)
- `AppData` (Windows)
- `.ssh` (clés SSH)
- `/etc/` (Linux)
- `Windows\System32`
- `/proc/` et `/sys/` (Linux)

## Mode assisté

`streamToRenderer` ne lance **aucune commande SOAP automatique**. Il retourne des instructions lisibles :

```json
{
  "status": "instructed",
  "mode": "assisted",
  "instructions": [
    "Sur votre renderer, accédez à la bibliothèque DLNA/UPnP de votre réseau.",
    "Recherchez 'Sallon-ConnecT' dans les serveurs média disponibles.",
    "Sélectionnez le fichier : 'NomFichier.mp4'",
    "Appuyez sur Lecture."
  ],
  "filePathExposed": false
}
```

## Format d'entrée d'audit

```json
{
  "auditId": "sa-abc123-xyz",
  "mediaId": "media-0-monfilm",
  "mediaTitle": "Mon Film",
  "mediaType": "video",
  "rendererIdMasked": "abcd***z",
  "rendererName": "Samsung TV",
  "requestedAt": "2026-05-16T10:00:00.000Z",
  "executedAt": "2026-05-16T10:00:01.000Z",
  "mode": "assisted",
  "status": "instructed",
  "confirmationUsed": true,
  "source": "Sallon-ConnecT",
  "filePathExposed": false,
  "rendererAllowed": true
}
```

## Procédure de test

1. Copier `.env.example` → `.env`
2. Créer un dossier test (ex: `C:\Medias`) avec 1-2 fichiers `.mp4` ou `.jpg`
3. Configurer `.env` :
   ```
   MEDIA_STREAMING_ENABLED=true
   MEDIA_STREAMING_ALLOWED_DIR=C:\Medias
   DLNA_STREAMING_ENABLED=true
   DLNA_RENDERER_ALLOWLIST=mon-renderer-id
   ```
4. Lancer : `node server.js`
5. Tester `GET /api/streaming/policy` → doit retourner `status: enabled`
6. Tester `POST /api/streaming/library/scan` → doit lister les fichiers
7. Tester `POST /api/streaming/preview` avec `mediaId` + `rendererId`
8. Tester `POST /api/streaming/play` avec `confirmation: "CONFIRMER_STREAM"`
9. Vérifier que `runtime/media-streaming-audit.json` contient l'entrée

## Limites et non-objectifs

- Pas de SOAP automatique envoyé à la TV (mode assisté uniquement)
- Pas de DRM bypass, pas de contournement YouTube/Netflix/IPTV
- Pas de scan de dossiers hors `MEDIA_STREAMING_ALLOWED_DIR`
- Pas de téléchargement de contenu externe
- Pas d'autoplay dans les scénarios (`DLNA_BLOCK_AUTOPLAY_IN_SCENARIOS=true`)
- File de lecture limitée à 50 éléments
- Audit limité aux 200 dernières entrées
