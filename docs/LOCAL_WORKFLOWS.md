# Guide utilisateur — Workflows IA locaux

## Qu'est-ce qu'un workflow ?

Un workflow IA est une séquence automatisée de tâches enchaînées : diagnostics, questions RAG, appels agents, notifications, etc. Chaque workflow est un graphe acyclique orienté (DAG) exécuté localement, sans cloud.

**Règles fondamentales :**
- Tout workflow est `localOnly: true` et `dryRun: true` — aucune action destructive réelle
- Aucune exécution automatique sans déclenchement manuel explicite
- Chaque run est tracé avec résultats complets et actions rejetées

## Démarrage rapide

### 1. Activer les workflows

Dans votre `.env` :
```env
SALLON_WORKFLOWS_ENABLED=true
```

### 2. Lancer un workflow

Depuis le dashboard → onglet **Workflows IA** → cliquez **▶ Run** sur un workflow actif.

Ou via API :
```bash
curl -X POST http://localhost:3000/api/ai/workflows/diagnostic-review/run
```

### 3. Utiliser un template

Onglet **Templates** → cliquez **Utiliser ce template** — le template est copié dans vos workflows.

## Templates disponibles

| ID | Nom | Nœuds | Description |
|---|---|---|---|
| `diagnostic-review` | Revue diagnostique | 2 | Analyse système complète via diagnostic + agent |
| `security-check` | Vérification sécurité | 3 | Audit plugins, permissions, logs |
| `backup-health-check` | Santé sauvegardes | 2 | Vérifie snapshots et intégrité |
| `update-readiness-check` | Prêt mise à jour | 3 | Évalue disponibilité d'une mise à jour |
| `plugin-audit` | Audit plugins | 2 | Liste et analyse les plugins actifs |
| `documentation-qa` | QA documentation | 2 | Questions RAG sur la documentation |

## Créer un workflow (JSON)

Onglet **Creer** — collez votre JSON, les champs `localOnly` et `dryRun` sont forcés à `true`.

Structure minimale :
```json
{
  "id": "mon-workflow",
  "name": "Mon workflow",
  "description": "Description courte",
  "nodes": [
    { "id": "n1", "type": "diagnostic", "label": "Lecture diagnostics" },
    { "id": "n2", "type": "notification", "label": "Notifier" }
  ],
  "edges": [
    { "from": "n1", "to": "n2" }
  ],
  "triggers": [{ "type": "manual" }],
  "localOnly": true,
  "dryRun": true
}
```

## Types de nœuds

| Type | Action |
|---|---|
| `agent` | Appelle un agent IA local |
| `rag-search` | Recherche documentaire locale |
| `rag-ask` | Question en langage naturel au RAG |
| `diagnostic` | Lecture des métriques système |
| `notification` | Crée une notification locale |
| `condition` | Branchement logique (évaluation dry-run) |
| `delay` | Pause (max 10 secondes) |
| `safe-command-suggestion` | Suggère une commande (jamais exécutée) |
| `plugin-tool` | Appel outil d'un plugin local |

## Import / Export

**Exporter :** Dans la liste workflows → bouton **Export** → télécharge un fichier `.json`

**Importer :** Onglet **Import/Export** → collez le JSON → **Importer**  
Les champs `localOnly` et `dryRun` sont validés et forcés avant import.

## Supprimer un workflow

Dans la liste → **Suppr.** → confirmez avec **Oui** (deux étapes pour éviter les suppressions accidentelles).

## Sécurité

- Aucun workflow ne peut exécuter de commandes shell, restaurer, supprimer ou accéder à des secrets
- Tous les nœuds sont validés contre une allowlist
- Les cycles dans le graphe sont détectés et rejetés
- Chaque run produit un `safetySummary` avec `localOnly`, `dryRun`, `rejectedTotal`

## Dépannage

**Le bouton Run est grisé** → Le workflow est inactif (`enabled: false`) ou `SALLON_WORKFLOWS_ENABLED` est `false`.

**Erreur "localOnly requis"** → Votre JSON doit contenir `"localOnly": true`.

**Erreur "cycle détecté"** → Vos `edges` forment une boucle — vérifiez la structure du graphe.

**Le run échoue sur un nœud** → Consultez `nodeResults` dans le détail du run pour identifier le nœud en erreur.
