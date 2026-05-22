param(
  [switch]$Unattended,
  [ValidateSet('portable', 'task-scheduler', 'nssm')]
  [string]$Mode = 'portable',
  [switch]$EnableTray,
  [switch]$OpenDashboard,
  [switch]$SkipCheck
)

$ErrorActionPreference = 'Continue'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root        = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$RuntimeDir  = Join-Path $Root 'runtime'
$LogsDir     = Join-Path $Root 'logs'
$ServiceDir  = Join-Path $Root 'scripts\windows\service'
$TrayDir     = Join-Path $Root 'scripts\windows\tray'
$CheckScript = Join-Path $ScriptDir 'check-environment.ps1'

function Write-Title { param([string]$T) Write-Host ''; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok    { param([string]$M) Write-Host "  OK   $M" -ForegroundColor Green }
function Write-Warn  { param([string]$M) Write-Host "  WARN $M" -ForegroundColor Yellow }
function Write-Fail  { param([string]$M) Write-Host "  FAIL $M" -ForegroundColor Red }
function Write-Info  { param([string]$M) Write-Host "  $M" }

# ---------------------------------------------------------------------------
# Bienvenue
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '======================================================' -ForegroundColor Cyan
Write-Host '  Sallon-ConnecT v0.4.0 - Assistant premier lancement' -ForegroundColor Cyan
Write-Host '  Local-only. Aucun cloud. Aucun secret transmis.     ' -ForegroundColor Cyan
Write-Host '======================================================' -ForegroundColor Cyan
Write-Host ''

# ---------------------------------------------------------------------------
# Dossiers essentiels
# ---------------------------------------------------------------------------
New-Item -Path $RuntimeDir -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
New-Item -Path $LogsDir    -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null

# ---------------------------------------------------------------------------
# Diagnostic environnement
# ---------------------------------------------------------------------------
$envData = $null

if (-not $SkipCheck) {
    Write-Info "Diagnostic de l'environnement en cours..."
    try {
        $psArgs  = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $CheckScript, '-RootPath', $Root, '-Json')
        $rawJson = & powershell.exe @psArgs
        $envData = ($rawJson -join '') | ConvertFrom-Json
    } catch {
        Write-Warn 'Diagnostic partiel — continuer avec prudence.'
    }

    if ($null -ne $envData) {
        if (-not $envData.node.ok) {
            Write-Fail "Node.js absent ou trop ancien ($($envData.node.version)) - requis 22.13.0+"
            Write-Info 'Installer Node.js LTS depuis : https://nodejs.org/fr/'
            Write-Info ''
            exit 1
        }
        Write-Ok "Node.js $($envData.node.version)"
        if (-not $envData.npm.ok) { Write-Warn 'npm introuvable - verifier installation Node.js.' }

        if ($envData.backend.reachable)  { Write-Ok 'Backend joignable (http://localhost:3000)' }
        else                              { Write-Info 'Backend non joignable (normal si non demarre)' }
        if ($envData.frontend.reachable) { Write-Ok 'Frontend joignable (http://localhost:3001)' }
        else                              { Write-Info 'Frontend non joignable (normal si non demarre)' }

        Write-Info "Service : $($envData.service.mode) / $($envData.service.status)"
        Write-Info "Tray    : $(if ($envData.tray.running) { 'Actif' } else { 'Arrete' })"
        Write-Info "Dossiers: runtime=$(if ($envData.folders.runtime) {'OK'} else {'ABSENT'})  logs=$(if ($envData.folders.logs) {'OK'} else {'ABSENT'})  backups=$(if ($envData.folders.backups) {'OK'} else {'ABSENT'})"
    }
}

# ---------------------------------------------------------------------------
# Choix du mode de demarrage
# ---------------------------------------------------------------------------
$chosenMode  = $Mode
$trayEnabled = $EnableTray.IsPresent

if (-not $Unattended) {
    Write-Title 'Choix du mode de demarrage'
    Write-Info '[1] Portable      - Lancer manuellement via start-sallon-connect.ps1'
    Write-Info '[2] Task Scheduler - Demarrage automatique sans admin (recommande)'
    Write-Info '[3] NSSM           - Service Windows systemique (admin requis)'
    Write-Info '[0] Passer         - Configurer plus tard'
    Write-Host ''
    $choice = Read-Host '  Votre choix (1/2/3/0)'
    switch ($choice.Trim()) {
        '2'     { $chosenMode = 'task-scheduler' }
        '3'     { $chosenMode = 'nssm' }
        default { $chosenMode = 'portable' }
    }
}

# ---------------------------------------------------------------------------
# Application du mode choisi
# ---------------------------------------------------------------------------
Write-Title "Configuration : $chosenMode"
$installScript = Join-Path $ServiceDir 'install-service.ps1'

switch ($chosenMode) {
    'task-scheduler' {
        Write-Info 'Configuration Task Scheduler en cours...'
        try {
            $psArgs2 = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $installScript,
                         '-UseTaskScheduler', '-Unattended', '-SkipTests')
            & powershell.exe @psArgs2
            Write-Ok 'Task Scheduler configure.'
        } catch {
            Write-Warn 'Configuration Task Scheduler echouee - mode portable utilise.'
            $chosenMode = 'portable'
        }
    }
    'nssm' {
        $currentUser = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
        $isAdmin     = $currentUser.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
        if (-not $isAdmin) {
            Write-Warn 'NSSM necessite les droits admin - mode portable utilise a la place.'
            $chosenMode = 'portable'
        } else {
            Write-Info 'Configuration NSSM en cours...'
            try {
                $psArgs3 = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $installScript,
                             '-Unattended', '-SkipTests')
                & powershell.exe @psArgs3
                Write-Ok 'Service NSSM configure.'
            } catch {
                Write-Warn 'Configuration NSSM echouee - mode portable utilise.'
                $chosenMode = 'portable'
            }
        }
    }
    default {
        Write-Ok 'Mode portable : lancer via scripts\windows\start-sallon-connect.ps1'
    }
}

# ---------------------------------------------------------------------------
# Tray
# ---------------------------------------------------------------------------
if (-not $Unattended) {
    Write-Host ''
    $trayAnswer = Read-Host '  Activer le tray (zone de notification Windows) ? [O/N]'
    $trayEnabled = ($trayAnswer.Trim() -in @('O', 'o', 'oui', 'Oui', 'Y', 'y', 'yes'))
}

if ($trayEnabled) {
    $startTrayScript = Join-Path $TrayDir 'start-tray.ps1'
    Write-Info 'Demarrage du tray...'
    try {
        $psArgs4 = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', $startTrayScript)
        & powershell.exe @psArgs4
        Write-Ok 'Tray demarre (icone dans la zone de notification).'
    } catch {
        Write-Warn 'Demarrage tray echoue - relancer : scripts\windows\tray\start-tray.ps1'
        $trayEnabled = $false
    }
}

# ---------------------------------------------------------------------------
# Rapport premier lancement
# ---------------------------------------------------------------------------
Write-Title 'Generation du rapport'

$nodeVer = if ($null -ne $envData) { $envData.node.version } else { 'n/a' }
$osStr   = if ($null -ne $envData) { $envData.os } else { [System.Environment]::OSVersion.VersionString }
$svcMode = if ($null -ne $envData) { $envData.service.mode } else { $chosenMode }
$svcStat = if ($null -ne $envData) { $envData.service.status } else { 'configured' }
$bkOk    = if ($null -ne $envData) { $envData.backend.reachable } else { $false }
$fkOk    = if ($null -ne $envData) { $envData.frontend.reachable } else { $false }
$p3Occ   = if ($null -ne $envData) { $envData.ports.p3000.occupied } else { $false }
$p4Occ   = if ($null -ne $envData) { $envData.ports.p3001.occupied } else { $false }

$reportJson = [PSCustomObject]@{
    timestamp   = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    os          = $osStr
    nodeVersion = $nodeVer
    mode        = $chosenMode
    ports       = [PSCustomObject]@{
        p3000 = [PSCustomObject]@{ occupied = $p3Occ }
        p3001 = [PSCustomObject]@{ occupied = $p4Occ }
    }
    backend     = [PSCustomObject]@{ reachable = $bkOk }
    frontend    = [PSCustomObject]@{ reachable = $fkOk }
    service     = [PSCustomObject]@{ mode = $svcMode; status = $svcStat }
    tray        = [PSCustomObject]@{ enabled = $trayEnabled }
    security    = [PSCustomObject]@{ localOnly = $true }
}

$jsonPath = Join-Path $RuntimeDir 'first-run-report.json'
$txtPath  = Join-Path $LogsDir    'first-run-report.txt'

try {
    $reportJson | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding utf8
    Write-Ok "Rapport JSON : runtime\first-run-report.json"
} catch {
    Write-Warn "Rapport JSON non sauvegarde : $($_.Exception.Message)"
}

$txtLines = @(
    'Sallon-ConnecT v0.4.0 - Rapport premier lancement',
    "Date      : $($reportJson.timestamp)",
    "OS        : $osStr",
    "Node.js   : $nodeVer",
    "Mode      : $($reportJson.mode)",
    "Backend   : $(if ($bkOk) { 'En ligne' } else { 'Non joignable' })",
    "Frontend  : $(if ($fkOk) { 'En ligne' } else { 'Non joignable' })",
    "Service   : $svcMode / $svcStat",
    "Tray      : $(if ($trayEnabled) { 'Actif' } else { 'Inactif' })",
    'LocalOnly : true'
)
try {
    $txtLines | Set-Content -Path $txtPath -Encoding utf8
    Write-Ok 'Rapport TXT  : logs\first-run-report.txt'
} catch {
    Write-Warn "Rapport TXT non sauvegarde : $($_.Exception.Message)"
}

# ---------------------------------------------------------------------------
# Ouvrir le dashboard
# ---------------------------------------------------------------------------
if (-not $Unattended) {
    Write-Host ''
    $openAnswer = Read-Host '  Ouvrir le dashboard maintenant ? [O/N]'
    if ($openAnswer.Trim() -in @('O', 'o', 'oui', 'Oui', 'Y', 'y', 'yes')) {
        Start-Process 'http://localhost:3001'
        Write-Ok 'Dashboard ouvert dans le navigateur.'
    }
} elseif ($OpenDashboard) {
    Start-Process 'http://localhost:3001'
    Write-Ok 'Dashboard ouvert dans le navigateur.'
}

Write-Host ''
Write-Host '  Premier lancement termine. Sallon-ConnecT est pret.' -ForegroundColor Green
Write-Host ''
exit 0
