param(
  [switch]$UseTaskScheduler,
  [switch]$Unattended,
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root        = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$LogsDir     = Join-Path $Root 'logs'
$ServiceName = 'SallonConnecT'
$ServerJs    = Join-Path $Root 'server.js'

New-Item -Path $LogsDir -ItemType Directory -Force | Out-Null

function Write-Step { param([string]$M) Write-Host ""; Write-Host "== $M ==" -ForegroundColor Cyan }
function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "FAIL: $M" -ForegroundColor Red; throw $M }

Write-Host ""
Write-Host "Sallon-ConnecT - Installation service Windows" -ForegroundColor White
Write-Host "Date   : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "Racine : $Root"
Write-Host "Mode   : $(if ($UseTaskScheduler) { 'Task Scheduler (sans admin)' } else { 'NSSM (service Windows)' })"

# ---------------------------------------------------------------------------
# Verifications prealables
# ---------------------------------------------------------------------------
Write-Step 'Pre-requis'

# Node.js
$nodeCmd = Get-Command 'node.exe' -ErrorAction SilentlyContinue
if (-not $nodeCmd) { Write-Fail 'Node.js introuvable dans PATH. Installez Node.js >= 22.13.0.' }
$NodeExe    = $nodeCmd.Source
$nodeRaw    = (& node --version).Trim()
$nodeParts  = @($nodeRaw.TrimStart('v').Split('.') | ForEach-Object { [int]$_ })
if ($nodeParts[0] -lt 22 -or ($nodeParts[0] -eq 22 -and $nodeParts[1] -lt 13)) {
  Write-Warn "Node $nodeRaw detecte. Node >= 22.13.0 recommande."
} else {
  Write-Ok "Node $nodeRaw"
}

# server.js
if (-not (Test-Path $ServerJs)) { Write-Fail "server.js introuvable : $ServerJs" }
Write-Ok "server.js present"

# Service deja installe ?
$existingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
$existingTask    = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
if ($existingService -or $existingTask) {
  Write-Warn "Service ou tache '$ServiceName' deja installe."
  if (-not $Unattended) {
    Write-Host "  Relancer avec : remove-service.ps1 avant de reinstaller." -ForegroundColor Yellow
    Write-Host "  Ou : install-service.ps1 -UseTaskScheduler pour changer de mode."
    exit 0
  }
}

# ---------------------------------------------------------------------------
# Mode Task Scheduler (sans admin)
# ---------------------------------------------------------------------------
if ($UseTaskScheduler) {
  Write-Step 'Installation Task Scheduler (logon utilisateur)'

  $action   = New-ScheduledTaskAction -Execute $NodeExe -Argument '"server.js"' -WorkingDirectory $Root
  $trigger  = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
  $settings = New-ScheduledTaskSettingsSet `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Hours 0)

  $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

  $taskDesc = 'Sallon-ConnecT backend local - demarre automatiquement a la session'
  Register-ScheduledTask `
    -TaskName $ServiceName `
    -Description $taskDesc `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -Principal $principal `
    -Force | Out-Null

  Write-Ok "Tache '$ServiceName' enregistree."
  Write-Ok "Demarrage automatique a la session."
  Write-Ok "Redemarrage automatique sur erreur (3 tentatives, delai 1 min)."

  if (-not $SkipTests) {
    Write-Step 'Demarrage test'
    Start-ScheduledTask -TaskName $ServiceName
    Start-Sleep -Seconds 4
    $t = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
    if ($t -and $t.State -ne 'Disabled') {
      Write-Ok "Tache active."
    }
    try {
      $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
      if ($r.StatusCode -eq 200) { Write-Ok "Backend repond sur http://localhost:3000/api/health" }
    } catch {
      Write-Warn "Backend pas encore pret (normal si premier demarrage). Verifier dans 10s."
    }
  }

  Write-Host ""
  Write-Host "Service installe (Task Scheduler)." -ForegroundColor Green
  Write-Host "  Statut : scripts\windows\service\service-status.ps1"
  Write-Host "  Arreter: scripts\windows\service\stop-service.ps1"
  Write-Host "  Suppr. : scripts\windows\service\remove-service.ps1"
  exit 0
}

# ---------------------------------------------------------------------------
# Mode NSSM (service Windows - admin requis)
# ---------------------------------------------------------------------------
Write-Step 'Verification droits admin'

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Host ""
  Write-Host "NSSM requiert des droits administrateur." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Options disponibles :"
  Write-Host "  1) Relancer en tant qu'administrateur :"
  Write-Host "     Start-Process powershell -Verb RunAs -ArgumentList '-File scripts\windows\service\install-service.ps1'"
  Write-Host ""
  Write-Host "  2) Utiliser Task Scheduler (sans admin, demarre a l'ouverture de session) :"
  Write-Host "     powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1 -UseTaskScheduler"
  Write-Host ""
  if (-not $Unattended) { exit 1 }
  Write-Warn "Mode non-admin detecte. Basculement sur Task Scheduler."
  & $MyInvocation.MyCommand.Path -UseTaskScheduler -Unattended:$Unattended -SkipTests:$SkipTests
  exit 0
}

Write-Ok "Droits admin confirmes."

# Localiser NSSM
Write-Step 'Localisation NSSM'

$NssmPaths = @(
  'C:\Program Files\NSSM\nssm.exe',
  'C:\Program Files (x86)\NSSM\nssm.exe',
  'C:\ProgramData\chocolatey\bin\nssm.exe',
  'C:\tools\nssm\nssm.exe',
  'C:\Windows\System32\nssm.exe'
)
$NssmExe = $null
foreach ($p in $NssmPaths) {
  if (Test-Path $p) { $NssmExe = $p; break }
}
if (-not $NssmExe) {
  $nssmCmd = Get-Command 'nssm.exe' -ErrorAction SilentlyContinue
  if ($nssmCmd) { $NssmExe = $nssmCmd.Source }
}

if (-not $NssmExe) {
  Write-Host ""
  Write-Host "======================================================================"
  Write-Host "NSSM NON INSTALLE" -ForegroundColor Yellow
  Write-Host "======================================================================"
  Write-Host ""
  Write-Host "NSSM (Non-Sucking Service Manager) est requis pour installer"
  Write-Host "le backend Node.js comme service Windows avec redemarrage automatique."
  Write-Host ""
  Write-Host "Installation via Chocolatey (recommande) :"
  Write-Host "  choco install nssm" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Installation via winget :"
  Write-Host "  winget install NSSM.NSSM" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "Telechargement manuel :"
  Write-Host "  https://nssm.cc/download" -ForegroundColor Cyan
  Write-Host "  Extraire nssm.exe dans C:\Program Files\NSSM\"
  Write-Host ""
  Write-Host "Alternative sans admin (Task Scheduler) :"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1 -UseTaskScheduler"
  Write-Host ""
  Write-Host "Apres installation de NSSM, relancer :"
  Write-Host "  powershell -ExecutionPolicy Bypass -File scripts\windows\service\install-service.ps1"
  Write-Host "======================================================================"
  exit 0
}

Write-Ok "NSSM trouve : $NssmExe"

# Supprimer ancien service si present
if ($existingService) {
  Write-Step 'Suppression ancien service'
  & $NssmExe stop $ServiceName 2>$null
  & $NssmExe remove $ServiceName confirm 2>$null
  Start-Sleep -Seconds 2
  Write-Ok "Ancien service supprime."
}

# ---------------------------------------------------------------------------
# Installation service NSSM
# ---------------------------------------------------------------------------
Write-Step "Installation service '$ServiceName'"

& $NssmExe install $ServiceName $NodeExe $ServerJs
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne 5) { Write-Fail "nssm install echoue (code $LASTEXITCODE)." }

& $NssmExe set $ServiceName AppDirectory $Root
& $NssmExe set $ServiceName DisplayName 'Sallon-ConnecT'
& $NssmExe set $ServiceName Description 'Sallon-ConnecT hub local — backend Node.js'

# Demarrage automatique
& $NssmExe set $ServiceName Start SERVICE_AUTO_START

# Redemarrage sur crash : delai 10s, max 3 redemarrages par heure
& $NssmExe set $ServiceName AppThrottle 10000
& $NssmExe set $ServiceName AppRestartDelay 5000
& $NssmExe set $ServiceName AppExit Default Restart

# Logs service
$LogStdout = Join-Path $LogsDir 'service-stdout.log'
$LogStderr = Join-Path $LogsDir 'service-stderr.log'
& $NssmExe set $ServiceName AppStdout $LogStdout
& $NssmExe set $ServiceName AppStderr $LogStderr
& $NssmExe set $ServiceName AppStdoutCreationDisposition 4
& $NssmExe set $ServiceName AppStderrCreationDisposition 4
& $NssmExe set $ServiceName AppTimestampLog 1

# Compte : LocalSystem (acces aux fichiers locaux de l'utilisateur installe)
& $NssmExe set $ServiceName ObjectName LocalSystem

# Variables d'environnement minimal
& $NssmExe set $ServiceName AppEnvironmentExtra "NODE_ENV=production"

Write-Ok "Service '$ServiceName' configure."

# ---------------------------------------------------------------------------
# Demarrage et verification
# ---------------------------------------------------------------------------
if (-not $SkipTests) {
  Write-Step 'Demarrage et verification'
  & $NssmExe start $ServiceName
  if ($LASTEXITCODE -ne 0) { Write-Warn "nssm start a retourne le code $LASTEXITCODE (peut etre deja demarre)." }

  $maxWait = 15
  $ok = $false
  for ($i = 0; $i -lt $maxWait; $i++) {
    Start-Sleep -Seconds 1
    try {
      $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
      if ($r -and $r.StatusCode -eq 200) { $ok = $true; break }
    } catch { }
  }
  if ($ok) {
    Write-Ok "Backend repond sur http://localhost:3000/api/health"
  } else {
    Write-Warn "Backend pas encore pret apres ${maxWait}s. Verifier avec service-status.ps1"
  }
}

Write-Host ""
Write-Host "Service Windows installe et demarre." -ForegroundColor Green
Write-Host "  Nom     : $ServiceName"
Write-Host "  Logs    : logs\service-stdout.log"
Write-Host "  Statut  : scripts\windows\service\service-status.ps1"
Write-Host "  Arreter : scripts\windows\service\stop-service.ps1"
Write-Host "  Suppr.  : scripts\windows\service\remove-service.ps1"
