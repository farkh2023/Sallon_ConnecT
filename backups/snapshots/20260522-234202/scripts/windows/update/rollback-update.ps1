param(
  [switch]$Confirm,
  [switch]$Restart,
  [switch]$List
)

$ErrorActionPreference = 'Continue'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root       = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$BackupsDir = Join-Path $Root 'runtime\update-backups'
$ServiceDir = Join-Path $Root 'scripts\windows\service'
$TrayDir    = Join-Path $Root 'scripts\windows\tray'

function Write-Title { param([string]$T) Write-Host ''; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok    { param([string]$M) Write-Host "  OK   $M" -ForegroundColor Green }
function Write-Warn  { param([string]$M) Write-Host "  WARN $M" -ForegroundColor Yellow }
function Write-Fail  { param([string]$M) Write-Host "  FAIL $M" -ForegroundColor Red }
function Write-Info  { param([string]$M) Write-Host "  $M" }

Write-Host ''
Write-Host '== Rollback Sallon-ConnecT ==' -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Lister les backups
# ---------------------------------------------------------------------------
$backups = @()
if (Test-Path $BackupsDir) {
    $backups = @(Get-ChildItem -Path $BackupsDir -Directory -ErrorAction SilentlyContinue |
                 Sort-Object Name -Descending)
}

if ($backups.Count -eq 0) {
    Write-Fail 'Aucun backup disponible dans runtime\update-backups\.'
    Write-Info 'Le rollback necessite un backup cree par apply-update.ps1.'
    exit 1
}

if ($List) {
    Write-Host ''
    Write-Host '  Backups disponibles :' -ForegroundColor Cyan
    foreach ($b in $backups) {
        $mPath = Join-Path $b.FullName 'backup-manifest.json'
        if (Test-Path $mPath) {
            try {
                $m = Get-Content $mPath -Raw | ConvertFrom-Json
                Write-Info "$($b.Name)  de v$($m.fromVersion) vers v$($m.toVersion)"
            } catch {
                Write-Info "$($b.Name)"
            }
        } else {
            Write-Info "$($b.Name)"
        }
    }
    Write-Host ''
    exit 0
}

# ---------------------------------------------------------------------------
# Selectionner le backup le plus recent
# ---------------------------------------------------------------------------
$selected  = $backups[0]
$mPath2    = Join-Path $selected.FullName 'backup-manifest.json'
$mData     = $null
if (Test-Path $mPath2) {
    try { $mData = Get-Content $mPath2 -Raw | ConvertFrom-Json } catch { }
}

Write-Info "Backup selectionne : $($selected.Name)"
if ($mData) {
    Write-Info "  Version restauree : v$($mData.fromVersion)"
    Write-Info "  Version actuelle  : v$($mData.toVersion)"
}

# ---------------------------------------------------------------------------
# Confirmation explicite
# ---------------------------------------------------------------------------
if (-not $Confirm) {
    Write-Host ''
    Write-Host '  ATTENTION : Les fichiers applicatifs seront remplaces par la version precedente.' -ForegroundColor Yellow
    Write-Host '  Vos donnees (logs, runtime, backups, .env) ne sont pas modifiees.' -ForegroundColor Yellow
    Write-Host ''
    $answer = Read-Host '  Confirmer le rollback ? [oui/non]'
    if ($answer.Trim() -notmatch '^(oui|o|yes|y)$') {
        Write-Info 'Rollback annule.'
        exit 0
    }
}

# ---------------------------------------------------------------------------
# Arreter services
# ---------------------------------------------------------------------------
Write-Title 'Arret des services'

$stopTrayScript    = Join-Path $TrayDir    'stop-tray.ps1'
$stopServiceScript = Join-Path $ServiceDir 'stop-service.ps1'

if (Test-Path $stopTrayScript) {
    $pArgsT = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $stopTrayScript)
    try { & powershell.exe @pArgsT | Out-Null; Write-Ok 'Tray arrete.' } catch { Write-Warn 'Tray: aucun actif.' }
}
if (Test-Path $stopServiceScript) {
    $pArgsS = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $stopServiceScript)
    try { & powershell.exe @pArgsS | Out-Null; Write-Ok 'Service arrete.' } catch { Write-Warn 'Service: aucun actif.' }
}

# ---------------------------------------------------------------------------
# Restauration
# ---------------------------------------------------------------------------
Write-Title 'Restauration'

$backupItems = @(Get-ChildItem -Path $selected.FullName -Recurse -ErrorAction SilentlyContinue |
                 Where-Object { $_.Name -ne 'backup-manifest.json' })

$restored = 0
$failed   = 0

foreach ($item in $backupItems) {
    $relPath  = $item.FullName.Substring($selected.FullName.Length).TrimStart('\')
    $destPath = Join-Path $Root $relPath

    if ($item.PSIsContainer) {
        New-Item -Path $destPath -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
    } else {
        $parent = Split-Path $destPath -Parent
        New-Item -Path $parent -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
        try {
            Copy-Item -Path $item.FullName -Destination $destPath -Force -ErrorAction Stop
            $restored++
        } catch {
            Write-Warn "Echec restauration : $relPath"
            $failed++
        }
    }
}

Write-Ok "$restored fichiers restaures$(if ($failed -gt 0) { ", $failed echecs" } else { '' })."

# Verifier VERSION apres restauration
$versionAfter = 'unknown'
$vFile = Join-Path $Root 'VERSION'
if (Test-Path $vFile) {
    $versionAfter = (Get-Content $vFile -Raw -ErrorAction SilentlyContinue).Trim()
}
Write-Ok "VERSION apres rollback : $versionAfter"

# ---------------------------------------------------------------------------
# Redemarrage
# ---------------------------------------------------------------------------
if ($Restart) {
    $startScript = Join-Path $Root 'scripts\windows\start-sallon-connect.ps1'
    if (Test-Path $startScript) {
        $pArgsR = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startScript)
        Start-Process powershell.exe -ArgumentList $pArgsR
        Write-Ok 'Backend relance.'
    }
} else {
    Write-Host ''
    Write-Info 'Relancer manuellement : scripts\windows\start-sallon-connect.ps1'
}

Write-Host ''
Write-Host '  Rollback effectue.' -ForegroundColor Green
Write-Host ''
exit $(if ($failed -gt 0) { 1 } else { 0 })
