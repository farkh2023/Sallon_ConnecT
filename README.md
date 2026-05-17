# Sallon-ConnecT

**Hub intelligent pour centraliser les appareils, services multimédias et agents IA du salon.**

---

## Présentation

Sallon-ConnecT est une plateforme personnelle de type **hub-agent** destinée à centraliser
les appareils connectés d'un salon et à afficher un tableau de bord principal sur une
Smart TV Samsung. Elle simule un workflow multi-agents où chaque agent exécute une
spécialité, puis les résultats sont fusionnés dans une interface web unique et autonome.

---

## Objectif

Offrir un point de contrôle unique pour :
- Voir le statut de tous les appareils du salon en temps réel
- Lancer des scénarios intelligents (cinéma, travail, famille…)
- Accéder aux services multimédias depuis un seul écran
- Orchestrer des agents IA spécialisés pour automatiser des tâches du quotidien

---

## Appareils prévus (Phase 1)

| ID logique              | Appareil                    | Rôle                          |
|-------------------------|-----------------------------|-------------------------------|
| `IA_ordinateur_BOM_WXX9`| PC Portable Huawei          | Orchestrateur / Agent hub     |
| `Samsung_TV_7Series`    | Smart TV Samsung 7 Series   | Écran d'affichage principal   |
| `PC_Bureau`             | PC de Bureau                | Serveur de médias local       |
| `Galaxy_S23_Ultra`      | Smartphone Samsung Galaxy   | Source contenu mobile         |
| `Box_SFR_Fibre`         | Box SFR Fibre               | Passerelle réseau domestique  |

---

## Fonctionnement du Hub-Agent

Le workflow multi-agents se décompose en 6 étapes :

1. **Agent Découverte réseau** — cartographie les appareils disponibles
2. **Agent Inventaire** — organise par type, rôle et priorité
3. **Agent Affichage TV** — prépare l'interface Samsung TV 4K
4. **Agent Multimédia** — indexe les services disponibles
5. **Agent Automatisation** — configure les scénarios intelligents
6. **Agent Synthèse** — fusionne tous les résultats dans le tableau de bord final

---

## Comment ouvrir le projet

### Phase 2 — Serveur local requis (recommandé)

La Phase 2 charge les données depuis des fichiers JSON via `fetch()`.
Les navigateurs bloquent `fetch` sur le protocole `file://` — un serveur local est nécessaire.

**Option 1 — Python (recommandé)**
```powershell
cd C:\Users\Youss\Sallon_ConnecT
python -m http.server 8080
```
Puis ouvrir : [http://localhost:8080](http://localhost:8080)

**Option 2 — Node.js**
```powershell
npx serve .
```

**Option 3 — VS Code**
Installer l'extension **Live Server**, clic droit sur `index.html` → *Open with Live Server*.

---

### Phase 1 — Fichier autonome (sans serveur)

Le prototype Phase 1 reste accessible sans serveur :
```powershell
start sallon-connect-hub.html   # Windows
open sallon-connect-hub.html    # macOS
```

---

## Phase 12 — Notifications locales (actuelle)

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
node server.js
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → **Notifications** (nav)

### Activation notifications navigateur

> ⚠ Les notifications navigateur sont **désactivées par défaut** et ne sont **jamais demandées automatiquement**. Cliquez le bouton "🔔 Activer notifications navigateur" pour donner la permission manuellement.

### Variables `.env` Phase 12

| Variable | Défaut | Rôle |
|---|---|---|
| `NOTIFICATIONS_ENABLED` | `true` | Active le centre de notifications |
| `NOTIFICATIONS_BROWSER_ENABLED` | `false` | Notifications navigateur (opt-in) |
| `NOTIFICATIONS_MAX_ITEMS` | `200` | Limite de notifications stockées |
| `NOTIFICATIONS_MASK_SENSITIVE_DATA` | `true` | Masquage automatique |
| `NOTIFICATIONS_DEDUP_WINDOW_MS` | `30000` | Fenêtre déduplication |
| `NOTIFICATIONS_AUTO_CLEANUP_DAYS` | `30` | Nettoyage auto (jours) |

### Commandes curl Phase 12

```powershell
curl http://localhost:3000/api/notifications
curl http://localhost:3000/api/notifications/stats
curl http://localhost:3000/api/notifications/safety
curl -X POST http://localhost:3000/api/notifications -H "Content-Type: application/json" -d "{\"type\":\"system\",\"level\":\"info\",\"title\":\"Test\",\"message\":\"Notification locale\"}"
curl -X PATCH http://localhost:3000/api/notifications/read-all
curl -X DELETE http://localhost:3000/api/notifications
```

> **Sécurité** : 100% local. Aucune donnée envoyée à Firebase, email, SMS ou cloud. Tokens, IMEI, IP, chemins, numéros de série masqués automatiquement. Browser Notifications uniquement sur action utilisateur.

---

## Phase 11 — Streaming assisté DLNA

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
node server.js
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → **Centre multimédia** → **🎵 Streaming assisté**

### Procédure d'activation Phase 11

> ⚠ **Avertissement sécurité** : Seuls les fichiers du dossier `MEDIA_STREAMING_ALLOWED_DIR` sont accessibles. Aucun chemin absolu n'est exposé. Aucun fichier n'est lu automatiquement. Renderer dans l'allowlist obligatoire. Confirmation obligatoire.

1. Configurer `.env` :
   ```
   MEDIA_STREAMING_ENABLED=true
   MEDIA_STREAMING_ALLOWED_DIR=C:\Chemin\Vers\Medias
   DLNA_STREAMING_ENABLED=true
   DLNA_RENDERER_ALLOWLIST=id-renderer-dlna
   ```
2. Lancer `node server.js`
3. Cliquer **⚙ Politique** → vérifier que streaming est activé
4. Cliquer **🔍 Scanner médiathèque** → voir les médias disponibles
5. Sélectionner un média → choisir un renderer → renseigner le code de confirmation
6. Cliquer **▶ Lancer la lecture** → recevoir les instructions assistées

### Variables `.env` Phase 11

| Variable | Défaut | Rôle |
|---|---|---|
| `MEDIA_STREAMING_ENABLED` | `false` | Active le module streaming |
| `MEDIA_STREAMING_REQUIRE_CONFIRMATION` | `true` | Code obligatoire |
| `MEDIA_STREAMING_CONFIRMATION_CODE` | `CONFIRMER_STREAM` | Code de confirmation |
| `MEDIA_STREAMING_ALLOWED_DIR` | *(vide)* | Dossier unique autorisé |
| `MEDIA_STREAMING_ALLOWED_EXTENSIONS` | `.mp4,.mkv,.mp3,.jpg,.jpeg,.png` | Extensions autorisées |
| `MEDIA_STREAMING_MAX_FILE_MB` | `500` | Taille max fichier |
| `DLNA_STREAMING_ENABLED` | `false` | Active les fonctions DLNA streaming |
| `DLNA_RENDERER_ALLOWLIST` | *(vide)* | IDs renderers autorisés |
| `DLNA_BLOCK_AUTOPLAY_IN_SCENARIOS` | `true` | Bloque autoplay dans scénarios |

> **Sécurité** : 5 gardes avant toute instruction. Chemins absolus jamais exposés. Traversal de répertoire bloqué. Mode assisté uniquement (pas de SOAP automatique). Toutes les tentatives auditées dans `runtime/media-streaming-audit.json`.

---

## Phase 10 — Commandes TV Samsung via SmartThings

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → **Centre multimédia** → **SmartThings Samsung TV** → **📺 Commandes TV**

### Procédure d'activation Phase 10

> ⚠ **Avertissement sécurité** : Les commandes TV sont réelles et affectent votre téléviseur physique. Activez uniquement si vous comprenez les risques. Une allowlist vide = aucune commande possible. Ne jamais autoriser de TV non identifiée.

1. Obtenir l'ID SmartThings de votre TV via `GET /api/smartthings/devices`
2. Renseigner dans `.env` :
   ```dotenv
   SMARTTHINGS_TV_COMMANDS_ENABLED=true
   SMARTTHINGS_TV_CONFIRMATION_CODE=CONFIRMER_TV
   SMARTTHINGS_TV_DEVICE_ALLOWLIST=your-tv-device-id
   SMARTTHINGS_TV_COMMAND_ALLOWLIST=switch.on,switch.off,mediaPlayback.play,mediaPlayback.pause,mediaPlayback.stop
   SMARTTHINGS_TV_AUDIT_ENABLED=true
   ```
3. Garder impérativement :
   ```dotenv
   SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS=true
   SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT=true
   SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE=true
   ```

> **Sécurité** : 6 gardes avant toute exécution. Volume, keypad, source bloqués par défaut. Token jamais affiché. IDs masqués. Toutes les tentatives auditées dans `runtime/smartthings-tv-audit.json`.

### Commandes de test Phase 10

```powershell
# Politique commandes TV
curl http://localhost:3000/api/smartthings/tv/command-policy

# TV allowlistées (IDs masqués)
curl http://localhost:3000/api/smartthings/tv/allowed-devices

# Capabilities TV
curl http://localhost:3000/api/smartthings/tv/TV_ID/capabilities

# Prévisualiser une commande (jamais d'exécution réelle)
curl -X POST http://localhost:3000/api/smartthings/tv/TV_ID/commands/preview `
  -H "Content-Type: application/json" `
  -d "{""command"":""mediaPlayback.pause""}"

# Exécuter (TV allowlistée + confirmation)
curl -X POST http://localhost:3000/api/smartthings/tv/TV_ID/commands/execute `
  -H "Content-Type: application/json" `
  -d "{""command"":""mediaPlayback.pause"",""confirmationCode"":""CONFIRMER_TV"",""reason"":""Test contrôlé depuis Sallon-ConnecT""}"

# Audit TV
curl http://localhost:3000/api/smartthings/tv/audit

# Vider l'audit TV
curl -X DELETE http://localhost:3000/api/smartthings/tv/audit
```

### Variables `.env` Phase 10

| Variable | Défaut | Rôle |
|---|---|---|
| `SMARTTHINGS_TV_COMMANDS_ENABLED` | `false` | Activer commandes TV (opt-in) |
| `SMARTTHINGS_TV_COMMANDS_REQUIRE_CONFIRMATION` | `true` | Confirmation obligatoire |
| `SMARTTHINGS_TV_CONFIRMATION_CODE` | `CONFIRMER_TV` | Code de confirmation |
| `SMARTTHINGS_TV_DEVICE_ALLOWLIST` | _(vide)_ | IDs TV autorisées — jamais commitées |
| `SMARTTHINGS_TV_COMMAND_ALLOWLIST` | `switch.on,...` | Commandes autorisées |
| `SMARTTHINGS_TV_AUDIT_ENABLED` | `true` | Audit local — toujours actif |
| `SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS` | `true` | Bloquer volume/mute — obligatoire |
| `SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT` | `true` | Bloquer keypad — obligatoire |
| `SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE` | `true` | Bloquer changement source — obligatoire |

---

## Phase 9 — Exécution contrôlée de scènes SmartThings

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Centre multimédia** → **SmartThings Samsung TV** → **⚡ Politique d'exécution** / **▶ Scènes exécutables**

### Procédure d'activation Phase 9

> ⚠ **Avertissement sécurité** : L'exécution de scènes SmartThings déclenche des actions réelles sur vos appareils physiques. Ne l'activez que si vous comprenez les risques. Une allowlist vide = aucune scène exécutable.

1. Activer Phase 8 (token + `SMARTTHINGS_ENABLED=true` — voir section Phase 8)
2. Récupérer les IDs de scènes via `GET /api/smartthings/scenes`
3. Renseigner l'allowlist dans `.env` :
   ```
   SMARTTHINGS_ALLOW_SCENE_EXECUTION=true
   SMARTTHINGS_SCENE_ALLOWLIST=scene-id-1,scene-id-2
   ```
4. Garder impérativement :
   ```
   SMARTTHINGS_SCENE_EXECUTION_REQUIRE_CONFIRMATION=true
   SMARTTHINGS_BLOCK_DEVICE_COMMANDS=true
   SMARTTHINGS_BLOCK_SENSITIVE_DEVICES=true
   SMARTTHINGS_SCENE_AUDIT_ENABLED=true
   ```

> **Sécurité** : Cinq gardes obligatoires avant toute exécution : activation opt-in, allowlist, code de confirmation, audit activé, commandes directes bloquées. Toutes les tentatives (succès et échecs) sont auditées localement dans `runtime/smartthings-scene-audit.json`. Le token est masqué partout.

### Commandes de test Phase 9

```powershell
# Politique d'exécution courante
curl http://localhost:3000/api/smartthings/scenes/execution-policy

# Scènes exécutables (filtrées par allowlist, IDs masqués)
curl http://localhost:3000/api/smartthings/scenes/executable

# Exécuter une scène (SCENE_ID = ID réel depuis /scenes/executable)
curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE_ID/execute `
  -H "Content-Type: application/json" `
  -d "{""confirmationCode"":""CONFIRMER"",""reason"":""Test contrôlé""}"

# Historique d'audit
curl http://localhost:3000/api/smartthings/scenes/audit

# Vider l'audit
curl -X DELETE http://localhost:3000/api/smartthings/scenes/audit
```

### Variables `.env` Phase 9

| Variable | Défaut | Rôle |
|---|---|---|
| `SMARTTHINGS_ALLOW_SCENE_EXECUTION` | `false` | Activer l'exécution (opt-in) |
| `SMARTTHINGS_SCENE_EXECUTION_REQUIRE_CONFIRMATION` | `true` | Code de confirmation obligatoire |
| `SMARTTHINGS_SCENE_EXECUTION_CONFIRMATION_CODE` | `CONFIRMER` | Code à saisir |
| `SMARTTHINGS_SCENE_ALLOWLIST` | _(vide)_ | IDs autorisés, séparés par virgule |
| `SMARTTHINGS_SCENE_AUDIT_ENABLED` | `true` | Audit local — toujours actif |
| `SMARTTHINGS_SCENE_AUDIT_PATH` | `runtime/smartthings-scene-audit.json` | Chemin fichier audit |
| `SMARTTHINGS_BLOCK_DEVICE_COMMANDS` | `true` | Bloquer commandes directes — obligatoire |
| `SMARTTHINGS_BLOCK_SENSITIVE_DEVICES` | `true` | Bloquer appareils sensibles — obligatoire |

---

## Phase 8 — SmartThings Samsung TV

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Centre multimédia** → **SmartThings Samsung TV**

### Procédure d'activation SmartThings

1. Créer un Personal Access Token sur [account.smartthings.com/tokens](https://account.smartthings.com/tokens)
2. Sélectionner uniquement les scopes en lecture :
   - `devices:read`
   - `locations:read`
   - `scenes:read`
3. Copier le token dans `.env`, jamais dans le code :
   ```
   SMARTTHINGS_TOKEN=<votre-token>
   ```
4. Activer :
   ```
   SMARTTHINGS_ENABLED=true
   ```
5. Garder impérativement :
   ```
   SMARTTHINGS_READ_ONLY=true
   SMARTTHINGS_ALLOW_SCENE_EXECUTION=false
   ```

> **Sécurité** : Le token n'est jamais affiché, jamais loggé, jamais exposé dans les réponses API. Les IDs SmartThings sont masqués (`SMARTTHINGS_MASK_IDS=true`). Aucune scène n'est exécutée. Aucune commande TV n'est envoyée.

### Commandes de test Phase 8

```powershell
# État SmartThings
curl http://localhost:3000/api/smartthings/status

# Rapport sécurité
curl http://localhost:3000/api/smartthings/safety

# Locations
curl http://localhost:3000/api/smartthings/locations

# Appareils (IDs masqués)
curl http://localhost:3000/api/smartthings/devices

# TV Samsung
curl http://localhost:3000/api/smartthings/tv

# Scènes (IDs masqués)
curl http://localhost:3000/api/smartthings/scenes

# Prévisualiser une scène (sans exécuter)
curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE_ID/preview

# Statut intégrations (inclut SmartThings)
curl http://localhost:3000/api/integrations/status
```

### Variables `.env` Phase 8

| Variable | Défaut | Rôle |
|---|---|---|
| `SMARTTHINGS_ENABLED` | `false` | Activer SmartThings |
| `SMARTTHINGS_TOKEN` | _(vide)_ | Token confidentiel — jamais commité |
| `SMARTTHINGS_READ_ONLY` | `true` | Lecture seule — obligatoire |
| `SMARTTHINGS_API_BASE_URL` | `https://api.smartthings.com/v1` | URL API SmartThings |
| `SMARTTHINGS_TV_DEVICE_ID` | _(vide)_ | ID de la TV (optionnel) |
| `SMARTTHINGS_DEFAULT_LOCATION_ID` | _(vide)_ | ID de la location (optionnel) |
| `SMARTTHINGS_COMMAND_TIMEOUT_MS` | `5000` | Timeout requêtes (ms) |
| `SMARTTHINGS_MASK_IDS` | `true` | Masquer les IDs dans les réponses |
| `SMARTTHINGS_ALLOW_SCENE_EXECUTION` | `false` | Exécution scènes — toujours false dans cette phase |

---

## Phase 7 — Découverte DLNA/UPnP

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Centre multimédia** → **Découverte TV & DLNA**

### Procédure d'activation DLNA

Dans `.env` : `DLNA_ENABLED=true` puis redémarrer le serveur.

> **Sécurité** : `DLNA_READ_ONLY=true` et `DLNA_MASK_LOCAL_IPS=true` sont activés par défaut. Aucune action de contrôle TV n'est possible.

### Commandes de test Phase 7

```powershell
# État DLNA
curl http://localhost:3000/api/dlna/status

# Lancer une découverte locale
curl -X POST http://localhost:3000/api/dlna/discover

# Derniers appareils découverts
curl http://localhost:3000/api/dlna/devices

# Renderers (TV, lecteurs)
curl http://localhost:3000/api/dlna/renderers

# Serveurs médias
curl http://localhost:3000/api/dlna/servers

# Rapport sécurité
curl http://localhost:3000/api/dlna/safety

# Vider le cache
curl -X DELETE http://localhost:3000/api/dlna/cache
```

### Variables `.env` Phase 7

| Variable | Défaut | Rôle |
|---|---|---|
| `DLNA_ENABLED` | `false` | Activer DLNA |
| `DLNA_DISCOVERY_TIMEOUT_MS` | `3000` | Timeout découverte |
| `DLNA_MAX_RESPONSES` | `30` | Max appareils détectés |
| `DLNA_FETCH_DESCRIPTIONS` | `false` | Récupérer détails XML |
| `DLNA_MASK_LOCAL_IPS` | `true` | Masquer IP locales |
| `DLNA_READ_ONLY` | `true` | Lecture seule — obligatoire |

---

## Phase 6 — Connecteur ADB

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Centre multimédia** → **Diagnostic smartphone Android**

### Procédure d'activation ADB

1. Télécharger [Android SDK Platform Tools](https://developer.android.com/tools/releases/platform-tools)
2. Extraire → noter le chemin de `adb.exe`
3. Sur le Galaxy S23 Ultra : **Options développeur → Débogage USB**
4. Connecter le téléphone → Accepter l'autorisation sur l'écran
5. Dans `.env` :
   ```
   ADB_ENABLED=true
   ADB_PATH=C:\platform-tools\adb.exe
   ADB_READ_ONLY=true
   ADB_MASK_DEVICE_ID=true
   ```

> **Sécurité** : Ne jamais commiter un numéro de série ou IMEI réel. `ADB_READ_ONLY=true` est obligatoire.

### Commandes de test Phase 6

```powershell
# État ADB
curl http://localhost:3000/api/adb/status

# Appareils détectés (IDs masqués)
curl http://localhost:3000/api/adb/devices

# Diagnostics complets (lecture seule)
curl http://localhost:3000/api/adb/diagnostics

# Rapport de sécurité (allowlist + patterns bloqués)
curl http://localhost:3000/api/adb/safety

# Rafraîchir les diagnostics
curl -X POST http://localhost:3000/api/adb/refresh
```

### Variables `.env` Phase 6

| Variable | Défaut | Rôle |
|---|---|---|
| `ADB_ENABLED` | `false` | Activer le connecteur ADB |
| `ADB_PATH` | _(vide)_ | Chemin vers `adb.exe` |
| `ADB_DEVICE_ID` | _(vide)_ | ID cible (optionnel) |
| `ADB_READ_ONLY` | `true` | Lecture seule — obligatoire |
| `ADB_COMMAND_TIMEOUT_MS` | `5000` | Timeout par commande |
| `ADB_MASK_DEVICE_ID` | `true` | Masquer les IDs |

---

## Phase 5 — Scénarios intelligents

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Scénarios intelligents**

### Commandes de test Phase 5

```powershell
# Liste des scénarios disponibles
curl http://localhost:3000/api/scenarios/runtime

# Prévisualiser un scénario (aucune action exécutée)
curl -X POST http://localhost:3000/api/scenarios/cinema/preview

# Exécuter en mode simulation (défaut, sans action réelle)
curl -X POST http://localhost:3000/api/scenarios/cinema/run `
  -H "Content-Type: application/json" `
  -d "{""mode"":""simulated""}"

# Exécuter en mode assisté
curl -X POST http://localhost:3000/api/scenarios/cinema/run `
  -H "Content-Type: application/json" `
  -d "{""mode"":""assisted""}"

# Historique des exécutions
curl http://localhost:3000/api/scenarios/history

# Statut des intégrations
curl http://localhost:3000/api/integrations/status
curl http://localhost:3000/api/media/status
```

### Scénarios disponibles

| ID | Nom | Mode par défaut |
|---|---|---|
| `cinema` | Mode Cinéma | simulated |
| `travail` | Mode Travail | simulated |
| `presentation` | Mode Présentation | simulated |
| `famille` | Mode Famille | simulated |
| `veille` | Mode Veille | simulated |
| `diagnostic` | Mode Diagnostic réseau | simulated |

### Modes d'exécution

| Mode | Description | Sécurité |
|---|---|---|
| `simulated` | Simulation complète, aucune action réelle | Maximum |
| `assisted` | Instructions manuelles, aucune action automatique | Élevée |
| `live` | Contrôle réel (bloqué par défaut) | Exige `SCENARIO_LIVE_ENABLED=true` |

---

## Phase 15 - PWA et mode TV avance

La Phase 15 ajoute une couche PWA et un mode TV avance au frontend Next.js.
L'ancien `index.html` et le backend Express restent inchanges.

### Ports

| Service           | Port | URL                   |
|-------------------|------|-----------------------|
| Backend Express   | 3000 | http://localhost:3000 |
| Frontend Next.js  | 3001 | http://localhost:3001 |

### Lancement

```powershell
# Backend + frontend
npm run dev

# Ou separement
npm start
cd frontend
npm run dev -- --port 3001
```

### PWA

- Manifest: `http://localhost:3001/manifest.webmanifest`
- Page offline: `http://localhost:3001/offline`
- Service worker: `frontend/public/sw.js`
- En dev, activer explicitement avec `NEXT_PUBLIC_ENABLE_SW=true`

Le service worker ne met jamais en cache `/api/*`, notifications, SmartThings, ADB, DLNA, streaming, scheduler ou runtime.

### Mode TV

Le bouton `Mode TV` affiche un dashboard grand ecran avec statuts backend, appareils, Smart TV, ADB, DLNA, SmartThings, streaming, notifications non lues, prochaines taches et dernier evenement securite.

Raccourcis:

| Touche | Action sure |
|---|---|
| `T` | Activer/desactiver mode TV |
| `F` | Plein ecran |
| `R` | Rafraichir les statuts |
| `N` | Ouvrir notifications |
| `S` | Ouvrir taches |
| `Echap` | Quitter panneau ou plein ecran |
| Fleches / `Entree` | Navigation et action sure dans la grille TV |

### Installation PWA et offline

Le bouton `Installer Sallon-ConnecT` apparait si le navigateur expose `beforeinstallprompt`.
L'installation n'est jamais forcee. Le mode offline affiche une page locale claire mais ne stocke pas les donnees runtime.

### Securite

- Aucun token ou ID complet affiche.
- Aucune IP complete ou chemin complet affiche.
- Aucun stockage local de donnees API sensibles.
- Aucune notification cloud.
- Aucune commande TV, scene SmartThings, streaming ou scheduler sensible declenchee par raccourci.

Documentation detaillee: `docs/PHASE15.md`.

---

## Phase 16 - Packaging Windows local

La Phase 16 ajoute un packaging Windows local pour lancer Sallon-ConnecT par double-clic, diagnostiquer l'etat du hub et creer une archive portable securisee.

### Installation dependances

```powershell
scripts\windows\install-deps.bat
```

Ou:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install-deps.ps1
```

### Lancement Windows

```powershell
scripts\windows\start-sallon-connect.bat
```

Le script lance le backend Express sur `http://localhost:3000`, le frontend Next.js sur `http://localhost:3001`, conserve l'ancien frontend sur `http://localhost:3000` et ecrit les logs dans `logs/`.

### Statut et arret

```powershell
scripts\windows\status-sallon-connect.bat
scripts\windows\stop-sallon-connect.bat
```

### Dashboard

```powershell
scripts\windows\open-dashboard.bat
```

Le script ouvre `http://localhost:3001` si disponible, sinon `http://localhost:3000`.

### Raccourci Bureau

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
```

Le raccourci `Sallon-ConnecT` lance `scripts\windows\start-sallon-connect.bat` sans privileges administrateur.

### Build frontend

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\build-frontend.ps1
```

### Diagnostic local

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\diagnose.ps1
```

Le rapport est ecrit dans `logs/diagnostic-YYYYMMDD-HHMM.txt` sans afficher le contenu `.env`.

### Package portable

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\package-portable.ps1
```

Sortie: `dist/Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip`.

L'archive exclut `.env`, `.env.local`, `frontend/.env.local`, `node_modules/`, `frontend/node_modules/`, `.next/`, `frontend/.next/`, `.git/`, `runtime/*.json`, `logs/*.log`, `logs/*.txt`, `*.pem` et `*.key`.

Documentation detaillee: `docs/PHASE16.md`.

---

## Phase 17 - Tests automatises

La Phase 17 ajoute une suite de tests locale pour securiser le backend, le frontend, les gardes de securite, le packaging Windows et la syntaxe PowerShell.

### Commandes

```powershell
npm test
npm run test:backend
npm run test:frontend
npm run test:packaging
npm run test:windows
npm run check
```

### Couverture

- Backend: Jest + Supertest pour `/api/health`, notifications, scheduler et contrats API.
- Securite: tests des gardes SmartThings, commandes TV, streaming, ADB, DLNA et service worker.
- Frontend: Vitest + React Testing Library avec `fetch` mocke, sans backend reel.
- Packaging: inspection du ZIP portable et exclusions sensibles.
- Windows: parsing AST des scripts `scripts/windows/*.ps1`.

Les tests ne lancent aucune commande ADB reelle, aucune decouverte DLNA agressive, aucun appel SmartThings reel, aucune commande TV, aucune scene et aucun streaming reel.

Documentation detaillee: `docs/PHASE17.md`.

---

## Phase 17B - Maintenance dependances

Maintenance controlee des dependances apres mise en place des tests Phase 17.

### Audit

- Node.js: `v22.11.0`
- npm: `10.9.0`
- Racine: 0 vulnerabilite avant/apres `npm audit fix`
- Frontend: 2 vulnerabilites moderees avant/apres `npm audit fix`

Rapports:

- `logs/npm-audit-root.json`
- `logs/npm-audit-frontend.json`

### Corrections

`npm audit fix` sans `--force` a ete lance a la racine et dans `frontend/`.

Aucune dependance n'a ete modifiee: la seule correction frontend proposee par npm exige `npm audit fix --force` et installerait `next@9.3.3`, un downgrade breaking incompatible avec le frontend Next.js actuel.

### Vulnerabilites restantes

Les 2 vulnerabilites moderees restantes viennent de `postcss <8.5.10` via `next`. Elles sont documentees et non corrigees automatiquement pour eviter un changement majeur dangereux.

Validation apres maintenance:

```powershell
npm run check
```

Resultat: OK.

Documentation detaillee: `docs/PHASE17B.md`.

---

## Phase 18 - Observabilite globale

La Phase 18 ajoute un tableau d'observabilite local dans le frontend Next.js et une API backend dediee. L'objectif est de suivre l'etat global sans exposer de secret, chemin complet, IP complete, ID complet, contenu runtime ou log brut.

### Endpoints observability

```powershell
curl http://localhost:3000/api/observability/overview
curl http://localhost:3000/api/observability/health
curl http://localhost:3000/api/observability/security
curl http://localhost:3000/api/observability/runtime
curl http://localhost:3000/api/observability/tests
curl http://localhost:3000/api/observability/logs
curl http://localhost:3000/api/observability/safety
```

### Interface

- Section Next.js: `Observabilite`
- Raccourci clavier: `H`
- Bouton: `Actualiser`
- Donnees affichees: backend, frontend attendu, integrations, securite, runtime, logs, tests, scheduler, notifications et dernier refresh.

### Scheduler et notifications

Action sure ajoutee:

```text
observability.snapshot
```

Elle collecte un resume non sensible, l'ajoute a l'historique scheduler et ne lance aucun test ni action sensible. Une notification locale est creee seulement si l'etat global passe a `warning` ou `error`, avec deduplication anti-spam.

### Securite

- API observability en `Cache-Control: no-store`
- Tout reste local, aucune telemetrie cloud
- Runtime et logs jamais exposes en contenu brut
- Service worker ne cache pas `/api/*`
- SmartThings, commandes TV, ADB, DLNA et streaming restent sous les gardes existants

### Tests

```powershell
npm run test:backend
npm run test:frontend
npm run build:frontend
npm run check
```

Script optionnel:

```powershell
npm run health
```

Documentation detaillee: `docs/PHASE18.md`.

---

## Phase 14 — Frontend React / Next.js

Migration progressive du frontend vanilla vers React + Next.js TypeScript.  
**L'ancien `index.html` est conservé et reste fonctionnel.** Les deux frontends coexistent.

### Ports

| Service           | Port | URL                   |
|-------------------|------|-----------------------|
| Backend Express   | 3000 | http://localhost:3000 |
| Frontend Next.js  | 3001 | http://localhost:3001 |

### Lancement

```powershell
# Backend seul (index.html accessible)
npm start

# Frontend Next.js seul
cd frontend
npm run dev -- --port 3001

# Les deux en parallèle (depuis la racine)
npm install   # installe concurrently
npm run dev
```

### Configuration frontend

```powershell
# Copier .env.example → .env.local (déjà créé en développement)
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

### Structure frontend

```
frontend/src/
├── app/          — layout, page, globals.css
├── components/   — AppShell, TopNav, panels par section
├── lib/          — api.ts, types.ts, format.ts, safety.ts
└── hooks/        — useApi, usePolling, useNotifications
```

### Avertissement sécurité

- CORS limité à `http://localhost:3000` et `http://localhost:3001`
- Aucun token ou données sensibles dans le frontend
- Actions sensibles désactivées ou protégées par confirmation
- Tout reste local — aucun cloud, aucun push externe

---

## Phase 13 — Tâches planifiées (Scheduler)

Moteur de scheduling local tick-based. Aucun cron système, aucun cloud, aucun push externe.  
Seules les actions read-only sont autorisées. Intégré aux notifications Phase 12.

```powershell
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Tâches planifiées**

### Commandes de test Phase 13

```powershell
# État du moteur
curl http://localhost:3000/api/scheduler/status

# Politiques de sécurité
curl http://localhost:3000/api/scheduler/safety

# Actions autorisées / bloquées
curl http://localhost:3000/api/scheduler/actions

# Liste des tâches
curl http://localhost:3000/api/scheduler/schedules

# Créer une tâche (interval)
curl -X POST http://localhost:3000/api/scheduler/schedules `
  -H "Content-Type: application/json" `
  -d "{""name"":""Test health"",""actionType"":""system.healthCheck"",""schedule"":{""type"":""interval"",""intervalMinutes"":15}}"

# Exécuter manuellement (remplacer <id> par l'ID retourné)
curl -X POST http://localhost:3000/api/scheduler/schedules/<id>/run

# Tenter une action bloquée (doit retourner 403)
curl -X POST http://localhost:3000/api/scheduler/schedules `
  -H "Content-Type: application/json" `
  -d "{""name"":""Bloqué"",""actionType"":""streaming.play"",""schedule"":{""type"":""manual""}}"

# Historique des exécutions
curl http://localhost:3000/api/scheduler/history

# Activer / désactiver
curl -X PATCH http://localhost:3000/api/scheduler/schedules/<id>/enable
curl -X PATCH http://localhost:3000/api/scheduler/schedules/<id>/disable

# Supprimer une tâche
curl -X DELETE http://localhost:3000/api/scheduler/schedules/<id>

# Vider l'historique
curl -X DELETE http://localhost:3000/api/scheduler/history
```

### Variables d'environnement Phase 13

| Variable | Défaut | Description |
|---|---|---|
| `SCHEDULER_ENABLED` | `true` | Active le moteur |
| `SCHEDULER_TICK_MS` | `30000` | Intervalle de vérification (ms) |
| `SCHEDULER_ALLOW_SENSITIVE_ACTIONS` | `false` | Garder `false` — jamais `true` |
| `SCHEDULER_NOTIFY_ON_SUCCESS` | `true` | Notification Phase 12 en cas de succès |
| `SCHEDULER_AUTO_START` | `true` | Démarrage automatique du moteur |

> **Sécurité** : Le mode live est bloqué par défaut. N'activez `SCENARIO_LIVE_ENABLED=true` que si vous comprenez les implications.

### Variables `.env` Phase 5

| Variable | Défaut | Rôle |
|---|---|---|
| `SCENARIO_LIVE_ENABLED` | `false` | Débloquer le mode live (risque élevé) |
| `SCENARIO_HISTORY_ENABLED` | `true` | Conserver l'historique local |
| `ADB_ENABLED` | `false` | Accès Galaxy S23 Ultra via ADB |
| `ADB_PATH` | _(vide)_ | Chemin vers adb.exe |
| `ADB_DEVICE_ID` | _(vide)_ | ID appareil ADB (optionnel) |
| `DLNA_ENABLED` | `false` | Découverte DLNA/UPnP locale |
| `DLNA_DISCOVERY_TIMEOUT_MS` | `3000` | Timeout découverte DLNA (ms) |
| `SMARTTHINGS_ENABLED` | `false` | Contrôle Samsung TV |
| `SMARTTHINGS_TOKEN` | _(vide)_ | Token confidentiel — jamais commité |
| `SMARTTHINGS_TV_DEVICE_ID` | _(vide)_ | ID de la TV dans SmartThings |
| `SMARTTHINGS_DEFAULT_LOCATION_ID` | _(vide)_ | Localisation SmartThings |
| `YOUTUBE_EMBED_ENABLED` | `true` | Embed YouTube public (sans clé API) |
| `MEDIA_LOCAL_GALLERY_ENABLED` | `false` | Scan galerie photos locale |
| `MEDIA_LOCAL_GALLERY_PATH` | _(vide)_ | Chemin du dossier d'images |

> **Sécurité** : `.env` est dans `.gitignore`. Ne jamais commiter de token ou clé API réelle.

---

## Phase 4 — Centre multimédia

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000) → section **Médiathèque**

### Tester les endpoints Phase 4

```powershell
curl http://localhost:3000/api/media/services
curl http://localhost:3000/api/media/status
curl http://localhost:3000/api/integrations/status
```

---

## Phase 3 — Démarrage rapide

```powershell
cd C:\Users\Youss\Sallon_ConnecT
npm install
npm start
```
Ouvrir : [http://localhost:3000](http://localhost:3000)

Badge **⬤ En direct** → backend actif, statuts réseau réels.
Badge **◎ Simulé** → mode dégradé, données statiques JSON.

Pour configurer les appareils : `copy .env.example .env` puis renseigner les hostnames.

---

## Roadmap technique

### Phase 1 — Prototype HTML autonome ✅ (en cours)
- Interface visuelle complète
- Simulation multi-agents interactive
- Dashboard adapté à l'affichage TV

### Phase 2 — Application locale
- Migration vers React ou Next.js
- Gestion des appareils dans un fichier `devices.json`
- Sauvegarde locale (localStorage / IndexedDB)

### Phase 3 — Détection réseau réelle
- Scan réseau local (Node.js / Python)
- Découverte mDNS / UPnP / DLNA
- Statuts réels des appareils en temps réel

### Phase 4 — Services multimédias
- Galerie photos depuis Galaxy S23 Ultra
- Vidéos locales depuis PC Bureau
- Intégration YouTube API
- Streaming local DLNA vers Samsung TV

### Phase 19 — Graphes temporels observabilité ✅ (actuelle)
- Visualisation graphique de l'historique des snapshots avec Recharts
- Endpoint timeline `/api/observability/snapshots/timeline` avec filtres (limit/status/source/from/to)
- 7 scores normalisés (0–1) : statut, mémoire, notifications, sécurité, intégrations, scheduler, runtime
- Export JSON et CSV non sensibles (`/api/observability/snapshots/export.json` et `export.csv`)
- 7 composants frontend : AreaChart statut, RadarChart scores, LineCharts tendances, tableau compact, filtres
- Aucun token, IP, chemin absolu ou ID complet exposé

**Endpoints timeline & export :**
```bash
curl http://localhost:3000/api/observability/snapshots/timeline
curl http://localhost:3000/api/observability/snapshots/timeline?limit=20&status=ok
curl http://localhost:3000/api/observability/snapshots/export.json
curl http://localhost:3000/api/observability/snapshots/export.csv
```

**Tests :**
```bash
npm run test:backend -- --testPathPattern=observability-timeline
npm run test:frontend -- ObservabilityCharts
```

> ⚠️ Sécurité : la timeline et les exports n'exposent que des scores et buckets. Aucune valeur sensible.

### Phase 18B — Historique snapshots observabilité ✅
- Snapshots compacts de l'état système (buckets non sensibles)
- 7 endpoints `/api/observability/snapshots/*`
- Action scheduler `observability.snapshot` (quotidien 21:00, désactivé par défaut)
- Notifications locales si warning/error (déduplication Phase 12)
- Frontend : SnapshotHistory, SnapshotStats, SnapshotTrends
- Aucun secret, log brut, IP ou chemin absolu stocké

**Commandes de test :**
```bash
curl http://localhost:3000/api/observability/snapshots/safety
curl -X POST http://localhost:3000/api/observability/snapshots
curl http://localhost:3000/api/observability/snapshots
curl http://localhost:3000/api/observability/snapshots/latest
curl http://localhost:3000/api/observability/snapshots/stats
curl http://localhost:3000/api/observability/snapshots/trends
curl -X DELETE http://localhost:3000/api/observability/snapshots
```

> ⚠️ Sécurité : les snapshots ne contiennent que des résumés (buckets). Aucune valeur sensible n'est stockée dans `runtime/observability-snapshots.json`.

### Phase 12 — Notifications locales ✅ (actuelle)
- Centre de notifications local (100% local, jamais cloud)
- 9 types d'événements, 5 niveaux (info/success/warning/error/security)
- Masquage automatique : tokens, IMEI, IP, chemins, MAC, UUID
- Déduplication anti-spam (30s), nettoyage auto (30 jours)
- Notifications navigateur opt-in (jamais automatiques)
- Poll 15s + badge compteur non lu dans la nav

### Phase 11 — Streaming assisté DLNA ✅
- Médiathèque locale (scan dossier unique, chemins masqués)
- File de lecture ordonnée (50 éléments max)
- Renderers DLNA allowlistés uniquement
- Prévisualisation + confirmation obligatoire avant lecture
- Mode assisté : instructions à l'utilisateur, aucune commande SOAP automatique
- Audit complet : `runtime/media-streaming-audit.json`

### Phase 10 — Commandes TV SmartThings ✅
- Commandes TV opt-in : switch.on/off, mediaPlayback.*
- 6 gardes de sécurité + blocage volume/keypad/source par défaut
- TV allowlistée uniquement, confirmation + audit obligatoires
- 7 nouveaux endpoints `/api/smartthings/tv/*`
- Panneau "Commandes TV contrôlées" dans l'interface

### Phase 9 — Exécution contrôlée SmartThings ✅
- Exécution opt-in de scènes via allowlist + confirmation + audit
- 5 gardes de sécurité avant toute exécution réelle
- Blocage absolu commandes directes et appareils sensibles
- Audit local immuable (`runtime/smartthings-scene-audit.json`)
- 5 nouveaux endpoints Phase 9 (policy, executable, execute, audit, clear)

### Phase 8 — SmartThings Samsung TV ✅
- Intégration SmartThings en lecture seule (GET uniquement)
- Module smartThingsSafety : masquage token/IDs, assertion read-only, blocage écriture
- 8 endpoints `/api/smartthings/*`
- Prévisualisation de scènes sans exécution
- Panneau SmartThings dans l'interface

### Phase 7 — DLNA découverte ✅
- Découverte SSDP/UPnP via dgram natif (sans dépendance npm)
- Module dlnaSafety : validation réseau local, masquage IP, filtrage SOAP
- 8 endpoints `/api/dlna/*`
- Panneau découverte dans l'interface

### Phase 6 — ADB lecture seule ✅
- Connecteur ADB avec allowlist stricte (6 commandes autorisées)
- Module adbSafety : validation, masquage IDs, nettoyage sorties
- 5 endpoints `/api/adb/*`
- Diagnostic smartphone dans l'interface

### Phase 5 — Automatisation ✅
- Orchestrateur de 6 scénarios intelligents (cinéma, travail, famille…)
- Modes simulated / assisted / live (bloqué par défaut)
- Connecteurs ADB, DLNA, SmartThings en lecture seule
- Historique local des exécutions

### Phase 6 — Hub IA
- Agents IA spécialisés (LLM local ou API)
- Résumés automatiques de contenus
- Assistant vocal intelligent
- Recommandations personnalisées

---

## Structure des fichiers

```
/Sallon-ConnecT
  ├── sallon-connect-hub.html   # Prototype autonome Phase 1
  ├── README.md                 # Documentation du projet
  └── .gitignore                # Fichiers exclus du dépôt
```

---

## Avertissement sécurité

> **Ce projet ne doit jamais contenir de données personnelles réelles.**

- Aucun numéro de téléphone, IMEI, numéro de série réel ne doit apparaître dans le code
- Aucun mot de passe Wi-Fi, clé API réelle, ou adresse IP sensible ne doit être committé
- Les identifiants d'appareils utilisés sont logiques et fictifs
- Si des clés API sont nécessaires à l'avenir, utiliser un fichier `.env` non versionné
  (voir `.env.example` pour le modèle)
- Ajouter `.env` au `.gitignore` avant tout commit

---

*Sallon-ConnecT — Hub personnel · Phase 19 · 2026*
