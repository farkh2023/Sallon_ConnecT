#Requires -Version 5.1
<#
.SYNOPSIS
    Supprime un snapshot Sallon-ConnecT. Confirmation obligatoire.
.PARAMETER SnapshotId
    ID du snapshot à supprimer. Si absent, liste et demande.
.PARAMETER All
    Supprime tous les snapshots (confirmation obligatoire).
.PARAMETER Force
    Supprime sans confirmation interactive (déconseillé).
.PARAMETER RootPath
    Chemin racine du projet.
#>
param(
    [string]$SnapshotId = '',
    [switch]$All,
    [switch]$Force,
    [string]$RootPath   = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

if (-not $RootPath) {
    $RootPath = Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent
}
$SnapshotsDir = Join-Path $RootPath 'backups\snapshots'

Write-Host ""
Write-Host "=== Sallon-ConnecT : Suppression snapshot ===" -ForegroundColor Cyan

if (-not (Test-Path $SnapshotsDir)) {
    Write-Host "Aucun snapshot disponible (dossier absent)." -ForegroundColor Yellow
    exit 0
}

$dirs = Get-ChildItem -Path $SnapshotsDir -Directory | Sort-Object Name -Descending
if ($dirs.Count -eq 0) {
    Write-Host "Aucun snapshot disponible." -ForegroundColor Yellow
    exit 0
}

# ── Mode -All ─────────────────────────────────────────────────────────────────
if ($All) {
    Write-Host ""
    Write-Host "Snapshots qui seront supprimes :"
    foreach ($d in $dirs) { Write-Host "  - $($d.Name)" }
    Write-Host ""
    if (-not $Force) {
        $conf = Read-Host "Taper 'SUPPRIMER TOUT' pour confirmer"
        if ($conf.Trim() -ne 'SUPPRIMER TOUT') {
            Write-Host "Suppression annulee." -ForegroundColor Yellow
            exit 1
        }
    }
    $errors = 0
    foreach ($d in $dirs) {
        try {
            Remove-Item -Path $d.FullName -Recurse -Force
            Write-Host "Supprime : $($d.Name)" -ForegroundColor Green
        } catch {
            Write-Warning "Erreur suppression $($d.Name) : $($_.Exception.Message)"
            $errors++
        }
    }
    Write-Host ""
    Write-Host "Suppression terminee. Erreurs : $errors"
    exit $(if ($errors -eq 0) { 0 } else { 1 })
}

# ── Sélection snapshot individuel ─────────────────────────────────────────────
if (-not $SnapshotId) {
    Write-Host ""
    Write-Host "Snapshots disponibles :"
    $i = 1
    foreach ($d in $dirs) {
        Write-Host "  [$i] $($d.Name)"
        $i++
    }
    Write-Host ""
    $choice = Read-Host "Numero du snapshot a supprimer"
    $idx = 0
    if (-not [int]::TryParse($choice.Trim(), [ref]$idx) -or $idx -lt 1 -or $idx -gt $dirs.Count) {
        Write-Host "Choix invalide." -ForegroundColor Red
        exit 1
    }
    $SnapshotId = $dirs[$idx - 1].Name
}

$snapDir = Join-Path $SnapshotsDir $SnapshotId
if (-not (Test-Path $snapDir)) {
    Write-Host "Snapshot introuvable : $SnapshotId" -ForegroundColor Red
    exit 1
}

# Afficher info snapshot
$metaFile = Join-Path $snapDir 'metadata.json'
if (Test-Path $metaFile) {
    try {
        $m = Get-Content $metaFile -Raw | ConvertFrom-Json
        Write-Host ""
        Write-Host "  Type    : $($m.type)"
        Write-Host "  Version : $($m.version)"
        Write-Host "  Fichiers: $($m.fileCount)"
        Write-Host "  Desc    : $($m.description)"
    } catch {}
}

# Taille
$sizeBytes = 0
Get-ChildItem -Path $snapDir -Recurse -File -ErrorAction SilentlyContinue |
    ForEach-Object { $sizeBytes += $_.Length }

Write-Host ""
Write-Host "Snapshot   : $SnapshotId"
Write-Host "Taille     : $([Math]::Round($sizeBytes/1KB, 1)) KB"
Write-Host ""

# ── Confirmation obligatoire ───────────────────────────────────────────────────
if (-not $Force) {
    $conf = Read-Host "Taper 'oui' pour confirmer la suppression"
    if ($conf.Trim().ToLower() -ne 'oui') {
        Write-Host "Suppression annulee." -ForegroundColor Yellow
        exit 1
    }
}

try {
    Remove-Item -Path $snapDir -Recurse -Force
    Write-Host ""
    Write-Host "[OK] Snapshot supprime : $SnapshotId" -ForegroundColor Green
    exit 0
} catch {
    Write-Host ""
    Write-Host "[ERREUR] Suppression echouee : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
