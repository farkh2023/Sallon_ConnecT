# Changelog

Toutes les modifications notables de ce projet sont documentées ici.
Format : [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) — versionnement [SemVer](https://semver.org/).

---

## [0.1.0] — 2026-05-17 — Premier prototype local complet

### Ajouté

**Infrastructure (Phases 1–4)**
- Serveur Express backend sur port 3000
- Ancien frontend HTML statique conservé
- Frontend Next.js 16 sur port 3001 (`frontend/`)
- API appareils, scan réseau, services multimédias
- Données JSON locales (`data/`)

**Intégrations locales (Phases 5–11)**
- Orchestrateur de scénarios intelligents (cinéma, travail, famille…)
- Diagnostic ADB en lecture seule (pas d'écriture sur l'appareil)
- Découverte DLNA/UPnP passive (pas de streaming forcé)
- SmartThings Samsung TV — opt-in sécurisé, clé Bearer masquée
- Scènes SmartThings — confirmation explicite obligatoire
- Commandes TV — whitelist d'actions, opt-in
- Streaming assisté — indexation locale uniquement

**Qualité et observabilité (Phases 12–19)**
- Notifications locales avec moteur de règles
- Scheduler de tâches planifiées — actions safelist uniquement
- Dashboard observabilité en temps réel (snapshots, tendances)
- Graphes temporels Recharts (AreaChart, RadarChart, LineChart)
- Export JSON/CSV non sensible des snapshots
- Packaging Windows portable (ZIP autonome)
- Suite de tests automatisés : backend (94 tests), frontend (46 tests), packaging, PowerShell
- CI GitHub Actions (Windows latest, Node 22.x)
- Système de snapshots d'observabilité avec buckets non-sensibles

**Profils et sécurité (Phase 20)**
- 5 profils par défaut : owner, family, guest, tv, diagnostic
- Permissions locales par profil (17 actions contrôlées)
- Basculement rapide dans la TopNav
- Audit trail local des changements de profil
- Mode lecture seule et masquage des panneaux sensibles

**Sauvegarde locale (Phases 21–21B)**
- Création de ZIP locaux avec manifest SHA256
- Dry-run obligatoire avant toute restauration
- Rollback automatique créé avant restauration
- Code de confirmation explicite requis
- Exclusion automatique : .env, node_modules, .git, clés, logs bruts
- Isolation des tests runtime (tests/.runtime/)
- Résolution de chemins lazy dans profileStore/profileEngine

**Publication GitHub (Phase 22)**
- Scripts release : preflight-github.ps1, prepare-release.ps1
- Documentation complète : README, CHANGELOG, ROADMAP, SECURITY, CONTRIBUTING
- Architecture, modèle de sécurité, guide setup local, checklist release
- VERSION 0.1.0, versionnement SemVer
- .gitignore complet vérifié
- Badges CI dans README

### Sécurité

- Aucun secret commité (tokens, clés, .env, IP complètes, IMEI)
- Chemins absolus masqués dans toutes les réponses API
- Audit runtime non versionné (`runtime/*.json`)
- node_modules et .next exclus du dépôt
- SmartThings opt-in : désactivé par défaut

---

[0.1.0]: https://github.com/farkh2023/Sallon-ConnecT/releases/tag/v0.1.0
