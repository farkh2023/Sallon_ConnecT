param(
  [switch]$Json
)

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root        = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$RuntimeDir  = Join-Path $Root 'runtime'
$CheckScript = Join-Path $ScriptDir 'check-environment.ps1'
$ReportFile  = Join-Path $RuntimeDir 'first-run-report.json'

# ---------------------------------------------------------------------------
# Rapport precedent
# ---------------------------------------------------------------------------
$previousReport = $null
$firstRunDone   = $false
if (Test-Path $ReportFile) {
    try {
        $raw = Get-Content $ReportFile -Raw -ErrorAction SilentlyContinue
        if ($raw) {
            $previousReport = $raw | ConvertFrom-Json
            $firstRunDone   = $true
        }
    } catch { }
}

# ---------------------------------------------------------------------------
# Diagnostic actuel
# ---------------------------------------------------------------------------
$envData = $null
try {
    $psArgs  = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $CheckScript, '-RootPath', $Root, '-Json')
    $rawJson = & powershell.exe @psArgs
    $envData = ($rawJson -join '') | ConvertFrom-Json
} catch { }

# ---------------------------------------------------------------------------
# Sortie JSON
# ---------------------------------------------------------------------------
if ($Json) {
    [PSCustomObject]@{
        firstRunDone   = $firstRunDone
        previousReport = $previousReport
        currentEnv     = $envData
    } | ConvertTo-Json -Depth 6
    exit $(if ($firstRunDone) { 0 } else { 1 })
}

# ---------------------------------------------------------------------------
# Sortie lisible
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '== Statut premier lancement Sallon-ConnecT ==' -ForegroundColor Cyan

if ($firstRunDone) {
    Write-Host '  Premier lancement : FAIT' -ForegroundColor Green
    Write-Host "  Date        : $($previousReport.timestamp)"
    Write-Host "  Mode choisi : $($previousReport.mode)"
    Write-Host "  Node.js     : $($previousReport.nodeVersion)"
    Write-Host "  Tray active : $($previousReport.tray.enabled)"
    Write-Host "  Service     : $($previousReport.service.mode) / $($previousReport.service.status)"
} else {
    Write-Host '  Premier lancement : NON REALISE' -ForegroundColor Yellow
    Write-Host '  Lancer : scripts\windows\first-run\first-run.ps1'
}

if ($null -ne $envData) {
    Write-Host ''
    Write-Host '  Environnement actuel :' -ForegroundColor Cyan

    $nc = if ($envData.node.ok) { 'Green' } else { 'Red' }
    Write-Host "    Node.js  : $($envData.node.version)" -ForegroundColor $nc

    $bc = if ($envData.backend.reachable) { 'Green' } else { 'Yellow' }
    Write-Host "    Backend  : $(if ($envData.backend.reachable) { 'En ligne' } else { 'Non joignable' })" -ForegroundColor $bc

    $fc = if ($envData.frontend.reachable) { 'Green' } else { 'Yellow' }
    Write-Host "    Frontend : $(if ($envData.frontend.reachable) { 'En ligne' } else { 'Non joignable' })" -ForegroundColor $fc

    Write-Host "    Service  : $($envData.service.mode) / $($envData.service.status)"

    $tc = if ($envData.tray.running) { 'Green' } else { 'Yellow' }
    Write-Host "    Tray     : $(if ($envData.tray.running) { 'Actif' } else { 'Arrete' })" -ForegroundColor $tc
}

Write-Host ''
Write-Host '  Pour relancer le wizard : scripts\windows\first-run\first-run.ps1'
Write-Host ''

exit $(if ($firstRunDone) { 0 } else { 1 })
