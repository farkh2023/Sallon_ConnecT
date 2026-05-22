#Requires -Version 5.1
<#
.SYNOPSIS
    Restaure l'environnement Sallon-ConnecT depuis un snapshot.
.PARAMETER SnapshotId
    ID du snapshot à restaurer. Si absent, liste et demande.
.PARAMETER Confirm
    Confirme sans interaction.
.PARAMETER Restart
    Relance le service après restauration.
.PARAMETER RootPath
    Chemin racine du projet.
#>
param(
    [string]$SnapshotId = '',
    [switch]$Confirm,
    [switch]$Restart,
    [string]$RootPath   = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'

Write-Host ""
Write-Host "=== Sallon-ConnecT : Restauration snapshot ===" -ForegroundColor Cyan

# ── Sélection du snapshot ──────────────────────────────────────────────────────
if (-not $SnapshotId) {
    if (-not (Test-Path $SnapshotsDir)) {
        Write-Host "Aucun snapshot disponible (dossier absent)." -ForegroundColor Red
        exit 1
    }
    $dirs = Get-ChildItem -Path $SnapshotsDir -Directory | Sort-Object Name -Descending
    if ($dirs.Count -eq 0) {
        Write-Host "Aucun snapshot disponible." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    Write-Host "Snapshots disponibles :"
    $i = 1
    foreach ($d in $dirs) {
        $metaFile = Join-Path $d.FullName 'metadata.json'
        $info = "  [$i] $($d.Name)"
        if (Test-Path $metaFile) {
            try {
                $m = Get-Content $metaFile -Raw | ConvertFrom-Json
                $info += "  |  $($m.type)  v$($m.version)  $($m.fileCount) fichiers"
            } catch {}
        }
        Write-Host $info
        $i++
    }
    Write-Host ""
    $choice = Read-Host "Numero du snapshot a restaurer (1-$($dirs.Count))"
    $idx = 0
    if (-not [int]::TryParse($choice.Trim(), [ref]$idx) -or $idx -lt 1 -or $idx -gt $dirs.Count) {
        Write-Host "Choix invalide." -ForegroundColor Red
        exit 1
    }
    $SnapshotId = $dirs[$idx - 1].Name
}

$SnapDir = Join-Path $SnapshotsDir $SnapshotId
if (-not (Test-Path $SnapDir)) {
    Write-Host "Snapshot introuvable : $SnapDir" -ForegroundColor Red
    exit 1
}

# ── Vérification intégrité avant restauration ─────────────────────────────────
Write-Host ""
Write-Host "Verification integrite du snapshot..." -ForegroundColor Yellow
$verifyScript = Join-Path $PSScriptRoot 'verify-backup.ps1'
if (Test-Path $verifyScript) {
    $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$verifyScript,
                '-SnapshotId',$SnapshotId,'-RootPath',$RootPath)
    & powershell.exe @psArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Warning "Le snapshot semble corrompu ou incomplet."
        if (-not $Confirm) {
            $cont = Read-Host "Continuer malgre tout ? (oui/non)"
            if ($cont.Trim().ToLower() -ne 'oui') {
                Write-Host "Restauration annulee." -ForegroundColor Yellow
                exit 1
            }
        }
    }
}

# ── Lecture metadata ───────────────────────────────────────────────────────────
$metaFile = Join-Path $SnapDir 'metadata.json'
$snapVersion = 'inconnue'
if (Test-Path $metaFile) {
    try {
        $meta = Get-Content $metaFile -Raw | ConvertFrom-Json
        $snapVersion = if ($meta.version) { $meta.version } else { 'inconnue' }
    } catch {}
}

$currentVersion = 'inconnue'
$verFile = Join-Path $RootPath 'VERSION'
if (Test-Path $verFile) { $currentVersion = (Get-Content $verFile -Raw).Trim() }

Write-Host ""
Write-Host "Snapshot    : $SnapshotId"
Write-Host "Version snap: $snapVersion"
Write-Host "Version act.: $currentVersion"
Write-Host ""

# ── Confirmation obligatoire ───────────────────────────────────────────────────
if (-not $Confirm) {
    Write-Host "ATTENTION : Cette operation va remplacer les donnees actuelles." -ForegroundColor Red
    Write-Host "Un backup pre-restauration sera cree automatiquement."
    $conf = Read-Host "Taper 'oui' pour confirmer la restauration"
    if ($conf.Trim().ToLower() -ne 'oui') {
        Write-Host "Restauration annulee." -ForegroundColor Yellow
        exit 1
    }
}

# ── Arrêt service/tray ────────────────────────────────────────────────────────
$stopTray    = Join-Path $RootPath 'scripts\windows\tray\stop-tray.ps1'
$stopService = Join-Path $RootPath 'scripts\windows\service\stop-service.ps1'
if (Test-Path $stopTray) {
    Write-Host "Arret du tray..." -ForegroundColor Yellow
    $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$stopTray)
    & powershell.exe @psArgs 2>$null
}
if (Test-Path $stopService) {
    Write-Host "Arret du service..." -ForegroundColor Yellow
    $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$stopService)
    & powershell.exe @psArgs 2>$null
}

# ── Backup pré-restauration ────────────────────────────────────────────────────
Write-Host ""
Write-Host "Creation backup pre-restauration..." -ForegroundColor Yellow
$createScript = Join-Path $PSScriptRoot 'create-backup.ps1'
$preRestoreId = $null
if (Test-Path $createScript) {
    $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$createScript,
                '-Type','quick','-Description',"Pre-restauration depuis $SnapshotId",
                '-RootPath',$RootPath)
    & powershell.exe @psArgs
    if ($LASTEXITCODE -eq 0) {
        $preRestoreId = Get-ChildItem -Path $SnapshotsDir -Directory |
            Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty Name
        Write-Host "Backup pre-restauration : $preRestoreId" -ForegroundColor Green
    } else {
        Write-Warning "Backup pre-restauration echoue - restauration quand meme."
    }
}

# ── Restauration fichiers ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "Restauration en cours..." -ForegroundColor Yellow

$errors  = [System.Collections.Generic.List[string]]::new()
$restored = [System.Collections.Generic.List[string]]::new()

# Fichiers/dossiers à restaurer depuis le snapshot
$restoreItems = @(
    @{ Rel = 'VERSION';       IsDir = $false },
    @{ Rel = 'package.json';  IsDir = $false },
    @{ Rel = 'data';          IsDir = $true  },
    @{ Rel = 'runtime';       IsDir = $true  }
)

foreach ($item in $restoreItems) {
    $src  = Join-Path $SnapDir $item.Rel
    $dest = Join-Path $RootPath $item.Rel
    if (-not (Test-Path $src)) { continue }
    try {
        if ($item.IsDir) {
            if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force | Out-Null }
            $srcFiles = Get-ChildItem -Path $src -Recurse -File -ErrorAction SilentlyContinue
            foreach ($sf in $srcFiles) {
                $rel     = $sf.FullName.Substring($src.Length).TrimStart('\')
                $dstFile = Join-Path $dest $rel
                $dstDir  = Split-Path $dstFile -Parent
                if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Path $dstDir -Force | Out-Null }
                Copy-Item -Path $sf.FullName -Destination $dstFile -Force
                $restored.Add("$($item.Rel)\$rel")
            }
        } else {
            Copy-Item -Path $src -Destination $dest -Force
            $restored.Add($item.Rel)
        }
    } catch {
        $errors.Add("Restauration echouee : $($item.Rel) - $($_.Exception.Message)")
    }
}

# ── Vérification VERSION après restauration ────────────────────────────────────
$restoredVersion = 'inconnue'
if (Test-Path $verFile) { $restoredVersion = (Get-Content $verFile -Raw).Trim() }
$versionOk = ($restoredVersion -eq $snapVersion)

# ── Rapport restauration ───────────────────────────────────────────────────────
$reportTs   = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportFile = Join-Path $RootPath "logs\restore-report-$reportTs.txt"
$logsDir    = Join-Path $RootPath 'logs'
if (-not (Test-Path $logsDir)) { New-Item -ItemType Directory -Path $logsDir -Force | Out-Null }

$reportLines = [System.Collections.Generic.List[string]]::new()
$reportLines.Add("=== Rapport restauration Sallon-ConnecT ===")
$reportLines.Add("Date restauration   : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$reportLines.Add("Snapshot restaure   : $SnapshotId")
$reportLines.Add("Version snapshot    : $snapVersion")
$reportLines.Add("Version avant       : $currentVersion")
$reportLines.Add("Version apres       : $restoredVersion")
$reportLines.Add("VERSION coherente   : $(if ($versionOk) {'oui'} else {'non - verifier manuellement'})")
$reportLines.Add("Fichiers restaures  : $($restored.Count)")
$reportLines.Add("Erreurs             : $($errors.Count)")
if ($preRestoreId) { $reportLines.Add("Backup pre-restore  : $preRestoreId") }
$reportLines.Add("")
$reportLines.Add("--- Fichiers restaures ---")
foreach ($f in $restored) { $reportLines.Add("  $f") }
if ($errors.Count -gt 0) {
    $reportLines.Add("")
    $reportLines.Add("--- Erreurs ---")
    foreach ($e in $errors) { $reportLines.Add("  ERREUR: $e") }
}
$reportLines | Set-Content -Path $reportFile -Encoding UTF8

# ── Résumé ─────────────────────────────────────────────────────────────────────
Write-Host ""
if ($errors.Count -eq 0) {
    Write-Host "[OK] Restauration terminee." -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Restauration partielle ($($errors.Count) erreur(s))." -ForegroundColor Yellow
}
Write-Host "Snapshot    : $SnapshotId"
Write-Host "Version     : $restoredVersion"
Write-Host "Fichiers    : $($restored.Count)"
Write-Host "Rapport     : $reportFile"

if ($Restart) {
    Write-Host ""
    Write-Host "Relancement du service..." -ForegroundColor Yellow
    $startService = Join-Path $RootPath 'scripts\windows\service\start-service.ps1'
    if (Test-Path $startService) {
        $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$startService)
        & powershell.exe @psArgs
    }
}

Write-Host ""
exit $(if ($errors.Count -eq 0) { 0 } else { 1 })
