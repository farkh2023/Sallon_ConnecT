param(
  [switch]$Json,
  [string]$RootPath = ''
)

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if ($RootPath -eq '') {
    $RootPath = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Get-PortInfo {
    param([int]$Port)
    $conn = $null
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
                Select-Object -First 1
    } catch { }
    if ($conn) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        [PSCustomObject]@{
            occupied = $true
            pid      = $conn.OwningProcess
            name     = if ($proc) { $proc.Name } else { 'unknown' }
        }
    } else {
        [PSCustomObject]@{ occupied = $false; pid = $null; name = $null }
    }
}

function Test-LocalUrl {
    param([string]$Url)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Test-NodeVersionOk {
    param([string]$Raw)
    $clean = ($Raw -replace '^v', '' -replace '-.*$', '').Trim()
    try {
        $parts = $clean -split '\.'
        $major = [int]$parts[0]
        $minor = [int]$parts[1]
        return ($major -gt 22) -or ($major -eq 22 -and $minor -ge 13)
    } catch { return $false }
}

# ---------------------------------------------------------------------------
# Node.js
# ---------------------------------------------------------------------------
$nodeOk      = $false
$nodeVersion = 'absent'
$nodeCmd     = Get-Command 'node.exe' -ErrorAction SilentlyContinue
if (-not $nodeCmd) { $nodeCmd = Get-Command 'node' -ErrorAction SilentlyContinue }
if ($nodeCmd) {
    try {
        $raw = & node.exe --version
        if (-not $raw) { $raw = & node --version }
        if ($raw) {
            $nodeVersion = ($raw -replace '^v', '').Trim()
            $nodeOk      = Test-NodeVersionOk -Raw $raw
        }
    } catch { }
}

# ---------------------------------------------------------------------------
# npm
# ---------------------------------------------------------------------------
$npmCmd = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
if (-not $npmCmd) { $npmCmd = Get-Command 'npm' -ErrorAction SilentlyContinue }
$npmOk  = ($null -ne $npmCmd)

# ---------------------------------------------------------------------------
# Ports
# ---------------------------------------------------------------------------
$port3000 = Get-PortInfo -Port 3000
$port3001 = Get-PortInfo -Port 3001

# ---------------------------------------------------------------------------
# Backend / Frontend / SSE
# ---------------------------------------------------------------------------
$backendOk  = Test-LocalUrl 'http://localhost:3000/api/health'
$frontendOk = Test-LocalUrl 'http://localhost:3001'
$sseOk      = Test-LocalUrl 'http://localhost:3000/api/events/client-count'

# ---------------------------------------------------------------------------
# Service Windows (NSSM ou Task Scheduler)
# ---------------------------------------------------------------------------
$serviceMode   = 'none'
$serviceStatus = 'stopped'
$svc = Get-Service -Name 'SallonConnecT' -ErrorAction SilentlyContinue
if ($svc) {
    $serviceMode   = 'nssm'
    $serviceStatus = $svc.Status.ToString().ToLower()
} else {
    $task = Get-ScheduledTask -TaskName 'SallonConnecT' -ErrorAction SilentlyContinue
    if ($task) {
        $serviceMode   = 'task-scheduler'
        $serviceStatus = $task.State.ToString().ToLower()
    }
}

# ---------------------------------------------------------------------------
# Tray
# ---------------------------------------------------------------------------
$trayPidFile = Join-Path $env:TEMP 'SallonConnecT-Tray.pid'
$trayRunning = $false
if (Test-Path $trayPidFile) {
    $trayPidVal = 0
    try { $trayPidVal = [int](Get-Content $trayPidFile -Raw -ErrorAction SilentlyContinue) } catch { }
    if ($trayPidVal -gt 0) {
        $trayProc    = Get-Process -Id $trayPidVal -ErrorAction SilentlyContinue
        $trayRunning = ($null -ne $trayProc)
    }
}

# ---------------------------------------------------------------------------
# Dossiers
# ---------------------------------------------------------------------------
$runtimeOk = Test-Path (Join-Path $RootPath 'runtime')
$logsOk    = Test-Path (Join-Path $RootPath 'logs')
$backupsOk = Test-Path (Join-Path $RootPath 'backups')

# ---------------------------------------------------------------------------
# OS / droits admin
# ---------------------------------------------------------------------------
$osInfo  = [System.Environment]::OSVersion.VersionString
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
             [Security.Principal.WindowsBuiltInRole]::Administrator)

# ---------------------------------------------------------------------------
# Resultat structure
# ---------------------------------------------------------------------------
$result = [PSCustomObject]@{
    timestamp = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    os        = $osInfo
    isAdmin   = $isAdmin
    node      = [PSCustomObject]@{ ok = $nodeOk; version = $nodeVersion }
    npm       = [PSCustomObject]@{ ok = $npmOk }
    ports     = [PSCustomObject]@{ p3000 = $port3000; p3001 = $port3001 }
    backend   = [PSCustomObject]@{ reachable = $backendOk }
    frontend  = [PSCustomObject]@{ reachable = $frontendOk }
    sse       = [PSCustomObject]@{ reachable = $sseOk }
    service   = [PSCustomObject]@{ mode = $serviceMode; status = $serviceStatus }
    tray      = [PSCustomObject]@{ running = $trayRunning }
    folders   = [PSCustomObject]@{ runtime = $runtimeOk; logs = $logsOk; backups = $backupsOk }
    security  = [PSCustomObject]@{ localOnly = $true }
}

if ($Json) {
    $result | ConvertTo-Json -Depth 5
    exit $(if ($nodeOk) { 0 } else { 1 })
}

# ---------------------------------------------------------------------------
# Affichage lisible
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '== Diagnostic environnement Sallon-ConnecT ==' -ForegroundColor Cyan
Write-Host "  Date      : $($result.timestamp)"
Write-Host "  OS        : $osInfo"
Write-Host "  Admin     : $(if ($isAdmin) { 'Oui' } else { 'Non' })"
Write-Host ''

$nc = if ($nodeOk) { 'Green' } else { 'Red' }
Write-Host "  Node.js   : $(if ($nodeOk) { "OK ($nodeVersion)" } else { "ABSENT ou trop ancien ($nodeVersion) - requis 22.13.0+" })" -ForegroundColor $nc

$nc2 = if ($npmOk) { 'Green' } else { 'Red' }
Write-Host "  npm       : $(if ($npmOk) { 'OK' } else { 'ABSENT' })" -ForegroundColor $nc2
Write-Host ''

$p3c = if (-not $port3000.occupied -or $backendOk) { 'Green' } else { 'Yellow' }
Write-Host "  Port 3000 : $(if ($port3000.occupied) { "Occupe (PID $($port3000.pid) - $($port3000.name))" } else { 'Libre' })" -ForegroundColor $p3c

$p4c = if (-not $port3001.occupied -or $frontendOk) { 'Green' } else { 'Yellow' }
Write-Host "  Port 3001 : $(if ($port3001.occupied) { "Occupe (PID $($port3001.pid) - $($port3001.name))" } else { 'Libre' })" -ForegroundColor $p4c

$bc = if ($backendOk) { 'Green' } else { 'Yellow' }
Write-Host "  Backend   : $(if ($backendOk) { 'En ligne' } else { 'Non joignable' })" -ForegroundColor $bc

$fc = if ($frontendOk) { 'Green' } else { 'Yellow' }
Write-Host "  Frontend  : $(if ($frontendOk) { 'En ligne' } else { 'Non joignable' })" -ForegroundColor $fc

$sc2 = if ($sseOk) { 'Green' } else { 'Yellow' }
Write-Host "  SSE       : $(if ($sseOk) { 'OK' } else { 'Non joignable' })" -ForegroundColor $sc2
Write-Host ''

$svc2 = if ($serviceMode -ne 'none') { 'Green' } else { 'Yellow' }
Write-Host "  Service   : $serviceMode / $serviceStatus" -ForegroundColor $svc2

$tc = if ($trayRunning) { 'Green' } else { 'Yellow' }
Write-Host "  Tray      : $(if ($trayRunning) { 'Actif' } else { 'Arrete' })" -ForegroundColor $tc
Write-Host ''

$dc = if ($runtimeOk -and $logsOk -and $backupsOk) { 'Green' } else { 'Yellow' }
$dMsg = "runtime=$(if ($runtimeOk) { 'OK' } else { 'ABSENT' })  logs=$(if ($logsOk) { 'OK' } else { 'ABSENT' })  backups=$(if ($backupsOk) { 'OK' } else { 'ABSENT' })"
Write-Host "  Dossiers  : $dMsg" -ForegroundColor $dc
Write-Host '  LocalOnly : true' -ForegroundColor Green
Write-Host ''

exit $(if ($nodeOk) { 0 } else { 1 })
