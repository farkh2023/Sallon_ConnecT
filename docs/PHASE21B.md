# Phase 21B — Stabilisation tests runtime profils

## Problème identifié

**Test en échec** : `POST /api/profiles creates a new profile` dans `tests/backend/profiles.test.js`

**Symptôme** : Le test attendait HTTP 201 mais recevait HTTP 409 ("Nombre maximum de profils atteint").

## Cause racine

### 1. Chemins runtime figés à l'initialisation du module

`profileStore.js` et `profileEngine.js` capturaient les chemins runtime comme **constantes au niveau module** :

```js
// Avant — figé au chargement du module
const STORE_PATH = path.resolve(process.env.PROFILES_STORE_PATH || 'runtime/user-profiles.json');
const ACTIVE_PATH = path.resolve(process.env.PROFILES_ACTIVE_PATH || 'runtime/active-profile.json');
const AUDIT_PATH  = path.resolve(process.env.PROFILES_AUDIT_PATH  || 'runtime/profile-audit.json');
```

Avec Jest `--runInBand`, le module `server.js` est chargé une seule fois (cache Node.js) lors du premier fichier de test (`adb.test.js`). Les constantes sont figées à ce moment avec les chemins par défaut (`runtime/`). Aucun changement d'env vars dans `profiles.test.js` ne pouvait les modifier.

### 2. Pollution d'état cross-runs

Chaque exécution de `npm run test:backend` :
1. Créait "Profil Test" dans `runtime/user-profiles.json`
2. Ne nettoyait pas après la suite
3. À la 6ème exécution : 10+ profils dans le fichier → `createProfile` lançait l'erreur "maximum atteint" → route retournait 409

## Correction appliquée

### Résolution de chemins lazy (profileStore.js + profileEngine.js)

Remplacement des constantes figées par des **fonctions** qui lisent `process.env` à chaque appel :

```js
// Après — résolution lazy, lue à l'appel
function getStorePath() { return path.resolve(process.env.PROFILES_STORE_PATH || 'runtime/user-profiles.json'); }
function getActivePath() { return path.resolve(process.env.PROFILES_ACTIVE_PATH || 'runtime/active-profile.json'); }
function getAuditPath()  { return path.resolve(process.env.PROFILES_AUDIT_PATH  || 'runtime/profile-audit.json'); }
```

Idem pour `isEnabled()`, `getMaxItems()`, `getDefaultId()`, `isAuditEnabled()`.

### Isolation par suite dans profiles.test.js

```js
// Redirection avant tout require — prise en compte car lazy
const _origEnv = setRuntimeEnvForSuite('profiles', {
  PROFILES_STORE_PATH: 'user-profiles.json',
  PROFILES_ACTIVE_PATH: 'active-profile.json',
  PROFILES_AUDIT_PATH: 'profile-audit.json',
});

beforeAll(() => { resetTestRuntimeDir('profiles'); });
afterAll(() => { cleanupTestRuntimeDir('profiles'); restoreRuntimeEnv(_origEnv); });
```

### Helper runtimeTestUtils.js

`tests/helpers/runtimeTestUtils.js` expose :
- `createTestRuntimeDir(name)` — crée `tests/.runtime/<name>/`
- `resetTestRuntimeDir(name)` — vide le contenu
- `cleanupTestRuntimeDir(name)` — supprime le dossier
- `setRuntimeEnvForSuite(name, envMap)` — redirige les vars + retourne les originaux
- `restoreRuntimeEnv(originals)` — restaure les vars originales

## Stratégie d'isolation runtime

```
tests/.runtime/               ← .gitignore, non versionné
  profiles/                   ← utilisé par profiles.test.js
    user-profiles.json
    active-profile.json
    profile-audit.json
  backup/                     ← (disponible pour backup.test.js si nécessaire)
  notifications/              ← (disponible si nécessaire)
```

Chaque suite :
1. Redirige ses vars d'env vers son sous-dossier (lazy resolution les prend en compte)
2. Nettoie avant (`beforeAll`)
3. Nettoie après (`afterAll`) et restaure les env vars

Les autres suites (non-profils) continuent d'utiliser `runtime/` car leurs env vars ne sont pas redirigées.

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `server/src/services/profiles/profileStore.js` | Constantes → fonctions lazy |
| `server/src/services/profiles/profileEngine.js` | Constante AUDIT_PATH → fonction lazy |
| `tests/backend/profiles.test.js` | Isolation + beforeAll/afterAll + test anti-régression |
| `tests/helpers/runtimeTestUtils.js` | Helper créé |
| `tests/.runtime/.gitkeep` | Répertoire tracé (contenu ignoré) |
| `.gitignore` | `tests/.runtime/` ajouté |
| `docs/PHASE21B.md` | Cette documentation |

## Résultat final

```
Backend  : 94/94 tests passent (0 échec)
Frontend : 46/46 tests passent (0 échec)
Build    : ✓ TypeScript compilé
```

## Phase 21 toujours fonctionnelle

- Backup : `/api/backup/*` → 13 tests backend passent
- Profils : `/api/profiles/*` → 16 tests backend passent (15 existants + 1 anti-régression)
- Scheduler, notifications, observability : inchangés
