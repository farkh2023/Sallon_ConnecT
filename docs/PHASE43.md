# Phase 43 — Plugins locaux, architecture extensible

## Objectif

Permettre d'etendre Sallon-ConnecT avec des plugins locaux approuves manuellement, sans aucun acces reseau, sans installation automatique depuis Internet, et avec isolation complete des erreurs.

## Architecture

```
plugins/
  <mon-plugin>/
    plugin.json     # manifeste obligatoire
    index.js        # point d'entree (non execute automatiquement par l'API)

server/src/services/plugins/
  pluginSafety.js   # validation manifeste, sanitize ID, flags securite
  pluginRegistry.js # decouverte, lecture etat, enable/disable

server/src/routes/plugins.js
  GET  /api/plugins/safety
  GET  /api/plugins/list
  POST /api/plugins/:id/enable
  POST /api/plugins/:id/disable

runtime/plugins-state.json   # etat enable/disable (non commite)

frontend/src/
  hooks/usePlugins.ts
  components/plugins/
    PluginSafetyNotice.tsx
    PluginCard.tsx
    PluginsPanel.tsx
  app/plugins/page.tsx        # route /plugins
```

## Manifeste plugin.json

```json
{
  "id": "mon-plugin",
  "name": "Mon Plugin",
  "version": "1.0.0",
  "description": "Description courte.",
  "author": "local",
  "entrypoint": "index.js",
  "permissions": [],
  "localOnly": true,
  "minAppVersion": "0.4.0"
}
```

Champs requis : `id`, `name`, `version`, `localOnly: true`, `permissions` (tableau).

## Permissions autorisees

| Permission           | Description                          |
|----------------------|--------------------------------------|
| `read:diagnostics`   | Lecture des donnees de diagnostic    |
| `read:backups`       | Lecture de la liste des sauvegardes  |
| `read:notifications` | Lecture des notifications            |
| `read:scheduler`     | Lecture du planificateur             |

Toute autre permission est rejetee a la validation du manifeste.

## Validation de l'ID

Regex : `/^[A-Za-z0-9_\-.]{1,64}$/`

Rejetes : `..`, `/`, `\`, `!`, `@`, espace, et tout caractere hors allowlist.

## Securite

- `localOnly: true` obligatoire dans le manifeste.
- Aucun plugin reseau ou cloud par defaut.
- Aucune installation automatique depuis Internet.
- Chaque plugin est isole : une erreur de lecture/parse n'affecte pas les autres.
- L'etat enable/disable est stocke dans `runtime/plugins-state.json` (hors Git).
- Les IDs sont valides avant tout acces au registre (validation route).

## Flags de securite (`GET /api/plugins/safety`)

```json
{
  "localOnly": true,
  "noNetworkByDefault": true,
  "noAutoInstall": true,
  "noCloudSync": true,
  "permissionsAllowlist": ["read:diagnostics", "read:backups", "read:notifications", "read:scheduler"],
  "errorIsolation": true,
  "manualApprovalRequired": true
}
```

## Tests

```
pnpm test:backend    → 21 nouveaux tests dans plugins.test.js
pnpm test            → suite frontend inchangee
pnpm build           → /plugins route generee en statique
```

## Contraintes preservees

- ZIP portable non impacte (`plugins/example-plugin/` inclus, aucun secret).
- Service/tray/update/backups non modifies.
- Local-only preserve.
- Aucun cloud, aucun reseau externe.
- Isolation erreurs obligatoire.
