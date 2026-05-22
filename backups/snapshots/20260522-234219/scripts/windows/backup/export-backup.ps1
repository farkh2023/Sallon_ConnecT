#Requires -Version 5.1
<#
.SYNOPSIS
    Exporte un snapshot Sallon-ConnecT en archive ZIP portable.
.PARAMETER SnapshotId
    ID du snapshot à exporter. Si absent, exporte le plus récent.
.PARAMETER OutputPath
    Chemin de destination du ZIP (défaut : backups\exports\).
.PARAMETER Password
    Mot de passe optionnel via 7-Zip (si installé). Non obligatoire.
.PARAMETER RootPath
    Chemin racine du projet.
.NOTES
    Le chiffrement par mot de passe nécessite 7-Zip installé (7z.exe dans PATH ou
    C:\Program Files\7-Zip\7z.exe). Sans 7-Zip, l'option -Password est ignorée
    et un avertissement est affiché.

    LIMITATION : Compress-Archive (PS natif) ne supporte pas le chiffrement.
    Le ZIP sans mot de passe reste local uniquement — aucun upload effectué.
#>
param(
    [string]$SnapshotId  = '',
    [string]$OutputPath  = '',
    [string]$Password    = '',
    [string]$RootPath    = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'
$ExportsDir   = Join-Path $RootPath 'backups\exports'

Write-Host ""
Write-Host "=== Sallon-ConnecT : Export snapshot ZIP ===" -ForegroundColor Cyan

if (-not (Test-Path $SnapshotsDir)) {
    Write-Host "Aucun snapshot disponible." -ForegroundColor Red
    exit 1
}

# ── Sélection snapshot ─────────────────────────────────────────────────────────
if (-not $SnapshotId) {
    $latest = Get-ChildItem -Path $SnapshotsDir -Directory |
        Sort-Object Name -Descending | Select-Object -First 1
    if (-not $latest) {
        Write-Host "Aucun snapshot disponible." -ForegroundColor Red
        exit 1
    }
    $SnapshotId = $latest.Name
    Write-Host "Snapshot selectionne (dernier) : $SnapshotId"
}

$SnapDir = Join-Path $SnapshotsDir $SnapshotId
if (-not (Test-Path $SnapDir)) {
    Write-Host "Snapshot introuvable : $SnapDir" -ForegroundColor Red
    exit 1
}

# ── Destination ZIP ───────────────────────────────────────────────────────────
if (-not $OutputPath) {
    if (-not (Test-Path $ExportsDir)) {
        New-Item -ItemType Directory -Path $ExportsDir -Force | Out-Null
    }
    $OutputPath = Join-Path $ExportsDir "SallonConnecT-backup-$SnapshotId.zip"
}

# ── Vérification intégrité avant export ───────────────────────────────────────
$verifyScript = Join-Path $PSScriptRoot 'verify-backup.ps1'
if (Test-Path $verifyScript) {
    Write-Host "Verification integrite..." -ForegroundColor Yellow
    $psArgs = @('-NoProfile','-ExecutionPolicy','Bypass','-File',$verifyScript,
                '-SnapshotId',$SnapshotId,'-RootPath',$RootPath)
    & powershell.exe @psArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Le snapshot presente des anomalies. Export quand meme en cours."
    }
}

# ── Chiffrement via 7-Zip (optionnel) ─────────────────────────────────────────
$sevenZipPath = $null
if ($Password) {
    $candidates = @(
        'C:\Program Files\7-Zip\7z.exe',
        'C:\Program Files (x86)\7-Zip\7z.exe'
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { $sevenZipPath = $c; break }
    }
    if (-not $sevenZipPath) {
        try {
            $found = & where.exe 7z 2>$null
            if ($found) { $sevenZipPath = $found }
        } catch {}
    }
    if (-not $sevenZipPath) {
        Write-Warning "7-Zip introuvable. Le mot de passe sera ignore."
        Write-Warning "Installez 7-Zip (https://www.7-zip.org) pour activer le chiffrement."
        Write-Warning "LIMITE : Compress-Archive (PowerShell natif) ne supporte pas le chiffrement."
        $Password = ''
    }
}

# ── Création archive ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Creation archive : $OutputPath" -ForegroundColor Yellow

try {
    if ($Password -and $sevenZipPath) {
        # 7-Zip avec chiffrement AES-256
        $zipArgs = @('a', '-tzip', "-p$Password", '-mhe=on', $OutputPath, "$SnapDir\*")
        & $sevenZipPath @zipArgs | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERREUR] 7-Zip a echoue." -ForegroundColor Red
            exit 1
        }
        Write-Host "Chiffrement AES-256 applique (7-Zip)." -ForegroundColor Green
    } else {
        Compress-Archive -Path "$SnapDir\*" -DestinationPath $OutputPath -Force
    }
} catch {
    Write-Host "[ERREUR] Creation ZIP echouee : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ── SHA256 du ZIP ──────────────────────────────────────────────────────────────
$zipHash = (Get-FileHash -Path $OutputPath -Algorithm SHA256).Hash.ToLower()
$zipSize = (Get-Item $OutputPath).Length
$checksumFile = "$OutputPath.sha256.txt"
"$zipHash  $(Split-Path $OutputPath -Leaf)" | Set-Content -Path $checksumFile -Encoding UTF8

Write-Host ""
Write-Host "[OK] Export termine." -ForegroundColor Green
Write-Host "ZIP    : $OutputPath"
Write-Host "Taille : $([Math]::Round($zipSize/1KB, 1)) KB"
Write-Host "SHA256 : $zipHash"
Write-Host "Checksum : $checksumFile"
if ($Password -and $sevenZipPath) {
    Write-Host "Chiffrement : oui (AES-256, 7-Zip)"
} else {
    Write-Host "Chiffrement : non (ZIP standard local uniquement)"
}
Write-Host ""
Write-Host "RAPPEL : Ce fichier reste local. Ne jamais uploader sur un service cloud." -ForegroundColor Yellow
Write-Host ""

exit 0
