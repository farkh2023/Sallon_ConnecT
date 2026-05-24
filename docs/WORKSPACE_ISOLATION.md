# Isolation workspace

## Principe

Chaque requete IA peut fournir un workspace via `X-Workspace-Id`, `workspaceId` en query ou `workspaceId` dans le body. L'ID est valide strictement avant tout acces disque. Sans ID explicite, le backend utilise le workspace courant.

## Donnees isolees

```text
runtime/workspaces/<id>/
  rag/
    index.json
    chunks.json
    metadata.json
  knowledge/
    items.json
    metadata.json
  agents/
    memory.json
    runs/
  workflows/
    definitions.json
    runs/
    exports/
```

Le workspace `default` peut lire les chemins legacy `runtime/rag`, `runtime/knowledge`, `runtime/agents` et `runtime/workflows` si `SALLON_WORKSPACE_LEGACY_FALLBACK=true`.

## Migration legacy

`workspaceMigration.js` detecte les dossiers legacy et prepare `runtime/workspaces/default`. Par defaut :

- aucune suppression ;
- aucun deplacement ;
- aucun ecrasement ;
- fallback legacy actif.

`SALLON_WORKSPACE_MIGRATION_AUTO=false` garde la migration automatique destructive desactivee. Une copie non destructive des fichiers manquants est disponible cote backend, mais elle n'est pas activee par defaut.

## Export/import

L'export workspace `2.0` produit un JSON local dans `runtime/workspaces/exports/` avec checksum SHA-256. Les donnees restaurees par import sont limitees a des fichiers JSON connus et a des noms de fichiers valides.

Les secrets sont masques par cle et par contenu : `token`, `password`, `secret`, `apiKey`, `authorization`, chemins Windows et chemins Unix sensibles.

## Anti-fuite

Les tests creent des workspaces A/B avec donnees differentes et verifient que :

- la recherche RAG A ne retourne pas B ;
- la recherche KB A ne retourne pas B ;
- les agents A ne lisent pas les runs B ;
- les workflows A ne lisent pas les definitions/runs B ;
- l'export A ne contient pas B.

## Depannage

- `id_invalide` : workspaceId ne respecte pas `[a-zA-Z0-9_-]` ou contient un motif interdit.
- `workspace_introuvable` : workspaceId valide mais absent des profils.
- `checksum_import_invalide` : export modifie apres generation.
- `filename_import_invalide` : import contient un fichier non JSON ou un nom dangereux.
