# Versionnage — Sallon-ConnecT

## Format : SemVer

Sallon-ConnecT suit [Semantic Versioning](https://semver.org/) : `MAJEUR.MINEUR.CORRECTIF`

```
MAJEUR  — rupture de compatibilité (ex. refonte complète de l'API)
MINEUR  — nouvelle fonctionnalité, compatible avec les versions précédentes
CORRECTIF — correction de bug, pas de nouvelle fonctionnalité
```

---

## Version actuelle : v0.1.0

| Composant | Signification |
|---|---|
| `0` | Prototype non encore stabilisé pour usage général |
| `1` | Première version fonctionnelle complète (Phases 1–22) |
| `0` | Aucun correctif appliqué |

La version `0.x.y` signifie que l'API peut encore évoluer. La stabilisation en `1.0.0` interviendra quand l'API backend sera figée et testée sur durée.

---

## Fichiers de version

| Fichier | Rôle |
|---|---|
| `VERSION` | Source de vérité — contient uniquement `0.1.0` |
| `package.json` | Doit correspondre à `VERSION` |
| `CHANGELOG.md` | Entrée `[0.1.0]` à chaque release |
| Tags Git | `v0.1.0` (préfixe `v` obligatoire) |

---

## Convention de tags Git

```powershell
# Créer un tag annoté
git tag -a v0.1.0 -m "Release v0.1.0 — Prototype local complet"

# Pousser le tag
git push origin v0.1.0

# Lister les tags
git tag --list
```

---

## Procédure de release

1. Mettre à jour `VERSION` : `0.2.0`
2. Mettre à jour `package.json` : `"version": "0.2.0"`
3. Ajouter une entrée dans `CHANGELOG.md` : `## [0.2.0] — 2026-XX-XX`
4. Commiter : `git commit -m "chore(release): prepare v0.2.0"`
5. Créer le tag : `git tag -a v0.2.0 -m "Release v0.2.0"`
6. Pousser : `git push origin main && git push origin v0.2.0`
7. Créer une Release GitHub depuis le tag

---

## Historique des versions

| Version | Date | Description |
|---|---|---|
| 0.1.0 | 2026-05-17 | Prototype local complet — Phases 1–22 |

---

## Prochaines versions prévues

| Version | Contenu probable |
|---|---|
| 0.2.0 | Documentation utilisateur finale (Phase 23) |
| 0.3.0 | Assistant vocal local (Phase 24) |
| 0.4.0 | Profils avancés / permissions fines (Phase 25) |
| 1.0.0 | Installateur Windows + API stable (Phase 26+) |
