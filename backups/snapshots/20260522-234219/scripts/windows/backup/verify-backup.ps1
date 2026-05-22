#Requires -Version 5.1
<#
.SYNOPSIS
    Vérifie l'intégrité d'un snapshot Sallon-ConnecT.
.PARAMETER SnapshotId
    ID du snapshot (nom du dossier horodaté). Si absent, vérifie le plus récent.
.PARAMETER All
    Vérifie tous les snapshots disponibles.
.PARAMETER Json
    Sortie JSON.
.PARAMETER RootPath
    Chemin racine du projet.
#>
param(
    [string]$SnapshotId = '',
    [switch]$All,
    [switch]$Json,
    [string]$RootPath   = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'

function Verify-Snapshot {
    param([string]$SnapDir)

    $id     = Split-Path $SnapDir -Leaf
    $result = [ordered]@{
        snapshotId = $id
        path       = $SnapDir
        status     = 'unknown'
        metadata   = $false
        checksum   = $false
        report     = $false
        missing    = @()
        corrupted  = @()
        verified   = @()
        errors     = @()
    }

    if (-not (Test-Path $SnapDir)) {
        $result.status = 'missing'
        $result.errors = @("Dossier introuvable : $SnapDir")
        return $result
    }

    $metaFile     = Join-Path $SnapDir 'metadata.json'
    $checksumFile = Join-Path $SnapDir 'checksum.json'
    $reportFile   = Join-Path $SnapDir 'report.txt'

    $result.metadata = Test-Path $metaFile
    $result.report   = Test-Path $reportFile

    if (-not (Test-Path $metaFile)) {
        $result.status = 'incomplete'
        $result.errors = @("metadata.json absent")
        return $result
    }

    $meta = $null
    try { $meta = Get-Content $metaFile -Raw | ConvertFrom-Json } catch {
        $result.status = 'corrupted'
        $result.errors = @("metadata.json illisible : $($_.Exception.Message)")
        return $result
    }

    if (-not (Test-Path $checksumFile)) {
        $result.status = 'incomplete'
        $result.errors = @("checksum.json absent")
        return $result
    }

    $result.checksum = $true
    $checksums = $null
    try {
        $checksums = Get-Content $checksumFile -Raw | ConvertFrom-Json
    } catch {
        $result.status = 'corrupted'
        $result.errors = @("checksum.json illisible : $($_.Exception.Message)")
        return $result
    }

    # Vérifier SHA256 du checksum.json lui-même via metadata
    if ($meta.checksumSHA256) {
        $actualChecksumHash = (Get-FileHash -Path $checksumFile -Algorithm SHA256).Hash.ToLower()
        if ($actualChecksumHash -ne $meta.checksumSHA256.ToLower()) {
            $result.corrupted = @('checksum.json (hash metadata invalide)')
            $result.status    = 'corrupted'
            return $result
        }
    }

    # Recalculer SHA256 de chaque fichier listé
    $missing   = [System.Collections.Generic.List[string]]::new()
    $corrupted = [System.Collections.Generic.List[string]]::new()
    $verified  = [System.Collections.Generic.List[string]]::new()

    $checksumProps = $checksums.PSObject.Properties
    foreach ($prop in $checksumProps) {
        $relPath  = $prop.Name.Replace('/', '\')
        $expected = $prop.Value
        $fullPath = Join-Path $SnapDir $relPath

        if (-not (Test-Path $fullPath)) {
            $missing.Add($prop.Name)
            continue
        }

        $actual = (Get-FileHash -Path $fullPath -Algorithm SHA256).Hash.ToLower()
        if ($actual -ne $expected.ToLower()) {
            $corrupted.Add($prop.Name)
        } else {
            $verified.Add($prop.Name)
        }
    }

    $result.missing   = $missing.ToArray()
    $result.corrupted = $corrupted.ToArray()
    $result.verified  = $verified.ToArray()

    if ($corrupted.Count -gt 0) {
        $result.status = 'corrupted'
    } elseif ($missing.Count -gt 0) {
        $result.status = 'incomplete'
    } else {
        $result.status = 'valid'
    }

    return $result
}

# ── Sélection des snapshots à vérifier ────────────────────────────────────────
$snapDirs = [System.Collections.Generic.List[string]]::new()

if ($All) {
    if (Test-Path $SnapshotsDir) {
        Get-ChildItem -Path $SnapshotsDir -Directory |
            Sort-Object Name -Descending |
            ForEach-Object { $snapDirs.Add($_.FullName) }
    }
} elseif ($SnapshotId) {
    $snapDirs.Add((Join-Path $SnapshotsDir $SnapshotId))
} else {
    # Plus récent
    if (Test-Path $SnapshotsDir) {
        $latest = Get-ChildItem -Path $SnapshotsDir -Directory |
            Sort-Object Name -Descending |
            Select-Object -First 1
        if ($latest) { $snapDirs.Add($latest.FullName) }
    }
}

if ($snapDirs.Count -eq 0) {
    if ($Json) {
        @{ results = @(); total = 0; error = 'Aucun snapshot trouve' } | ConvertTo-Json -Depth 4
    } else {
        Write-Host "Aucun snapshot a verifier." -ForegroundColor Yellow
    }
    exit 1
}

$allResults = [System.Collections.Generic.List[object]]::new()
foreach ($dir in $snapDirs) {
    $r = Verify-Snapshot -SnapDir $dir
    $allResults.Add($r)
}

if ($Json) {
    @{
        results = $allResults.ToArray()
        total   = $allResults.Count
        valid   = ($allResults | Where-Object { $_.status -eq 'valid' }).Count
    } | ConvertTo-Json -Depth 6
} else {
    Write-Host ""
    Write-Host "=== Verification snapshots Sallon-ConnecT ===" -ForegroundColor Cyan
    Write-Host ""
    foreach ($r in $allResults) {
        $color = switch ($r.status) {
            'valid'      { 'Green'  }
            'corrupted'  { 'Red'    }
            'incomplete' { 'Yellow' }
            default      { 'Gray'   }
        }
        Write-Host "Snapshot : $($r.snapshotId)" -ForegroundColor $color
        Write-Host "  Statut   : $($r.status.ToUpper())"
        Write-Host "  Verifie  : $($r.verified.Count) fichier(s)"
        if ($r.missing.Count -gt 0)   { Write-Host "  Manquants : $($r.missing -join ', ')" -ForegroundColor Yellow }
        if ($r.corrupted.Count -gt 0) { Write-Host "  Corrompus : $($r.corrupted -join ', ')" -ForegroundColor Red }
        if ($r.errors.Count -gt 0)    { foreach ($e in $r.errors) { Write-Host "  Erreur : $e" -ForegroundColor Red } }
        Write-Host ""
    }
}

$failCount = ($allResults | Where-Object { $_.status -ne 'valid' }).Count
exit $(if ($failCount -eq 0) { 0 } else { 1 })
