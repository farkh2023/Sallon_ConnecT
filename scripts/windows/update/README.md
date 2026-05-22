# Sallon-ConnecT Update — Mise a jour locale securisee

Systeme de mise a jour manuelle depuis GitHub Release.

## Commandes

```powershell
# Verifier si une mise a jour est disponible
scripts\windows\update\check-update.ps1

# Telecharger la mise a jour (verifie SHA256)
scripts\windows\update\download-update.ps1

# Appliquer la mise a jour (confirmation requise)
scripts\windows\update\apply-update.ps1

# Lister les backups disponibles
scripts\windows\update\rollback-update.ps1 -List

# Rollback vers la version precedente
scripts\windows\update\rollback-update.ps1

# Statut complet (versions, backups)
scripts\windows\update\update-status.ps1
```

## Flux typique

```
check-update.ps1  →  download-update.ps1  →  apply-update.ps1
                                                      ↓
                                           rollback-update.ps1 (si besoin)
```

## Securite

- GitHub officiel uniquement (farkh2023/Sallon_ConnecT)
- SHA256 verifie avant chaque apply
- Aucun auto-update silencieux
- Donnees utilisateur preservees : logs/, runtime/, backups/, .env, data/
- Aucune telemetrie, aucun cloud hors GitHub releases
