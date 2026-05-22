#Requires -Version 5.1
<#
.SYNOPSIS
    Liste les snapshots Sallon-ConnecT disponibles.
.PARAMETER Json
    Sortie JSON.
.PARAMETER RootPath
    Chemin racine du projet.
#>
param(
    [switch]$Json,
    [string]$RootPath = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'

$results = [System.Collections.Generic.List[object]]::new()

if (-not (Test-Path $SnapshotsDir)) {
    if ($Json) {
        @{ snapshots = @(); total = 0; snapshotsDir = $SnapshotsDir } | ConvertTo-Json -Depth 4
    } else {
        Write-Host "Aucun snapshot trouve (dossier absent : $SnapshotsDir)." -ForegroundColor Yellow
    }
    exit 0
}

$dirs = Get-ChildItem -Path $SnapshotsDir -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending

if ($dirs.Count -eq 0) {
    if ($Json) {
        @{ snapshots = @(); total = 0; snapshotsDir = $SnapshotsDir } | ConvertTo-Json -Depth 4
    } else {
        Write-Host "Aucun snapshot disponible." -ForegroundColor Yellow
    }
    exit 0
}

foreach ($d in $dirs) {
    $metaFile = Join-Path $d.FullName 'metadata.json'
    $entry    = [ordered]@{
        snapshotId     = $d.Name
        path           = $d.FullName
        valid          = $false
        version        = 'unknown'
        type           = 'unknown'
        description    = ''
        timestamp      = 'unknown'
        fileCount      = 0
        totalSizeKB    = 0
        hasChecksum    = $false
        hasReport      = $false
    }

    if (Test-Path $metaFile) {
        try {
            $meta = Get-Content $metaFile -Raw | ConvertFrom-Json
            $entry.valid       = $true
            $entry.version     = if ($meta.version)     { $meta.version }     else { 'unknown' }
            $entry.type        = if ($meta.type)         { $meta.type }        else { 'unknown' }
            $entry.description = if ($meta.description)  { $meta.description } else { '' }
            $entry.timestamp   = if ($meta.timestamp)    { $meta.timestamp }   else { $d.Name }
            $entry.fileCount   = if ($null -ne $meta.fileCount) { $meta.fileCount } else { 0 }
        } catch { $entry.valid = $false }
    }

    $sizeBytes = 0
    Get-ChildItem -Path $d.FullName -Recurse -File -ErrorAction SilentlyContinue |
        ForEach-Object { $sizeBytes += $_.Length }
    $entry.totalSizeKB = [Math]::Round($sizeBytes / 1KB, 1)
    $entry.hasChecksum = Test-Path (Join-Path $d.FullName 'checksum.json')
    $entry.hasReport   = Test-Path (Join-Path $d.FullName 'report.txt')

    $results.Add($entry)
}

if ($Json) {
    @{
        snapshots    = $results.ToArray()
        total        = $results.Count
        snapshotsDir = $SnapshotsDir
    } | ConvertTo-Json -Depth 5
} else {
    Write-Host ""
    Write-Host "=== Snapshots Sallon-ConnecT ===" -ForegroundColor Cyan
    Write-Host "Dossier : $SnapshotsDir"
    Write-Host ""
    $i = 1
    foreach ($s in $results) {
        $validStr = if ($s.valid) { '[OK]' } else { '[?] ' }
        $color    = if ($s.valid) { 'Green' } else { 'Yellow' }
        Write-Host "$i. $($s.snapshotId)" -ForegroundColor $color
        Write-Host "   Type     : $($s.type)  |  Version : $($s.version)  |  Fichiers : $($s.fileCount)  |  Taille : $($s.totalSizeKB) KB"
        Write-Host "   Desc     : $($s.description)"
        Write-Host "   Statut   : $validStr  Checksum : $(if ($s.hasChecksum) {'oui'} else {'non'})  Rapport : $(if ($s.hasReport) {'oui'} else {'non'})"
        Write-Host ""
        $i++
    }
    Write-Host "Total : $($results.Count) snapshot(s)."
}

exit 0
