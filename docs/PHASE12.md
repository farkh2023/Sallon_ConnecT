# Phase 12 — Centre de notifications locales

## Objectif

Centraliser tous les événements importants du système Sallon-ConnecT dans un centre de notifications local sécurisé :
- Notifications 100% locales (pas de cloud, pas de Firebase, pas d'email/SMS)
- Données sensibles masquées automatiquement avant stockage
- Notifications navigateur uniquement sur permission explicite de l'utilisateur
- Déduplication anti-spam (30 secondes par défaut)
- Filtrage par type et niveau
- Audit activé par défaut

## Architecture

```
notificationSafety.js   ← masquage données sensibles
       ↓
notificationStore.js    ← persistance runtime/notifications.json
       ↓
notificationEngine.js   ← API publique (notify, notifyInfo, etc.)
       ↓
notifications.js        ← routes /api/notifications
       ↓
app.js                  ← frontend (poll 15s, browser notif)
```

## Sécurité des données

### Données masquées automatiquement

| Type | Pattern | Remplacement |
|---|---|---|
| Tokens Bearer | `Bearer xxx` | `[token-masqué]` |
| IMEI | 15 chiffres consécutifs | `[imei-masqué]` |
| Téléphone | Formats FR | `[tel-masqué]` |
| Numéro de série | `SN:XXXXXX` | `[série-masqué]` |
| Adresse MAC | `AA:BB:CC:DD:EE:FF` | `[mac-masqué]` |
| IP locale | `192.168.x.x`, `10.x.x.x` | `[ip-masquée]` |
| Chemin absolu Windows | `C:\...` | `[chemin-masqué]` |
| Chemin absolu Unix | `/home/...`, `/etc/...` | `[chemin-masqué]` |
| UUID SmartThings | `xxxxxxxx-xxxx-...` | `xxxx***` |
| Clé longue (32+ chars) | alphanumérique 32+ | `[clé-masquée]` |

### Champs bloqués dans les meta

`token`, `password`, `secret`, `key`, `imei`, `serial`, `phone`, `mac`

## Modèle de notification

```json
{
  "id": "notif-lp3abc-xyz1",
  "type": "system",
  "level": "success",
  "title": "Serveur démarré",
  "message": "Sallon-ConnecT Phase 12 — port 3000",
  "createdAt": "2026-05-16T10:00:00.000Z",
  "read": false,
  "source": "Sallon-ConnecT",
  "meta": { "phase": 12, "port": 3000 },
  "sensitiveDataMasked": true
}
```

## Types de notifications

| Type | Description |
|---|---|
| `system` | Démarrage, scan appareils |
| `device` | Statut appareils réseau |
| `media` | Galerie, YouTube |
| `scenario` | Scénarios (démarrage, fin, erreur) |
| `smartthings` | Scènes, commandes TV |
| `dlna` | Découverte DLNA |
| `adb` | Statut Android |
| `streaming` | Preview, lecture, refus |
| `security` | Violations de sécurité |

## Niveaux de notifications

| Niveau | Usage |
|---|---|
| `info` | Information neutre |
| `success` | Opération réussie |
| `warning` | Avertissement non bloquant |
| `error` | Erreur récupérable |
| `security` | Violation ou incident de sécurité |

## Notifications navigateur

- **Désactivées par défaut** (`NOTIFICATIONS_BROWSER_ENABLED=false`)
- **Jamais demandées automatiquement** au chargement de la page
- Activées uniquement sur **clic explicite** → bouton "Activer notifications navigateur"
- Affichent uniquement titre + message sanitizés (max 100/200 chars)
- Fallback silencieux si API non supportée

## Endpoints API

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/api/notifications` | Liste (filtres: type, level, unreadOnly, limit) |
| `GET` | `/api/notifications/stats` | Statistiques (total, unread, byType, byLevel) |
| `GET` | `/api/notifications/safety` | Politique de sécurité |
| `POST` | `/api/notifications` | Créer une notification |
| `PATCH` | `/api/notifications/:id/read` | Marquer comme lu |
| `PATCH` | `/api/notifications/read-all` | Tout marquer comme lu |
| `DELETE` | `/api/notifications/:id` | Supprimer une notification |
| `DELETE` | `/api/notifications` | Vider toutes les notifications |

## Variables d'environnement

| Variable | Défaut | Description |
|---|---|---|
| `NOTIFICATIONS_ENABLED` | `true` | Active le module |
| `NOTIFICATIONS_BROWSER_ENABLED` | `false` | Notifications navigateur (opt-in) |
| `NOTIFICATIONS_AUDIT_ENABLED` | `true` | Audit activé |
| `NOTIFICATIONS_STORE_PATH` | `runtime/notifications.json` | Fichier de stockage |
| `NOTIFICATIONS_MAX_ITEMS` | `200` | Limite d'éléments |
| `NOTIFICATIONS_MASK_SENSITIVE_DATA` | `true` | Masquage automatique |
| `NOTIFICATIONS_DEFAULT_LEVEL` | `info` | Niveau par défaut |
| `NOTIFICATIONS_DEDUP_WINDOW_MS` | `30000` | Fenêtre déduplication (ms) |
| `NOTIFICATIONS_AUTO_CLEANUP_DAYS` | `30` | Nettoyage automatique (jours) |

## Événements intégrés

| Déclencheur | Type | Niveau |
|---|---|---|
| Démarrage serveur | `system` | `success` |
| Scan appareils | `device` | `info` / `warning` |
| Scénario démarré | `scenario` | `info` |
| Scénario terminé | `scenario` | `success` |
| Scénario live refusé | `scenario` | `warning` |
| Scène SmartThings preview | `smartthings` | `info` |
| Scène SmartThings exécutée | `smartthings` | `success` |
| Scène SmartThings refusée | `smartthings` | `warning` |
| Commande TV exécutée | `smartthings` | `success` |
| Commande TV refusée | `smartthings` | `warning` |
| Streaming preview | `streaming` | `info` |
| Streaming accepté | `streaming` | `success` |
| Streaming refusé | `streaming` | `warning` |

## Commandes de test

```powershell
# Lister les notifications
curl http://localhost:3000/api/notifications

# Statistiques
curl http://localhost:3000/api/notifications/stats

# Politique de sécurité
curl http://localhost:3000/api/notifications/safety

# Créer une notification de test
curl -X POST http://localhost:3000/api/notifications `
  -H "Content-Type: application/json" `
  -d '{"type":"system","level":"info","title":"Test","message":"Notification locale"}'

# Marquer tout comme lu
curl -X PATCH http://localhost:3000/api/notifications/read-all

# Vider
curl -X DELETE http://localhost:3000/api/notifications
```

## Limites actuelles

- Pas de WebSocket (poll 15s côté frontend — suffisant pour un hub local)
- Pas de groupement de notifications
- Pas de priorité d'affichage (ordre chronologique inverse)
- Stockage JSON (pas de base de données — conforme à l'approche locale simple)
- Max 200 notifications (les plus anciennes sont supprimées automatiquement)
- Déduplication uniquement en mémoire (redémarrage serveur = cache vidé)

## Prochaines étapes possibles

- Phase 13 : Interface de configuration locale (changer les variables .env depuis l'UI)
- Phase 14 : Dashboard temps réel (WebSocket léger)
- Phase 15 : Export local des logs et historiques
