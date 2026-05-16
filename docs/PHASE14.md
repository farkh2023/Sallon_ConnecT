# Phase 14 — Migration Frontend React / Next.js

## Objectif

Migrer progressivement le frontend vanilla HTML/CSS/JS vers **React + Next.js** sans toucher au backend Express.  
L'ancien `index.html` est conservé intact — les deux frontends coexistent.

## Pourquoi React / Next.js

- Composants réutilisables et typés (TypeScript)
- Gestion d'état centralisée via hooks personnalisés
- Rendering performant avec React 19
- Tailwind CSS 4 pour le design
- App Router pour une navigation claire
- Préparation pour des évolutions futures (SSR, internationalisation, etc.)

---

## Ports utilisés

| Service         | Port | URL                     |
|-----------------|------|-------------------------|
| Backend Express | 3000 | http://localhost:3000   |
| Frontend Next.js| 3001 | http://localhost:3001   |

---

## Architecture frontend

```
frontend/
├── .env.example              # NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
├── .env.local                # (copie de .env.example pour dev)
├── next.config.ts            # Rewrites proxy optionnel
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout — fond navy, Geist font
│   │   ├── page.tsx          # Entry — rend AppShell
│   │   └── globals.css       # @theme custom colors, dark background
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx        # Shell principal — nav + toutes sections
│   │   │   ├── TopNav.tsx          # Nav sticky + badge notifications
│   │   │   └── SectionHeader.tsx   # Titre de section
│   │   ├── dashboard/
│   │   │   ├── HeroPanel.tsx       # Santé système + métriques clés
│   │   │   ├── StatusBadge.tsx     # Badge de statut générique
│   │   │   └── MetricCard.tsx      # Carte métrique unique
│   │   ├── devices/
│   │   │   ├── DevicesPanel.tsx    # Liste appareils avec statut live
│   │   │   └── DeviceCard.tsx      # Carte appareil individuelle
│   │   ├── agents/
│   │   │   ├── AgentsPanel.tsx     # Les 6 agents du hub
│   │   │   └── AgentCard.tsx       # Carte agent individuelle
│   │   ├── media/
│   │   │   ├── MediaPanel.tsx      # Services médias
│   │   │   ├── AdbPanel.tsx        # ADB diagnostic lecture seule
│   │   │   ├── DlnaPanel.tsx       # DLNA découverte
│   │   │   ├── SmartThingsPanel.tsx# SmartThings statut
│   │   │   └── StreamingPanel.tsx  # Politique streaming
│   │   ├── scenarios/
│   │   │   ├── ScenariosPanel.tsx  # Liste scénarios
│   │   │   └── ScenarioCard.tsx    # Carte scénario
│   │   ├── notifications/
│   │   │   └── NotificationsPanel.tsx # Notifications avec polling 15s
│   │   ├── scheduler/
│   │   │   └── SchedulerPanel.tsx  # Tâches planifiées + historique
│   │   └── ui/
│   │       ├── Button.tsx          # Bouton typé variants
│   │       ├── Card.tsx            # Carte conteneur
│   │       ├── Badge.tsx           # Badge coloré
│   │       ├── EmptyState.tsx      # État vide
│   │       └── SafetyNotice.tsx    # Bloc avertissement sécurité
│   ├── lib/
│   │   ├── api.ts        # apiGet/Post/Patch/Delete + buildApiUrl
│   │   ├── types.ts      # Types TypeScript pour toutes les entités
│   │   ├── format.ts     # Formatage dates, durées, schedules
│   │   └── safety.ts     # Masquage données sensibles
│   └── hooks/
│       ├── useApi.ts           # Chargement API générique (loading/error/data)
│       ├── usePolling.ts       # Polling contrôlé avec cleanup
│       └── useNotifications.ts # Notifications + stats + markRead + polling
```

---

## Variables d'environnement frontend

| Variable                    | Valeur défaut          | Description                 |
|-----------------------------|------------------------|-----------------------------|
| `NEXT_PUBLIC_API_BASE_URL`  | `http://localhost:3000`| URL de base du backend Express |

---

## Endpoints consommés

| Panel            | Endpoints                                               |
|------------------|---------------------------------------------------------|
| HeroPanel        | `GET /api/health`, `GET /api/devices`                   |
| DevicesPanel     | `GET /api/devices`                                      |
| MediaPanel       | `GET /api/media/services`                               |
| AdbPanel         | `GET /api/adb/status`, `GET /api/adb/diagnostics`       |
| DlnaPanel        | `GET /api/dlna/status`, `GET /api/dlna/devices`         |
| SmartThingsPanel | `GET /api/smartthings/status`                           |
| StreamingPanel   | `GET /api/streaming/policy`                             |
| ScenariosPanel   | `GET /api/scenarios/runtime`                            |
| NotificationsPanel | `GET /api/notifications`, `GET /api/notifications/stats`, `PATCH /api/notifications/:id/read` |
| SchedulerPanel   | `GET /api/scheduler/status`, `GET /api/scheduler/schedules`, `GET /api/scheduler/history`, `POST /api/scheduler/schedules/:id/run` |

---

## Sécurité

- Aucun token, IP complète, ID complet ou chemin absolu exposé dans l'interface
- `lib/safety.ts` fournit `sanitizeRecord()` et `maskSensitiveValue()`
- Actions sensibles (streaming play, scène SmartThings, commande TV) :
  - Boutons désactivés si la policy API refuse
  - Confirmation requise avant toute exécution manuelle
  - SafetyNotice visible dans chaque panel concerné
  - Aucun déclenchement automatique dans le frontend
- CORS backend restreint aux origines `http://localhost:3000` et `http://localhost:3001`
- `NEXT_PUBLIC_API_BASE_URL` ne contient jamais de token

---

## CORS backend (Phase 14)

Ajouté dans `server.js` avant les routes statiques :

```js
const CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
```

---

## Commandes de test

```powershell
# Backend seul (port 3000)
npm start

# Frontend seul (port 3001)
cd frontend
npm run dev -- --port 3001

# Les deux en parallèle (depuis la racine)
npm run dev

# Vérifier le backend
curl http://localhost:3000/api/health

# Vérifier le frontend Next.js
# Ouvrir http://localhost:3001

# Vérifier que CORS fonctionne (appel cross-origin)
curl -H "Origin: http://localhost:3001" http://localhost:3000/api/health -v
```

---

## Limites actuelles (Phase 14)

- La page Next.js est une Single Page avec anchor links (pas de routing multi-pages)
- Les actions d'écriture complexes (créer scénario, exécuter scène SmartThings) sont affichées en lecture seule
- Pas de Server Side Rendering côté panneaux (tous client components)
- Pas de pagination sur les listes (chargement complet)

---

## Ancien frontend conservé

`index.html` + `assets/` restent intacts et accessibles sur `http://localhost:3000`.  
Les deux frontends consomment le même backend Express. Aucune collision.

---

## Prochaines étapes recommandées

- Phase 15 : Actions avancées (créer scénario depuis React, exécuter scène avec confirmation modale)
- Multi-pages Next.js (une route par section)
- Internationalisation (i18n) si nécessaire
- Tests unitaires des hooks et composants
