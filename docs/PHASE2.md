# Phase 2 — Architecture modulaire

## Objectif

Transformer le prototype HTML monolithique de la Phase 1 en une structure de fichiers
modulaire et évolutive, tout en conservant une exécution locale simple sans framework.

## Ce qui a changé par rapport à la Phase 1

| Aspect          | Phase 1                          | Phase 2                              |
|-----------------|----------------------------------|--------------------------------------|
| HTML            | `sallon-connect-hub.html` (tout-en-un) | `index.html` (structure uniquement) |
| CSS             | Intégré dans `<style>`           | `assets/css/styles.css`              |
| JavaScript      | Intégré dans `<script>`          | `assets/js/app.js`                   |
| Données         | Hardcodées dans le JS            | `data/*.json` chargés via `fetch`    |
| Maintenabilité  | Modifier un seul gros fichier    | Modifier uniquement le fichier concerné |

## Structure des fichiers

```
/Sallon-ConnecT
  ├── index.html              ← Page principale (HTML uniquement)
  ├── sallon-connect-hub.html ← Archive Phase 1 (conservée)
  ├── README.md
  ├── .gitignore
  ├── data/
  │   ├── devices.json        ← 5 appareils du salon
  │   ├── agents.json         ← 6 agents IA
  │   ├── services.json       ← 8 services multimédias
  │   └── scenarios.json      ← 6 scénarios intelligents
  ├── assets/
  │   ├── css/
  │   │   └── styles.css      ← Tous les styles
  │   └── js/
  │       └── app.js          ← Toute la logique (fetch + render)
  └── docs/
      └── PHASE2.md           ← Ce document
```

## Fonctionnement du chargement des données

```javascript
// app.js — chargement parallèle des 4 sources JSON
const [devices, agents, services, scenarios] = await Promise.all([
  fetch('data/devices.json').then(r => r.json()),
  fetch('data/agents.json').then(r => r.json()),
  fetch('data/services.json').then(r => r.json()),
  fetch('data/scenarios.json').then(r => r.json()),
]);
```

Les données sont chargées une fois au démarrage (`DOMContentLoaded`), stockées dans
des variables globales, puis utilisées par toutes les fonctions de rendu.

## Ajouter un appareil

Ouvrir `data/devices.json` et ajouter un objet JSON :

```json
{
  "id": "Enceinte_Sonos_One",
  "name": "Enceinte Sonos One",
  "icon": "🔊",
  "type": "Enceinte connectée",
  "category": "audio",
  "role": "Diffusion audio sans fil dans le salon.",
  "status": "available",
  "statusLabel": "Disponible",
  "details": {
    "ID logique": "Enceinte_Sonos_One",
    "Protocole": "AirPlay 2 / Spotify Connect",
    "Connexion": "Wi-Fi",
    "Priorité": "Basse"
  }
}
```

Aucun changement de code n'est nécessaire.

## Ajouter un agent

Ouvrir `data/agents.json` et ajouter :

```json
{
  "id": "agent_audio",
  "icon": "🔊",
  "name": "Agent 7 — Audio",
  "mission": "Gérer les sources audio et synchroniser le son sur les enceintes du salon.",
  "output": "Sources audio détectées · Synchronisation Sonos OK · Profil audio configuré."
}
```

## Lancer le serveur local

```powershell
# Python (recommandé)
cd <repo>
python -m http.server 8080
# Ouvrir http://localhost:8080

# Node.js
npx serve .

# VS Code : extension Live Server → Go Live
```

## Prochaines étapes (Phase 3)

- Scan réseau réel : Node.js + `node-nmap` ou `bonjour`
- Détection mDNS / UPnP / DLNA
- API REST locale (`express`) pour exposer les données
- Statuts des appareils mis à jour en temps réel (WebSocket ou polling)

## Sécurité

- `data/*.json` ne contient aucune donnée personnelle réelle
- Pas d'IP réelle, pas d'IMEI, pas de mot de passe, pas de numéro de série
- Le fichier `.env` (non créé en Phase 2) ne doit jamais être commité
