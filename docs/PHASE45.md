# Phase 45 — IA locale integree (Ollama, modeles locaux)

Date : 2026-05-23
Statut : **Fait**

## Objectif

Integrer un assistant IA completement local via Ollama. Aucun cloud, aucune cle API, aucune
telemesure externe. Toutes les operations restent sur `127.0.0.1`.

## Backend

### Module `server/src/ai/`

| Fichier | Role |
|---|---|
| `aiSafety.js` | Validation URL locale, blocage commandes dangereuses, masquage secrets |
| `ollamaClient.js` | Client HTTP vers Ollama (localhost uniquement) |
| `localAiClient.js` | Facade : statut, activation, appels chat |
| `aiPromptTemplates.js` | Templates systeme (diagnostics, logs, commandes, chat) |
| `aiDiagnosticsAssistant.js` | Analyse snapshot diagnostics par l'IA |
| `aiLogAnalyzer.js` | Resume logs par l'IA |

### Route `/api/ai` (6 endpoints)

| Methode | Chemin | Description |
|---|---|---|
| GET | `/api/ai/status` | Statut Ollama, modele actif, flags securite |
| GET | `/api/ai/models` | Liste des modeles disponibles |
| POST | `/api/ai/chat` | Chat libre avec l'assistant |
| POST | `/api/ai/diagnose` | Analyse diagnostics systeme |
| POST | `/api/ai/analyze-logs` | Analyse logs passes en texte |
| POST | `/api/ai/suggest-command` | Suggestion commande PowerShell (dry-run) |

### Variables d'environnement

```
SALLON_AI_ENABLED=false         # IA desactivee par defaut
SALLON_AI_PROVIDER=ollama
SALLON_OLLAMA_URL=http://127.0.0.1:11434
SALLON_OLLAMA_MODEL=qwen2.5:7b
SALLON_AI_TIMEOUT_MS=30000
SALLON_AI_MAX_INPUT_CHARS=12000
```

### Permissions plugin etendues

Trois nouvelles permissions plugin : `ai-read`, `ai-chat`, `ai-diagnostics`.

## Frontend

### Composants `src/components/ai/`

| Composant | Role |
|---|---|
| `AiStatusBadge.tsx` | Badge visuel : loading / desactive / indisponible / actif |
| `AiChatBox.tsx` | Boite de chat avec historique scrollable (role="log") |
| `AiDiagnosticsActions.tsx` | Bouton analyse, suggestion dry-run, bouton Copier seul |
| `AiAssistantPanel.tsx` | Panneau principal regroupant tous les composants IA |

### Widgets dashboard `src/widgets/examples/`

| Widget | ID | Taille par defaut |
|---|---|---|
| `LocalAiStatusWidget` | `local-ai-status` | small |
| `AiDiagnosticsWidget` | `ai-diagnostics` | medium |
| `AiLogSummaryWidget` | `ai-log-summary` | medium |

Tous les widgets IA ont `localOnly: true`.

### Hook `useAiAssistant`

Gere : statut, messages (historique), loading, error.
Methodes : `loadStatus`, `sendMessage`, `analyzeDiagnostics`, `suggestCommand`, `clearMessages`.

### Route `/ai`

Page dediee : `src/app/ai/page.tsx` — accessible via le lien "IA locale" dans TopNav.

## Securite

- URL Ollama validee par regex (localhost / 127.0.0.1 uniquement)
- Commandes dangereuses bloquees : `rm -rf`, `Remove-Item -Recurse -Force`, `del /s`,
  `Stop-Computer`, `reg delete`, `format`, `shutdown`, `curl/wget/iwr` externe
- Masquage secrets avant envoi a l'IA et dans les reponses : Bearer, password=, token=,
  api_key=, secret=, chemins `C:\Users\`
- Troncature input a 12 000 caracteres
- Aucune execution automatique — suggestions dry-run uniquement
- Bouton "Copier" seul, aucun bouton "Executer"
- IA desactivee par defaut (`SALLON_AI_ENABLED=false`)

## Tests

### Backend (`tests/backend/ai.test.js`)

40+ tests couvrant :
- Endpoints desactives (ok:false, reason:ai_disabled)
- Validations 400 (champs manquants, types incorrects)
- `aiSafety` : URL locale, commandes safe/dangereuses, masquage secrets, troncature
- Flags securite (7 flags tous vrais)

### Frontend

- `src/__tests__/components/AiAssistantPanel.test.tsx` : 14 tests (etats, badges, accessibilite)
- `src/__tests__/widgets/aiWidgets.test.tsx` : 17 tests (3 widgets, registre)

## Validations

| Etape | Resultat |
|---|---|
| `pnpm lint` | 0 erreur, 0 warning |
| `pnpm test` | 316 tests passes |
| `pnpm build` | Build statique propre |
| `npm run test:backend` | 288 tests passes |
| `pnpm test:windows` | 45 scripts PS1 valides |
| `pnpm release:build` | ZIP 0.85 MB, SHA256 verifie |
