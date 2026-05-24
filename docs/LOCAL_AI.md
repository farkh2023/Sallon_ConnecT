# IA locale — Guide d'installation et d'utilisation

L'assistant IA de Sallon-ConnecT fonctionne entierement en local via **Ollama**.
Aucune donnee ne quitte votre machine. Aucune cle API. Aucun cloud.

## Prerequis

- Sallon-ConnecT v0.4.0+ installe et operationnel
- Ollama installe (voir ci-dessous)
- Un modele telecharge (qwen2.5:7b recommande, ~4 Go)

## Installer Ollama

Telecharger depuis le site officiel d'Ollama et lancer l'installateur.
Une fois installe, Ollama ecoute sur `http://127.0.0.1:11434`.

Verifier l'installation :

```powershell
ollama --version
```

## Telecharger un modele

```powershell
ollama pull qwen2.5:7b
```

Autres modeles compatibles (plus petits = plus rapides) :

```powershell
ollama pull phi3:mini       # ~2 Go, rapide
ollama pull mistral:7b      # ~4 Go, bon equilibre
ollama pull llama3.2:3b     # ~2 Go, leger
```

Lister les modeles installes :

```powershell
ollama list
```

## Activer l'IA dans Sallon-ConnecT

Editer votre fichier `.env` a la racine du projet :

```
SALLON_AI_ENABLED=true
SALLON_AI_PROVIDER=ollama
SALLON_OLLAMA_URL=http://127.0.0.1:11434
SALLON_OLLAMA_MODEL=qwen2.5:7b
SALLON_AI_TIMEOUT_MS=30000
SALLON_AI_MAX_INPUT_CHARS=12000
```

Redemarrer le backend apres modification.

## Verifier l'etat

Depuis l'interface :
- Ouvrir `/ai` (lien "IA locale" dans la navigation)
- Ou consulter le widget "IA locale" dans le dashboard

Via l'API :

```powershell
Invoke-RestMethod http://localhost:3000/api/ai/status
```

Reponse attendue quand tout est operationnel :

```json
{
  "enabled": true,
  "provider": "ollama",
  "model": "qwen2.5:7b",
  "available": true,
  "reason": null,
  "safety": { ... }
}
```

## Fonctionnalites disponibles

### Assistant chat

Poser des questions sur Sallon-ConnecT, demander des explications sur les logs,
obtenir de l'aide pour la configuration.

### Analyse des diagnostics

L'IA recoit un snapshot du systeme (memoire, statuts, services) et fournit un
resume lisible et des suggestions.

### Analyse des logs

Coller un extrait de log, l'IA identifie les anomalies et suggere des actions.

### Suggestion de commandes

Decrire une tache, l'IA propose une commande PowerShell. La suggestion est
affichee avec un bouton "Copier" uniquement — aucune execution automatique.

## Securite

### Ce qui est garanti

- **URL locale uniquement** : Ollama ne peut etre contacte qu'a `127.0.0.1` ou `localhost`.
  Toute URL externe est bloquee avant l'appel reseau.
- **Aucune execution automatique** : les commandes suggerees sont dry-run. Seul un bouton
  "Copier" est disponible.
- **Masquage des secrets** : avant envoi a l'IA et dans les reponses, les tokens Bearer,
  mots de passe, cles API et chemins personnels sont automatiquement masques.
- **Troncature** : les inputs sont limites a 12 000 caracteres.
- **Commandes dangereuses bloquees** : `rm -rf`, `Remove-Item -Recurse -Force`, `del /s`,
  `Stop-Computer`, `shutdown`, `format`, `reg delete`, et toute commande `curl/wget/iwr`
  vers une URL externe.

### Ce qui n'est pas fait

- Aucun cloud, aucune telemesure, aucune API externe
- Aucune cle API requise
- Aucune donnee stockee par l'IA (stateless)

## Depannage

### "IA desactivee"

`SALLON_AI_ENABLED` est `false` ou absent. Mettre a `true` dans `.env` et redemarrer.

### "Ollama non disponible"

Ollama n'est pas lance ou n'ecoute pas sur le port 11434.

```powershell
# Verifier si Ollama tourne
Get-Process ollama -ErrorAction SilentlyContinue

# Demarrer Ollama
ollama serve
```

### "Modele introuvable"

```powershell
ollama list
# Si vide :
ollama pull qwen2.5:7b
```

### Timeout

Augmenter `SALLON_AI_TIMEOUT_MS` dans `.env` (valeur recommandee : 60000 pour les
vieilles machines).

### Reponses lentes

Utiliser un modele plus petit :

```powershell
ollama pull phi3:mini
```

Puis mettre `SALLON_OLLAMA_MODEL=phi3:mini` dans `.env`.

## Variables d'environnement de reference

| Variable | Defaut | Description |
|---|---|---|
| `SALLON_AI_ENABLED` | `false` | Active / desactive l'IA |
| `SALLON_AI_PROVIDER` | `ollama` | Fournisseur (seul ollama supporte) |
| `SALLON_OLLAMA_URL` | `http://127.0.0.1:11434` | URL Ollama (localhost uniquement) |
| `SALLON_OLLAMA_MODEL` | `qwen2.5:7b` | Modele a utiliser |
| `SALLON_AI_TIMEOUT_MS` | `30000` | Timeout requetes IA (ms) |
| `SALLON_AI_MAX_INPUT_CHARS` | `12000` | Troncature input |
