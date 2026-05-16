# Phase 6 — Connecteur ADB lecture seule (Galaxy S23 Ultra)

## Objectif

Activer progressivement le connecteur ADB pour détecter un appareil Android autorisé
et afficher uniquement des métadonnées générales non sensibles.

Cette phase reste entièrement locale, sécurisée et réversible.

---

## Fonctionnement ADB

ADB (Android Debug Bridge) permet de communiquer avec un appareil Android via USB.
Cette phase utilise uniquement des commandes **de lecture seule** validées par une allowlist stricte.

```
adbSafety.js (allowlist + validation)
    ↓
adbConnector.js (exécution contrôlée)
    ↓
routes/adb.js (API REST)
    ↓
/api/adb/* (endpoints)
```

---

## Activation contrôlée

### Étapes requises

1. Télécharger [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools)
2. Extraire et noter le chemin de `adb.exe` (ex : `C:\platform-tools\adb.exe`)
3. Sur le Galaxy S23 Ultra :
   - Paramètres → À propos → Numéro de build (taper 7 fois)
   - Paramètres → Options développeur → Activer le débogage USB
4. Connecter le téléphone en USB
5. Sur l'écran du téléphone : **Autoriser** la connexion de débogage
6. Dans `.env` :
   ```
   ADB_ENABLED=true
   ADB_PATH=C:\platform-tools\adb.exe
   ADB_READ_ONLY=true
   ADB_MASK_DEVICE_ID=true
   ```

> **Ne jamais mettre de numéro de série ou IMEI réel dans `.env.example` ou dans git.**

---

## Variables d'environnement Phase 6

| Variable | Défaut | Rôle |
|---|---|---|
| `ADB_ENABLED` | `false` | Activer le connecteur ADB |
| `ADB_PATH` | _(vide)_ | Chemin vers `adb.exe` ou `adb` |
| `ADB_DEVICE_ID` | _(vide)_ | ID de l'appareil cible (optionnel) |
| `ADB_READ_ONLY` | `true` | Mode lecture seule — ne jamais désactiver |
| `ADB_COMMAND_TIMEOUT_MS` | `5000` | Timeout par commande (ms) |
| `ADB_MASK_DEVICE_ID` | `true` | Masquer les IDs dans les réponses API |

---

## Commandes ADB autorisées (allowlist stricte)

| Commande | Données retournées |
|---|---|
| `adb devices` | Liste des appareils connectés |
| `adb shell getprop ro.product.model` | Modèle de l'appareil |
| `adb shell getprop ro.product.manufacturer` | Fabricant |
| `adb shell getprop ro.build.version.release` | Version Android |
| `adb shell dumpsys battery` | Niveau batterie, état de charge |
| `adb shell df /sdcard` | Espace de stockage (total, utilisé, libre) |

Toute commande non présente dans cette liste est **refusée** par `adbSafety.validateAdbCommand()`.

---

## Commandes ADB bloquées (patterns interdits)

| Pattern | Raison |
|---|---|
| `pull` | Copie de fichiers interdite |
| `push` | Envoi de fichiers interdit |
| `install` / `uninstall` | Modification du téléphone interdite |
| `shell rm` / `shell mv` / `shell cp` | Suppression/déplacement interdit |
| `shell input` | Simulation d'entrée utilisateur interdite |
| `shell am` | Lancement d'activités interdit |
| `shell pm` | Gestion de packages interdite |
| `reboot` | Redémarrage interdit |
| `root` / `remount` | Escalade de privilèges interdite |
| `/data/data` | Accès aux données privées interdit |
| `/data/user` | Accès aux données utilisateur interdit |

---

## Architecture du module de sécurité

**`adbSafety.js`** centralise toutes les protections :

- `validateAdbCommand(args)` — vérifie l'allowlist, refuse les patterns bloqués
- `maskDeviceId(value)` — masque les IDs (ex: `R3CN*****T2`)
- `sanitizeAdbOutput(output)` — retire numéros de série, MACs, IMEIs de la sortie
- `buildSafeError(err)` — nettoie les messages d'erreur (chemins, IDs)

---

## Endpoints ajoutés (Phase 6)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/adb/status` | État ADB courant |
| GET | `/api/adb/devices` | Appareils détectés — IDs masqués |
| GET | `/api/adb/diagnostics` | Diagnostics complets (lecture seule) |
| POST | `/api/adb/refresh` | Relance lecture non destructive |
| GET | `/api/adb/safety` | Rapport sécurité : allowlist, patterns bloqués |

L'endpoint `/api/integrations/status` inclut maintenant `adb: { status, readOnly, available, masked, lastCheckedAt }`.

---

## Comportements par état

| État ADB | Cause | Comportement |
|---|---|---|
| `disabled` | `ADB_ENABLED=false` | Message d'aide pour activer |
| `unavailable` | adb non installé ou mauvais chemin | Message pour installer Platform Tools |
| `no_device` | Aucun appareil connecté | Message de connexion USB |
| `unauthorized` | Appareil connecté, non autorisé | Message pour accepter sur le téléphone |
| `available` | Autorisé et connecté | Diagnostics complets affichés |

---

## Mise à jour des scénarios

### Mode Famille
- Vérifie la **disponibilité** du smartphone via ADB (statut uniquement)
- Ne lit pas les photos
- Propose uniquement "smartphone disponible pour future galerie"

### Mode Diagnostic réseau
- Ajoute le statut ADB Android si activé
- Aucune action destructive
- Le résumé inclut l'état de l'appareil Android

---

## Sécurité lecture seule — garanties

1. `ADB_READ_ONLY=true` activé par défaut
2. Toute commande passe par `adbSafety.validateAdbCommand()`
3. Les IDs sont masqués dans toutes les réponses si `ADB_MASK_DEVICE_ID=true`
4. La sortie ADB est nettoyée par `sanitizeAdbOutput()` avant envoi
5. Aucun fichier n'est extrait du téléphone
6. Aucune photo, vidéo ou donnée privée n'est lue
7. Les messages d'erreur sont nettoyés avant affichage

---

## Limites actuelles

- Aucune liste de photos (Phase 7 si nécessaire et explicitement autorisé)
- Comptage des médias via `df /sdcard` uniquement (pas de `MediaStore`)
- Un seul appareil ADB cible (`ADB_DEVICE_ID` optionnel)
- Windows uniquement testé (`adb.exe`)

---

## Prochaine étape — Phase 7

- Découverte DLNA/UPnP complète avec streaming vers Samsung TV
- Contrôle SmartThings (commandes TV vérifiées)
- Notifications push locales
- Planification temporelle des scénarios
