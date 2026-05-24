# Command Center — Guide

## Vue d'ensemble

Le Command Center est l'interface unifiee de recherche et navigation de Sallon-ConnecT. Accessible via le raccourci `Ctrl+K` ou un bouton dans l'UI, il permet de :

- rechercher dans toutes les sources locales en une seule requete
- lancer des navigations rapides vers les sections de la plateforme
- previsualiser et executer des commandes sures
- consulter l'historique de recherche local

## Modele SearchResult

```json
{
  "id": "result_cmd_open.dashboard",
  "type": "command",
  "title": "Ouvrir le dashboard",
  "description": "Naviguer vers le tableau de bord principal.",
  "score": 2.1,
  "source": "command-registry",
  "target": "/dashboard",
  "tags": ["dashboard", "accueil"],
  "actions": ["open"],
  "localOnly": true
}
```

## Sources indexees

| Source | Type resultat |
|---|---|
| Command Registry | command |
| Base de connaissances | knowledge |
| Memoire persistante IA | memory |

## Recherche globale

La recherche est lexicale (tokenisation NFD, scoring exact/partiel). Les suggestions de reformulation via Ollama sont optionnelles et non bloquantes. Depuis la Phase 53, les resultats Knowledge Base et memoire sont indexes par workspace via `X-Workspace-Id` ou le workspace courant, afin d'eviter les melanges entre profils.

## Commandes interdites

Les actions suivantes sont systematiquement bloquees :

- `shell.execute` — execution shell reelle
- `restore.apply` — restauration reelle
- `update.apply` — mise a jour reelle
- `delete` — suppression
- `network.external` — appels reseau externes
- `secrets.read` — lecture de secrets

## Historique

L'historique de recherche est stocke uniquement dans `localStorage`. Depuis la Phase 52, la cle est scopee par workspace : `sallon_search_history` pour `default`, puis `sallon_search_history:<workspaceId>` pour les autres profils. Il est efface via le bouton "Effacer" dans le Command Center (confirmation requise).

## Commandes workspaces

La Phase 52 ajoute :

- `open.workspaces`
- `workspace.switch`
- `workspace.export`
- `workspace.create`

Ces commandes ouvrent le gestionnaire `/workspaces`. Aucune suppression n'est disponible via commande rapide.

## Configuration

```env
SALLON_SEARCH_ENABLED=true
SALLON_COMMAND_CENTER_ENABLED=true
SALLON_SEARCH_HISTORY_MAX=50
SALLON_SEARCH_TOP_K=10
```

## Endpoints

```
GET  /api/search/status
GET  /api/search/commands[?q=query]
POST /api/search  { query, filters?, topK?, suggest? }
POST /api/search/commands/:id/preview
POST /api/search/commands/:id/run  { query? }
```

## Depannage

| Probleme | Solution |
|---|---|
| Ctrl+K ne fonctionne pas | Verifier qu'aucun autre composant ne capture l'evenement |
| Resultats vides | Verifier que SALLON_SEARCH_ENABLED=true |
| Commande refusee | L'action est dans la blocklist — utiliser les alternatives sures |
| Historique non sauvegarde | Verifier que localStorage est accessible (mode prive ?) |
