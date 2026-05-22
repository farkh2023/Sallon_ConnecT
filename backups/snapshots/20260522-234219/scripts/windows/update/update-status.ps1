param(
  [switch]$Json
)

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root       = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$UpdatesDir = Join-Path $Root 'runtime\updates'
$BackupsDir = Join-Path $Root 'runtime\update-backups'

# ---------------------------------------------------------------------------
# Version locale
# ---------------------------------------------------------------------------
$localVersion = 'unknown'
$vFile = Join-Path $Root 'VERSION'
$pFile = Join-Path $Root 'package.json'
if (Test-Path $vFile) {
    $localVersion = (Get-Content $vFile -Raw -ErrorAction SilentlyContinue).Trim()
} elseif (Test-Path $pFile) {
    try { $localVersion = (Get-Content $pFile -Raw | ConvertFrom-Json).version } catch { }
}

# ---------------------------------------------------------------------------
# Versions telechargees
# ---------------------------------------------------------------------------
$downloads = [System.Collections.Generic.List[object]]::new()
if (Test-Path $UpdatesDir) {
    $dlDirs = @(Get-ChildItem -Path $UpdatesDir -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)
    foreach ($d in $dlDirs) {
        $vPath = Join-Path $d.FullName 'verification.json'
        $aPath = Join-Path $d.FullName 'apply-report.json'
        $v = $null; $a = $null
        if (Test-Path $vPath) { try { $v = Get-Content $vPath -Raw | ConvertFrom-Json } catch { } }
        if (Test-Path $aPath) { try { $a = Get-Content $aPath -Raw | ConvertFrom-Json } catch { } }
        $downloads.Add([PSCustomObject]@{
            version   = $d.Name
            verified  = if ($v) { [bool]$v.verified } else { $false }
            applied   = ($null -ne $a)
            timestamp = if ($v) { $v.timestamp } else { 'n/a' }
        })
    }
}

# ---------------------------------------------------------------------------
# Backups disponibles
# ---------------------------------------------------------------------------
$backups = [System.Collections.Generic.List[object]]::new()
if (Test-Path $BackupsDir) {
    $bDirs = @(Get-ChildItem -Path $BackupsDir -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending)
    foreach ($b in $bDirs) {
        $mPath = Join-Path $b.FullName 'backup-manifest.json'
        $m = $null
        if (Test-Path $mPath) { try { $m = Get-Content $mPath -Raw | ConvertFrom-Json } catch { } }
        $backups.Add([PSCustomObject]@{
            timestamp   = $b.Name
            fromVersion = if ($m) { $m.fromVersion } else { 'n/a' }
            toVersion   = if ($m) { $m.toVersion } else { 'n/a' }
        })
    }
}

$result = [PSCustomObject]@{
    timestamp     = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    localVersion  = $localVersion
    downloads     = $downloads.ToArray()
    backups       = $backups.ToArray()
    rollbackReady = ($backups.Count -gt 0)
}

if ($Json) {
    $result | ConvertTo-Json -Depth 4
    exit 0
}

# ---------------------------------------------------------------------------
# Affichage
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '== Statut mise a jour Sallon-ConnecT ==' -ForegroundColor Cyan
Write-Host "  Version locale : $localVersion"
Write-Host ''

if ($downloads.Count -gt 0) {
    Write-Host '  Versions telechargees :' -ForegroundColor Cyan
    foreach ($dl in $downloads) {
        $sha    = if ($dl.verified) { 'SHA256 OK' } else { 'NON VERIFIE' }
        $status = if ($dl.applied)  { ' [appliquee]' } else { '' }
        Write-Host "    v$($dl.version)  $sha$status  ($($dl.timestamp))"
    }
} else {
    Write-Host '  Aucune mise a jour telechargee.' -ForegroundColor Yellow
}
Write-Host ''

if ($backups.Count -gt 0) {
    Write-Host '  Backups disponibles (rollback possible) :' -ForegroundColor Cyan
    foreach ($bk in $backups) {
        Write-Host "    $($bk.timestamp)  v$($bk.fromVersion) -> v$($bk.toVersion)"
    }
} else {
    Write-Host '  Aucun backup disponible.' -ForegroundColor Yellow
}

Write-Host ''
Write-Host '  Commandes :' -ForegroundColor Cyan
Write-Host '    Verifier    : scripts\windows\update\check-update.ps1'
Write-Host '    Telecharger : scripts\windows\update\download-update.ps1'
Write-Host '    Appliquer   : scripts\windows\update\apply-update.ps1'
Write-Host '    Rollback    : scripts\windows\update\rollback-update.ps1 -List'
Write-Host ''
exit 0
