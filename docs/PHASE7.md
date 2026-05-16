# Phase 7 — Découverte DLNA/UPnP en lecture seule

## Objectif

Implémenter la découverte DLNA/UPnP locale pour détecter les appareils multimédias du réseau :
Smart TV Samsung, serveurs médias, renderers, players.

**Aucun envoi de média. Aucun contrôle TV. Aucune action SOAP.**

---

## Explication DLNA / UPnP / SSDP

- **UPnP** (Universal Plug and Play) : protocole de découverte et de contrôle d'appareils réseau
- **DLNA** (Digital Living Network Alliance) : profil UPnP pour le partage multimédia
- **SSDP** (Simple Service Discovery Protocol) : protocole de découverte via multicast UDP

### Fonctionnement de la découverte

```
Client (serveur Node.js)
    │
    ├── M-SEARCH * HTTP/1.1 → 239.255.255.250:1900 (UDP multicast)
    │     ST: urn:schemas-upnp-org:device:MediaRenderer:1
    │
    ←── HTTP/1.1 200 OK ← Samsung TV (unicast)
          LOCATION: http://192.168.*.*:52235/description.xml
          USN: uuid:...::urn:...MediaRenderer:1
```

---

## Architecture

```
server.js
  └── /api/dlna/*         ← routes/dlna.js
        ├── GET  /status            ← dlnaConnector.getStatus()
        ├── POST /discover          ← dlnaConnector.discoverDevices()
        ├── GET  /devices           ← dlnaConnector.getLastDiscovery()
        ├── GET  /renderers         ← dlnaConnector.discoverRenderers()
        ├── GET  /servers           ← dlnaConnector.discoverMediaServers()
        ├── GET  /players           ← dlnaConnector.discoverPlayers()
        ├── GET  /safety            ← rapport sécurité
        └── DELETE /cache           ← dlnaConnector.clearDiscoveryCache()

server/src/services/media/
  ├── dlnaSafety.js    ← validation, masquage IP, nettoyage SSDP/XML
  └── dlnaConnector.js ← découverte SSDP via dgram natif Node.js
```

---

## Variables d'environnement Phase 7

| Variable | Défaut | Rôle |
|---|---|---|
| `DLNA_ENABLED` | `false` | Activer la découverte DLNA |
| `DLNA_DISCOVERY_TIMEOUT_MS` | `3000` | Timeout de découverte (ms) |
| `DLNA_MULTICAST_ADDRESS` | `239.255.255.250` | Adresse multicast SSDP |
| `DLNA_MULTICAST_PORT` | `1900` | Port multicast SSDP |
| `DLNA_READ_ONLY` | `true` | Mode lecture seule — ne jamais désactiver |
| `DLNA_MAX_RESPONSES` | `30` | Nombre max de réponses |
| `DLNA_FETCH_DESCRIPTIONS` | `false` | Récupérer les descriptions XML (optionnel) |
| `DLNA_MASK_LOCAL_IPS` | `true` | Masquer les IP locales dans les réponses |

---

## Endpoints ajoutés (Phase 7)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/dlna/status` | État DLNA + cache actuel |
| POST | `/api/dlna/discover` | Lance la découverte complète |
| GET | `/api/dlna/devices` | Derniers appareils (cache) |
| GET | `/api/dlna/renderers` | MediaRenderers uniquement |
| GET | `/api/dlna/servers` | MediaServers uniquement |
| GET | `/api/dlna/players` | MediaPlayers uniquement |
| GET | `/api/dlna/safety` | Rapport sécurité complet |
| DELETE | `/api/dlna/cache` | Vide le cache de découverte |

---

## Lecture seule — garanties

1. **Aucune action SOAP** : pas de `Play`, `Pause`, `Stop`, `SetVolume`, etc.
2. **Aucun POST vers les appareils** (seulement M-SEARCH UDP + GET XML si activé)
3. **Réseau local uniquement** : toutes les réponses non-locales sont ignorées par `dlnaSafety.isLocalAddress()`
4. **IP masquées** : `192.168.1.42` → `192.168.*.*` si `DLNA_MASK_LOCAL_IPS=true`
5. **Timeout court** : max 15 secondes configurables
6. **Déduplication par USN** : chaque appareil n'est compté qu'une fois
7. **Max réponses** : limité par `DLNA_MAX_RESPONSES` (défaut 30)

---

## Actions SOAP bloquées

`Play`, `Pause`, `Stop`, `Seek`, `Next`, `Previous`, `SetVolume`, `SetMute`,
`SetAVTransportURI`, `SetNextAVTransportURI`, `Rewind`, `FastForward`,
`Power`, `PowerOn`, `PowerOff`

---

## Sécurité réseau

- `dlnaSafety.isLocalAddress()` : accepte uniquement RFC-1918 (10.x, 172.16-31.x, 192.168.x, 127.x, ::1, 169.254.x)
- `dlnaSafety.sanitizeSsdpResponse()` : extrait seulement LOCATION, ST, USN, SERVER, CACHE-CONTROL
- `dlnaSafety.sanitizeDeviceDescription()` : parse uniquement friendlyName, manufacturer, modelName, deviceType, serviceList
- `dlnaSafety.buildSafeDlnaError()` : masque les IP et ports dans les messages d'erreur

---

## Option description XML (DLNA_FETCH_DESCRIPTIONS=true)

Si activé, le connecteur récupère les descriptions XML des appareils trouvés :
- URL locale uniquement (re-vérifiée par `isLocalAddress`)
- Timeout 2 secondes
- Taille limitée à 8 Ko
- Champs extraits : `friendlyName`, `manufacturer`, `modelName`, `deviceType`, `serviceList`
- Les XML bruts ne sont jamais stockés

---

## Comportements par état

| État | Cause | Comportement frontend |
|---|---|---|
| `disabled` | `DLNA_ENABLED=false` | Bouton découverte inactif, instructions d'activation |
| `no_cache` | DLNA actif, pas encore découvert | Invite à cliquer "Découvrir" |
| `no_device` | Découverte effectuée, rien trouvé | Message informatif |
| `available` | Appareils trouvés | Grille de cartes par type |

---

## Mise à jour des scénarios

### Mode Cinéma
- Étape DLNA : cherche un renderer ou TV locale
- Suggère "renderer détecté — disponible pour lecture future"
- Aucune lecture lancée

### Mode Présentation
- Vérifie si un renderer compatible est visible
- Suggère "renderer prêt pour affichage futur"
- Aucune présentation lancée

### Mode Diagnostic réseau
- Résumé DLNA complet : nombre d'appareils, renderers, serveurs, players, date dernière découverte
- Combne ADB (Android) + DLNA (réseau) pour un diagnostic complet

---

## Limites actuelles

- Pas encore de streaming vers la TV (Phase 8)
- `DLNA_FETCH_DESCRIPTIONS=false` par défaut (performances et sécurité)
- Un seul réseau (pas de découverte multi-interface)
- Pas de persistance du cache (perdu au redémarrage du serveur)

---

## Comment tester

```powershell
# 1. Dans .env : DLNA_ENABLED=true
# 2. Redémarrer le serveur : npm start
# 3. Tester les endpoints :

curl http://localhost:3000/api/dlna/status
curl -X POST http://localhost:3000/api/dlna/discover
curl http://localhost:3000/api/dlna/devices
curl http://localhost:3000/api/dlna/renderers
curl http://localhost:3000/api/dlna/servers
curl http://localhost:3000/api/dlna/players
curl http://localhost:3000/api/dlna/safety
curl -X DELETE http://localhost:3000/api/dlna/cache
```

---

## Prochaine étape — Phase 8

- Contrôle SmartThings Samsung TV (commandes réelles opt-in)
- Streaming DLNA vers TV (send URI uniquement, avec confirmation utilisateur)
- Notifications push locales
- Planification temporelle des scénarios
