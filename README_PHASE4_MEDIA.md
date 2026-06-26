# Phase 4.0 — Sécurité multimédia locale

## Objectif

Sécuriser l'accès aux fichiers médias locaux avant toute intégration externe (YouTube, DLNA, Samsung TV, Galaxy). Aucun secret ou clé API n'est impliqué dans ce module.

---

## Architecture de sécurité

### Flux de validation à chaque requête de stream

```
GET /api/media/stream/:mediaId
        │
        ▼
 resolveMedia(mediaId)
        │
        ├─ store.getById()                  → 404 si inconnu
        │
        ├─ security.validateMediaPath()     → vérification en 3 couches :
        │     1. isPathInsideAllowedRoots() (lexical, sans I/O)
        │     2. extension ∈ allowedExtensions
        │     3. fs.realpathSync.native()   → résolution symlinks
        │        + isPathInsideAllowedRoots(realPath, realRoots)
        │
        ├─ fs.statSync(validation.realFilePath)  → 404/500
        │
        └─ pipeMediaFile(res, realFilePath)
               └─ stream.on('error') → 404 ou 500, jamais de crash
```

---

## Décisions techniques

### 1. `fs.realpathSync.native` dans `validateMediaPath`

**Problème initial** : `validateMediaPath` n'utilisait que `path.resolve` (résolution lexicale). Un symlink placé _dans_ la racine autorisée pointant _vers_ un fichier externe passait le contrôle de chemin.

**Correction** : `validateMediaPath` appelle maintenant `fs.realpathSync.native(filePath)` après les vérifications lexicales et d'extension. Le chemin résolu est ensuite vérifié contre `getRealAllowedRoots()` (qui résout aussi les racines via `realpathSync.native`).

**Conséquences** :
- La fonction est désormais autonome : elle peut être appelée seule sans dépendre d'un second appel à `assertMediaFileIsAllowed`.
- Elle retourne `{ valid: true, extension, realFilePath }` — le chemin canonique est propagé en aval.
- ENOENT → 404, autres erreurs d'I/O → 500.

### 2. `assertMediaFileIsAllowed` retiré de `resolveMedia`

Avant : `resolveMedia` appelait `validateMediaPath` puis `assertMediaFileIsAllowed` en séquence (double vérification symlink).

Après : `validateMediaPath` intègre le vrai contrôle symlink. `resolveMedia` n'appelle plus `assertMediaFileIsAllowed` séparément. Le code est plus lisible et il n'y a plus de risque d'oublier l'un des deux appels.

`assertMediaFileIsAllowed` reste exporté pour usage autonome éventuel.

### 3. `_absolutePath` stocke le chemin canonique

**Problème initial** : l'indexeur stockait `_absolutePath: absolutePath` (valeur issue de `path.join`). Entre l'indexation et le stream, une normalisation de casse (Windows NTFS) ou un junction point pouvait produire une divergence.

**Correction** : l'indexeur stocke maintenant `_absolutePath: validation.realFilePath`. À la requête de stream, `realpathSync.native` est appliqué sur un chemin déjà canonique — l'opération est idempotente.

### 4. Gestion des erreurs de stream

`pipeMediaFile` utilise `stream.on('error', handleReadStreamError)`. Si le fichier disparaît _pendant_ la lecture (ENOENT en milieu de stream) :
- Headers pas encore envoyés → JSON `{ ok: false, error: "..." }` avec status 404 ou 500.
- Headers déjà envoyés → `res.destroy(error)` pour couper proprement la connexion.

### 5. Indexeur : les symlinks sont exclus dès le scan

Dans `scanRoot`, chaque entrée est testée avec `entry.isSymbolicLink()` avant toute autre action. Si symlink → `continue`. Cela s'applique aussi aux répertoires symlinks (car `Dirent.isDirectory()` ne suit pas les symlinks).

---

## Racines autorisées

Configurées via variables d'environnement :

| Variable | Rôle |
|---|---|
| `MEDIA_ROOT` | Racine vidéos |
| `MEDIA_PHOTOS_ROOT` | Racine photos |
| `MEDIA_ALLOWED_EXTENSIONS` | Extensions CSV (ex: `.mp4,.jpg,.webm`) |

Les deux racines sont résolues via `realpathSync.native` au moment de la validation pour être robustes aux junctions et symlinks au niveau racine.

---

## Tests (Phase 4.0)

Fichier : `tests/backend/media-security-phase40.test.js`

| Test | Ce qu'il vérifie |
|---|---|
| Symlink réel exclu du scan | L'indexeur saute les symlinks OS réels |
| Symlink refusé par `validateMediaPath` | La couche sécurité résout le chemin avant d'autoriser |
| Extension non autorisée via la fonction | `validateMediaPath` retourne 403 + message clair |
| Extension non autorisée jamais indexée | L'API ne retourne jamais `.exe`, `.pdf`, `.zip` |
| Fichier normal streamé OK | Cas nominal : 200, bon `Content-Type` |
| Fichier supprimé avant stream | 404, corps JSON, chemin local non exposé |
| Erreur I/O mid-stream | 500, corps JSON, pas de crash serveur |
| `realFilePath` dans la racine | La valeur retournée est bien dans une racine autorisée |

Tests existants conservés (`tests/backend/media-real.test.js`) :
- Scan de bibliothèque, séparation photos/vidéos
- Byte-range streaming (RFC 7233)
- Mock `realpathSync.native` pour path escaping
- Erreur de stream via mock

---

## Ce qui n'est PAS dans cette phase

- YouTube — pas de clé API, pas d'intégration
- DLNA / UPnP — pas d'intégration
- Samsung TV / SmartThings — pas d'intégration
- Galaxy / Android — pas d'intégration
- Transcoding FFmpeg — hors scope
