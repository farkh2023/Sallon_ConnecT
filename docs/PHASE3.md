# Phase 3 — Détection réseau réelle

## Objectif

Remplacer les statuts simulés (Phase 1 & 2) par des statuts réseau réels :
chaque appareil est pingué via son hostname ou son IP locale,
et le frontend affiche l'état en direct avec rafraîchissement automatique.

## Ce qui a changé par rapport à la Phase 2

| Aspect               | Phase 2                        | Phase 3                                     |
|----------------------|--------------------------------|---------------------------------------------|
| Backend              | Aucun (fichiers statiques)     | `server.js` Express sur port 3000           |
| Source des appareils | `data/devices.json` statique   | `/api/devices` avec ping réseau réel        |
| Statuts              | Hardcodés dans le JSON         | Détectés dynamiquement (ping + DNS)         |
| Rafraîchissement     | Aucun                          | Auto toutes les 15 s si backend actif       |
| Scan manuel          | Aucun                          | Bouton « Scanner le réseau » dans l'UI      |
| Indicateur de source | Aucun                          | Badge « En direct » / « Simulé » dans la nav |
| Configuration        | Aucune                         | `.env` (hostnames, non commité)             |

## Architecture Phase 3

```
navigateur
    │
    │  http://localhost:3000
    ▼
server.js (Express)
    ├── GET /              → index.html
    ├── GET /assets/*      → CSS / JS
    ├── GET /data/*        → JSON statiques (agents, services, scenarios)
    ├── GET /api/health    → { status: 'ok', phase: 3 }
    ├── GET /api/devices   → devices.json + ping réseau réel
    └── GET /api/scan      → idem (déclenchement manuel)
```

## Comportement avec backend (`node server.js`)

1. `app.js` tente `fetch('/api/devices')` avec timeout 3 s
2. Succès → `DATA_SOURCE = 'live'` → badge **⬤ En direct** (vert)
3. Appareils configurés dans `.env` → pingués → statut réel
4. Appareils sans config `.env` → statut « Non configuré »
5. Rafraîchissement automatique toutes les 15 s
6. Bouton « Scanner le réseau » disponible dans la section Appareils

## Comportement sans backend (serveur Python ou double-clic)

1. `app.js` tente `fetch('/api/devices')` → timeout ou erreur réseau
2. Fallback automatique → `fetch('data/devices.json')`
3. `DATA_SOURCE = 'simulated'` → badge **◎ Simulé** (ambre)
4. Pas de rafraîchissement, pas de bouton scan
5. Toutes les fonctionnalités Phase 2 restent opérationnelles

## Installation et démarrage

```powershell
# 1. Installer les dépendances
cd C:\Users\Youss\Sallon_ConnecT
npm install

# 2. Configurer les appareils (optionnel)
copy .env.example .env
# Éditer .env avec les hostnames de vos appareils

# 3. Démarrer le serveur
npm start
# ou en mode watch (Node.js ≥ 18)
npm run dev
```

Puis ouvrir : http://localhost:3000

## Endpoints API

| Méthode | Route           | Description                              |
|---------|-----------------|------------------------------------------|
| GET     | `/api/health`   | Santé du serveur                         |
| GET     | `/api/devices`  | Appareils avec statut réseau en temps réel |
| GET     | `/api/scan`     | Scan manuel (même réponse que /api/devices) |

### Exemple de réponse `/api/devices`

```json
{
  "source": "live",
  "timestamp": "2026-05-16T10:30:00.000Z",
  "count": 5,
  "devices": [
    {
      "id": "Box_SFR_Fibre",
      "name": "Box SFR Fibre",
      "icon": "📡",
      "status": "connected",
      "statusLabel": "Connecté",
      "liveStatus": "online",
      "liveStatusLabel": "En ligne"
    }
  ]
}
```

## Configuration réseau (.env)

La clé `.env` d'un appareil suit la convention :
```
DEVICE_<ID_EN_MAJUSCULES>_HOST=<hostname.local ou IP locale>
```

| Appareil              | Clé .env                              |
|-----------------------|---------------------------------------|
| PC Portable Huawei    | `DEVICE_IA_ORDINATEUR_BOM_WXX9_HOST`  |
| Samsung TV 7 Series   | `DEVICE_TV_SAMSUNG_7_SERIES_HOST`     |
| PC de Bureau          | `DEVICE_PC_BUREAU_HOST`               |
| Galaxy S23 Ultra      | `DEVICE_GALAXY_S23_ULTRA_HOST`        |
| Box SFR Fibre         | `DEVICE_BOX_SFR_FIBRE_HOST`           |

## Ajouter un nouvel appareil

1. Ajouter l'objet dans `data/devices.json`
2. Ajouter la clé correspondante dans `.env`
3. Aucune modification de code requise

## Sécurité

- `.env` est dans `.gitignore` → jamais commité
- Aucun IMEI, numéro de série ou mot de passe n'est stocké
- Les IPs locales (192.168.x.x) ne transitent pas vers le frontend
- Le serveur écoute uniquement sur `localhost`

## Prochaine étape — Phase 4

Intégrer les services multimédias réels :
- Galerie photos depuis Galaxy S23 Ultra (ADB ou API Google Photos)
- Streaming DLNA vers Samsung TV
- Lecture YouTube via Chromecast ou Samsung TV API
