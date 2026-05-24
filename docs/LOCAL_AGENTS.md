# Agents IA locaux orchestres — Guide

## Qu'est-ce qu'un agent ?

Un agent IA local est un module specialise qui :
- Recoit une tache en langage naturel
- Collecte des donnees via des outils autorises (lecture seule)
- Synthhetise un rapport avec recommandations
- Ne realise aucune action destructive
- Ne contacte aucun service externe

## Demarrage rapide

1. Activer les agents dans `.env` :
   ```
   SALLON_AGENTS_ENABLED=true
   SALLON_AI_ENABLED=true
   ```
2. Demarrer Ollama : `ollama serve`
3. Lancer le backend : `npm run dev`
4. Acceder au panneau Agents IA dans le dashboard

## Agents disponibles

### diagnostic-agent
Analyse l'etat global du systeme : score diagnostics, cartes sante, backend, SSE, scheduler, backup, notifications, stockage, securite.

**Outils** : diagnostics.read, rag.search, notifications.create

### security-agent
Analyse les risques securite : chemins sensibles, permissions plugins, exposition reseau, secrets.

**Outils** : diagnostics.read, plugins.list, rag.search

### backup-agent
Verifie l'etat des sauvegardes : dernier snapshot, validite SHA256, disponibilite rollback.

**Outils** : backups.status, updates.status, service.status, rag.search

### docs-agent
Repond aux questions sur la documentation locale avec citations obligatoires (RAG).

**Outils** : rag.search, rag.ask

**Note** : necessaire que le RAG soit indexe (`POST /api/ai/rag/index`)

### command-agent
Suggere des commandes PowerShell sures. Jamais executees automatiquement.

**Outils** : commands.suggestSafe, rag.search

## Orchestration

L'orchestrateur execute les agents sequentiellement :
1. Decoupe la tache
2. Execute chaque agent dans l'ordre
3. Passe le contexte (output) de l'agent precedent au suivant
4. Collecte toutes les recommandations
5. Produit une synthese finale par IA
6. Retourne le rapport complet

## Dry-run

Toutes les executions sont en mode **dry-run** par defaut.

Cela signifie :
- Les donnees sont collectees (lecture seule)
- Les recommendations sont produites
- Aucune modification n'est appliquee
- Aucune commande n'est executee
- La validation humaine est obligatoire pour toute action reelle

## Securite

| Regle | Description |
|---|---|
| localOnly | Aucune donnee envoyee vers l'exterieur |
| dryRun | Aucune action automatique |
| secretMasking | Tokens, passwords, chemins masques |
| toolAllowlist | 9 outils autorises seulement |
| toolBlocklist | 6 outils destructeurs interdits |
| contextLimit | 8000 chars max par agent |
| timeout | 45s par agent (configurable) |
| maxSteps | 6 agents max par run |

## Exemples de taches

```
"Analyser l'etat du systeme et identifier les problemes"
"Verifier la securite des plugins installes"
"Quel est le statut des sauvegardes recentes ?"
"Comment configurer le service Windows ?" (docs-agent)
"Quelle commande pour redemarrer le backend ?" (command-agent)
```

## Depannage

| Probleme | Solution |
|---|---|
| agents_disabled | Mettre SALLON_AGENTS_ENABLED=true dans .env |
| ai_disabled | Mettre SALLON_AI_ENABLED=true dans .env |
| Ollama indisponible | Lancer `ollama serve` |
| RAG non indexe | Cliquer "Indexer documentation" dans le panneau RAG |
| Timeout agent | Augmenter SALLON_AGENTS_TIMEOUT_MS (defaut 45000) |
