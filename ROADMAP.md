# Roadmap — Sallon-ConnecT

## Statut actuel

Version stable locale : `v0.4.0`

Phases 1-33 et 35-41 terminees. Le hub fonctionne localement, est teste, documente, packagable en ZIP portable, dispose d'un installateur Windows autonome (Inno Setup), d'un service Windows avec demarrage automatique, d'un tray zone de notification, d'un systeme complet de sauvegarde/restauration utilisateur et d'un tableau de bord visuel des sauvegardes. Architecture local-first securisee preservee.

---

## Phases realisees

| Phase | Description | Statut |
|---|---|---|
| 1–4 | Infrastructure backend/frontend, donnees JSON | Fait |
| 5 | Scenarios intelligents | Fait |
| 6 | ADB lecture seule | Fait |
| 7 | DLNA decouverte passive | Fait |
| 8–10 | SmartThings Samsung TV et scenes opt-in | Fait |
| 11 | Streaming assiste | Fait |
| 12–13 | Notifications locales et scheduler | Fait |
| 14–15 | PWA et mode TV | Fait |
| 16–17B | Packaging Windows, tests automatises, CI | Fait |
| 18–19 | Observabilite, snapshots, graphes | Fait |
| 20–21B | Profils locaux et backup/restauration | Fait |
| 22–25 | Publication GitHub, docs utilisateur, assistant vocal, installateur | Fait |
| 26 | Stabilisation aide/statut systeme | Fait |
| 27–29 | Evenements systeme et persistance locale | Fait |
| 30 | SSE local securise | Fait |
| 31 | Centre de notifications intelligent | Fait |
| 32 | Diagnostic avance | Fait |
| 33 | Release locale stable et packaging final | Fait |
| 35 | Installateur Windows autonome (Inno Setup 6) | Fait |
| 36 | Service Windows + demarrage automatique (NSSM / Task Scheduler) | Fait |
| 37 | Interface tray Windows (zone de notification, PowerShell + WinForms) | Fait |
| 38 | Assistant premier lancement (wizard interactif, diagnostic environnement, rapport) | Fait |
| 39 | Auto-update local securise (check/download/apply/rollback, SHA256, backup, tray) | Fait |
| 40 | Sauvegarde/restauration complete (snapshots horodates, SHA256, tray, diagnostics) | Fait |
| 41 | Tableau de bord visuel des sauvegardes (interface React, 7 endpoints, securite ID) | Fait |

---

## Futures phases possibles

### Phase 34 — WebSocket optionnel
- Ajouter un canal WebSocket local uniquement pour les cas bidirectionnels.
- Conserver SSE comme flux lecture seule par defaut.
- Garder validation d'origine, masquage et limites de clients.

### Phase 38 — Mobile companion
- Interface mobile companion sur le LAN.
- QR code local pour ouvrir le dashboard.
- Notifications navigateur opt-in et sans service push externe.

### Phase 39 — IA locale
- Assistant local connecte aux diagnostics, aux guides et aux scenarios.
- Execution limitee aux actions allowlist.
- Aucun appel LLM cloud par defaut.

### Phase 40 — Orchestrateur agents
- Agents locaux specialises : diagnostic, media, maintenance, documentation.
- Planification controlee par permissions et audit.
- Mode simulation avant toute action sensible.

### Phase 41 — Monitoring avance
- Historique long terme dans un stockage local plus robuste.
- Alertes locales configurables.
- Correlation entre SSE, notifications, diagnostics et snapshots.

### Phase 42 — Plugins
- Systeme de plugins locaux signes ou approuves manuellement.
- API plugin limitee et sandboxee.
- Marketplace personnelle locale, sans installation automatique distante.

---

## Principes non-negociables

- Local-first par defaut.
- Pas de secret dans Git, docs, logs ou exports.
- Pas de cloud obligatoire.
- Pas d'action sensible sans confirmation, allowlist et audit.
- Packaging portable reproductible.

*Mis a jour : 2026-05-22*
