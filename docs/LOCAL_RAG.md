# RAG local — Guide d'utilisation

Le RAG (Retrieval-Augmented Generation) de Sallon-ConnecT permet a l'IA locale de repondre
a partir de la documentation interne du projet, avec citations. Tout reste sur votre machine.

## Prerequis

- Sallon-ConnecT v0.4.0+ avec Phase 45 (IA locale Ollama) active
- Ollama installe et operationnel (`ollama serve`)
- Optionnel : modele d'embeddings pour le mode vectoriel

## Installation du modele d'embeddings (optionnel)

Sans ce modele, le systeme fonctionne en mode **lexical** (moins precis mais toujours utile).

```powershell
ollama pull nomic-embed-text
```

Verifier :

```powershell
ollama list
# nomic-embed-text doit apparaitre
```

## Configuration

Ajouter dans `.env` :

```
SALLON_RAG_ENABLED=false
SALLON_RAG_EMBEDDING_MODEL=nomic-embed-text
SALLON_RAG_CHUNK_SIZE=1200
SALLON_RAG_CHUNK_OVERLAP=150
SALLON_RAG_MAX_FILE_SIZE_MB=2
SALLON_RAG_TOP_K=5
```

`SALLON_RAG_ENABLED` n'active pas encore le RAG automatiquement — l'indexation reste
manuelle (bouton "Indexer documentation" ou `POST /api/ai/rag/index`).

## Indexer la documentation

### Depuis l'interface

1. Ouvrir `/ai` (lien "IA locale" dans la navigation)
2. Cliquer "Afficher" dans la section "Documentation locale (RAG)"
3. Cliquer "Indexer documentation"
4. L'indexation prend quelques secondes (+ longue si embeddings actifs)

### Via l'API

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/api/ai/rag/index
```

### Via le widget dashboard

Le widget "RAG statut" (`rag-status`) affiche l'etat de l'index.

## Utilisation

### Question avec citation

Dans le panneau RAG > onglet "Question" :

```
Posez une question sur Sallon-ConnecT...
→ Comment configurer les profils utilisateurs ?
```

La reponse cite les sources : `[Source 1: docs/PHASE20.md > Profils]`.

### Recherche documentaire

Dans le panneau RAG > onglet "Recherche" :

```
→ widgets dashboard
```

Retourne les chunks les plus pertinents avec leurs scores.

### API directe

```powershell
# Recherche
Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body '{"query":"widgets dashboard"}' `
  http://localhost:3000/api/ai/rag/search

# Question
Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body '{"question":"Comment activer le mode TV ?"}' `
  http://localhost:3000/api/ai/rag/ask
```

## Sources indexables

Le RAG indexe uniquement les sources autorisees par allowlist :

| Source | Incluse |
|---|---|
| `docs/**/*.md` | Oui |
| `README.md` | Oui |
| `CHANGELOG.md` | Oui |
| `ROADMAP.md` | Oui |
| `.env`, `.env.local` | Non |
| `node_modules/` | Non |
| `runtime/`, `backups/`, `logs/` | Non |
| Fichiers binaires | Non |

## Securite

- **URL Ollama** : localhost uniquement (127.0.0.1)
- **Secrets** : masques avant envoi (Bearer, password=, token=, C:\Users\)
- **Citations** : sans chemins absolus ni informations sensibles
- **Path traversal** : bloque (rejette `..`, chemins absolus)
- **Taille fichiers** : limite a `SALLON_RAG_MAX_FILE_SIZE_MB` (defaut 2 Mo)
- **Questions** : tronquees a 2000 chars, secrets masques
- **Clear index** : necessite confirmation `"EFFACER_INDEX"` explicite
- **Aucun cloud** : l'index et toutes les operations restent sur votre machine

## Modes de retrieval

### Mode embedding (vectoriel) — recommande

Necessite `nomic-embed-text` installe. Comprend la semantique des questions :

```
Question: "Comment redemarrer le service ?"
→ Trouve: docs sur restart-service.ps1, Windows Service, premier lancement
```

### Mode lexical (fallback)

Utilise si Ollama ou le modele d'embeddings est indisponible. Cherche les tokens
exacts de la question dans les chunks. Moins precis mais toujours fonctionnel.

Un badge orange "Fallback lexical" est visible dans l'interface quand ce mode est actif.

## Supprimer l'index

### Depuis l'interface

Cliquer "Supprimer index" → puis confirmer en cliquant "Confirmer suppression ?"

### Via l'API

```powershell
Invoke-RestMethod -Method Post -ContentType "application/json" `
  -Body '{"confirmation":"EFFACER_INDEX"}' `
  http://localhost:3000/api/ai/rag/clear
```

## Depannage

### "Non indexe" — aucun chunk disponible

Cliquer "Indexer documentation" dans le panneau RAG.

### Mode lexical au lieu de vectoriel

```powershell
# Verifier le modele d'embeddings
ollama list | Select-String nomic-embed-text

# Si absent :
ollama pull nomic-embed-text
```

Puis reindexer.

### Reponses hors sujet

Le modele repond avec ses connaissances generales si le contexte ne contient pas
l'information. Verifier que la documentation pertinente est bien indexee.

### Index obsolete apres modification de docs

Reindexer manuellement apres modification de fichiers dans `docs/`.

## Variables d'environnement de reference

| Variable | Defaut | Description |
|---|---|---|
| `SALLON_RAG_EMBEDDING_MODEL` | `nomic-embed-text` | Modele Ollama embeddings |
| `SALLON_RAG_CHUNK_SIZE` | `1200` | Taille max d'un chunk (chars) |
| `SALLON_RAG_CHUNK_OVERLAP` | `150` | Chevauchement entre chunks (chars) |
| `SALLON_RAG_MAX_FILE_SIZE_MB` | `2` | Taille max fichier indexable (Mo) |
| `SALLON_RAG_TOP_K` | `5` | Nombre de chunks retrouves par recherche |
