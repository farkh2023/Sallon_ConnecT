# Contributing — Sallon-ConnecT

Merci de votre intérêt pour le projet. Ce guide explique comment contribuer proprement.

---

## Prérequis

- Node.js 22.13 ou superieur
- npm 10.x ou supérieur
- PowerShell 5.1+ (Windows)
- Git

---

## Installation locale

```powershell
# 1. Cloner le dépôt
git clone https://github.com/farkh2023/Sallon-ConnecT.git
cd Sallon-ConnecT

# 2. Copier et configurer l'environnement
copy .env.example .env
# Éditer .env avec vos valeurs (ne jamais commiter .env)

# 3. Installer les dépendances backend
npm install

# 4. Installer les dépendances frontend
cd frontend && npm install && cd ..

# 5. Lancer
npm run dev
```

---

## Tests

Avant chaque contribution, lancer la suite complète :

```powershell
npm run check
```

Ce qui inclut :
- `npm run lint` — ESLint frontend
- `npm run test:backend` — 94 tests Jest
- `npm run test:frontend` — 46 tests Vitest
- `npm run test:packaging` — test ZIP portable
- `npm run test:windows` — validation syntaxe PowerShell
- `npm run build:frontend` — build Next.js

**`npm run check` doit être 100% vert avant toute PR.**

---

## Conventions de commits

Format : `type(scope): description courte`

| Type | Usage |
|---|---|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement fonctionnel |
| `test` | Ajout ou modification de tests |
| `docs` | Documentation uniquement |
| `chore` | Maintenance, dépendances, CI |
| `security` | Correctif de sécurité |

Exemples :
```
feat(backup): add SHA256 manifest verification
fix(profiles): correct lazy path resolution for test isolation
docs(readme): add badges and quick start section
```

---

## Règles de sécurité — OBLIGATOIRES

### Ce qui ne doit JAMAIS être commité

- `.env` réel (tokens, mots de passe)
- `frontend/.env.local`
- `runtime/*.json` (état runtime local)
- `backups/*.zip`
- `logs/*.log`, `logs/*.txt`, `logs/*.json`
- `node_modules/`, `frontend/node_modules/`
- `.next/`, `frontend/.next/`
- `*.pem`, `*.key`, `*.p12`, `*.crt`
- IMEI, numéro de téléphone, adresse IP complète, numéro de série
- Token SmartThings ou autre token authentication

### Avant de soumettre une PR

```powershell
# Vérification automatique
powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1
```

---

## Structure du projet

```
Sallon-ConnecT/
├── server.js                    # Backend Express (port 3000)
├── server/src/
│   ├── routes/                  # Routes API
│   └── services/                # Logique métier
├── frontend/                    # Next.js (port 3001)
│   └── src/
│       ├── components/          # Composants React
│       ├── hooks/               # Hooks personnalisés
│       └── lib/                 # Types, utilitaires
├── data/                        # JSON de données locales
├── runtime/                     # État runtime (non versionné)
├── backups/                     # Sauvegardes ZIP (non versionnées)
├── docs/                        # Documentation technique
├── tests/                       # Tests backend + helpers
├── scripts/                     # Scripts PowerShell utilitaires
└── .github/workflows/           # CI GitHub Actions
```

---

## Process de contribution

1. Fork le dépôt
2. Créer une branche : `git checkout -b feat/ma-fonctionnalite`
3. Développer + tester (`npm run check`)
4. Commiter proprement
5. Lancer le preflight : `powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1`
6. Ouvrir une Pull Request avec description claire

---

## Questions

Ouvrir une issue GitHub. Ne jamais inclure de token, IP ou donnée personnelle dans une issue.
