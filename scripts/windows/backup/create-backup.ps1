#Requires -Version 5.1
<#
.SYNOPSIS
    Crée un snapshot horodaté de l'environnement Sallon-ConnecT.
.PARAMETER Type
    quick (défaut) ou full.
.PARAMETER Description
    Description courte optionnelle du snapshot.
.PARAMETER ExportZip
    Si présent, crée aussi une archive ZIP du snapshot.
.PARAMETER RootPath
    Chemin racine du projet (défaut : dossier parent du script).
#>
param(
    [ValidateSet('quick','full')]
    [string]$Type        = 'quick',
    [string]$Description = '',
    [switch]$ExportZip,
    [string]$RootPath    = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ── Chemins ────────────────────────────────────────────────────────────────────
if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'
$Timestamp    = Get-Date -Format 'yyyyMMdd-HHmmss'
$SnapDir      = Join-Path $SnapshotsDir $Timestamp
$LogsDir      = Join-Path $RootPath 'logs'

if (-not (Test-Path $SnapshotsDir)) {
    New-Item -ItemType Directory -Path $SnapshotsDir -Force | Out-Null
}
New-Item -ItemType Directory -Path $SnapDir -Force | Out-Null

$errors   = [System.Collections.Generic.List[string]]::new()
$copied   = [System.Collections.Generic.List[string]]::new()
$checksums = @{}

# ── Copie fichier individuel ────────────────────────────────────────────────────
function Copy-Item-Safe {
    param([string]$Src, [string]$RelDest)
    $dest = Join-Path $SnapDir $RelDest
    $dir  = Split-Path $dest -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    try {
        Copy-Item -Path $Src -Destination $dest -Force
        $hash = (Get-FileHash -Path $dest -Algorithm SHA256).Hash
        $script:checksums[$RelDest.Replace('\','/')] = $hash.ToLower()
        $script:copied.Add($RelDest)
    } catch {
        $script:errors.Add("Copie echouee : $RelDest - $($_.Exception.Message)")
    }
}

# ── Copie dossier récursif ─────────────────────────────────────────────────────
function Copy-Dir-Safe {
    param([string]$SrcDir, [string]$RelDestDir)
    if (-not (Test-Path $SrcDir)) { return }
    $items = Get-ChildItem -Path $SrcDir -Recurse -File -ErrorAction SilentlyContinue
    foreach ($item in $items) {
        $rel = $item.FullName.Substring($SrcDir.Length).TrimStart('\')
        $relDest = Join-Path $RelDestDir $rel
        Copy-Item-Safe -Src $item.FullName -RelDest $relDest
    }
}

Write-Host ""
Write-Host "=== Sallon-ConnecT : Creation snapshot ($Type) ===" -ForegroundColor Cyan
Write-Host "Dossier : $SnapDir"
Write-Host ""

# ── VERSION ───────────────────────────────────────────────────────────────────
$versionFile = Join-Path $RootPath 'VERSION'
$version     = '0.0.0'
if (Test-Path $versionFile) {
    Copy-Item-Safe -Src $versionFile -RelDest 'VERSION'
    $version = (Get-Content $versionFile -Raw).Trim()
}

# ── package.json (metadata uniquement) ───────────────────────────────────────
$pkgFile = Join-Path $RootPath 'package.json'
if (Test-Path $pkgFile) {
    Copy-Item-Safe -Src $pkgFile -RelDest 'package.json'
}

# ── data/ (profils, appareils, config) ───────────────────────────────────────
$dataDir = Join-Path $RootPath 'data'
if (Test-Path $dataDir) {
    Copy-Dir-Safe -SrcDir $dataDir -RelDestDir 'data'
}

# ── runtime/ utile ────────────────────────────────────────────────────────────
$runtimeKeep = @(
    'first-run-report.json',
    'update-status.json'
)
$runtimeSrc = Join-Path $RootPath 'runtime'
foreach ($rf in $runtimeKeep) {
    $rp = Join-Path $runtimeSrc $rf
    if (Test-Path $rp) {
        Copy-Item-Safe -Src $rp -RelDest "runtime\$rf"
    }
}

# ── .env existence marker (pas de contenu sensible) ──────────────────────────
$envFile = Join-Path $RootPath '.env'
$envMarkerPath = Join-Path $SnapDir 'env-marker.txt'
$envMarkerRel  = 'env-marker.txt'
$envExists = Test-Path $envFile
$envMarkerContent = if ($envExists) { '.env present au moment du snapshot — non copie pour securite' } else { '.env absent au moment du snapshot' }
Set-Content -Path $envMarkerPath -Value $envMarkerContent -Encoding UTF8
$hash = (Get-FileHash -Path $envMarkerPath -Algorithm SHA256).Hash
$checksums[$envMarkerRel] = $hash.ToLower()
$copied.Add($envMarkerRel)

# ── logs limités (full uniquement) ────────────────────────────────────────────
if ($Type -eq 'full') {
    if (Test-Path $LogsDir) {
        $logFiles = Get-ChildItem -Path $LogsDir -File -Filter '*.log' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 3
        foreach ($lf in $logFiles) {
            $lastLines = Get-Content $lf.FullName -Tail 200 -ErrorAction SilentlyContinue
            if ($lastLines) {
                $relDest   = "logs\$($lf.Name)"
                $destPath  = Join-Path $SnapDir $relDest
                $destDir   = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
                $lastLines | Set-Content -Path $destPath -Encoding UTF8
                $lhash = (Get-FileHash -Path $destPath -Algorithm SHA256).Hash
                $checksums[$relDest.Replace('\','/')] = $lhash.ToLower()
                $copied.Add($relDest)
            }
        }
    }

    # scripts/ configuration (ps1 uniquement, pas les binaires)
    $scriptsDir = Join-Path $RootPath 'scripts'
    if (Test-Path $scriptsDir) {
        $ps1Files = Get-ChildItem -Path $scriptsDir -Recurse -Filter '*.ps1' -ErrorAction SilentlyContinue
        foreach ($sf in $ps1Files) {
            $rel    = $sf.FullName.Substring($scriptsDir.Length).TrimStart('\')
            $relDst = "scripts\$rel"
            Copy-Item-Safe -Src $sf.FullName -RelDest $relDst
        }
    }
}

# ── checksum.json ──────────────────────────────────────────────────────────────
$checksumFile = Join-Path $SnapDir 'checksum.json'
$checksums | ConvertTo-Json -Depth 3 | Set-Content -Path $checksumFile -Encoding UTF8
$checkHash = (Get-FileHash -Path $checksumFile -Algorithm SHA256).Hash

# ── metadata.json ──────────────────────────────────────────────────────────────
$totalSize = 0
Get-ChildItem -Path $SnapDir -Recurse -File | ForEach-Object { $totalSize += $_.Length }

$metaDesc = if ($Description) { $Description } else { "Sauvegarde $Type automatique" }
$meta = [ordered]@{
    snapshotId      = $Timestamp
    version         = $version
    timestamp       = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    type            = $Type
    description     = $metaDesc
    fileCount       = $copied.Count
    totalSizeBytes  = $totalSize
    checksumFile    = 'checksum.json'
    checksumSHA256  = $checkHash.ToLower()
    errors          = $errors.Count
    security        = [ordered]@{
        localOnly       = $true
        noCloud         = $true
        secretsExcluded = $true
        envNotCopied    = $true
    }
}
$metaFile = Join-Path $SnapDir 'metadata.json'
$meta | ConvertTo-Json -Depth 5 | Set-Content -Path $metaFile -Encoding UTF8

# ── rapport texte ──────────────────────────────────────────────────────────────
$reportLines = [System.Collections.Generic.List[string]]::new()
$reportLines.Add("=== Rapport snapshot Sallon-ConnecT ===")
$reportLines.Add("Date        : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$reportLines.Add("Type        : $Type")
$reportLines.Add("Version     : $version")
$reportLines.Add("Snapshot ID : $Timestamp")
$reportLines.Add("Dossier     : $SnapDir")
$reportLines.Add("Fichiers    : $($copied.Count)")
$reportLines.Add("Taille      : $([Math]::Round($totalSize/1KB, 1)) KB")
if ($Description) { $reportLines.Add("Description : $Description") }
$reportLines.Add("")
$reportLines.Add("--- Fichiers sauvegardes ---")
foreach ($f in $copied) { $reportLines.Add("  $f") }
if ($errors.Count -gt 0) {
    $reportLines.Add("")
    $reportLines.Add("--- Erreurs ---")
    foreach ($e in $errors) { $reportLines.Add("  ERREUR: $e") }
}
$reportLines.Add("")
$reportLines.Add("Securite : local-only, aucun secret copie, aucun upload.")
$reportLines | Set-Content -Path (Join-Path $SnapDir 'report.txt') -Encoding UTF8

# ── Export ZIP optionnel ────────────────────────────────────────────────────────
if ($ExportZip) {
    $zipPath = Join-Path (Split-Path $SnapDir -Parent) "$Timestamp.zip"
    Write-Host "Creation archive ZIP..." -ForegroundColor Yellow
    try {
        Compress-Archive -Path "$SnapDir\*" -DestinationPath $zipPath -Force
        $zipHash = (Get-FileHash -Path $zipPath -Algorithm SHA256).Hash
        Write-Host "ZIP : $zipPath" -ForegroundColor Green
        Write-Host "SHA256 ZIP : $($zipHash.ToLower())"
    } catch {
        $errors.Add("Export ZIP echoue : $($_.Exception.Message)")
        Write-Warning "Export ZIP echoue : $($_.Exception.Message)"
    }
}

# ── Résumé final ───────────────────────────────────────────────────────────────
Write-Host ""
if ($errors.Count -eq 0) {
    Write-Host "[OK] Snapshot cree avec succes." -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Snapshot cree avec $($errors.Count) erreur(s)." -ForegroundColor Yellow
    foreach ($e in $errors) { Write-Warning $e }
}
Write-Host "ID      : $Timestamp"
Write-Host "Fichiers: $($copied.Count)"
Write-Host "Taille  : $([Math]::Round($totalSize/1KB, 1)) KB"
Write-Host "SHA256 checksum : $($checkHash.ToLower())"
Write-Host ""

exit $(if ($errors.Count -eq 0) { 0 } else { 1 })
