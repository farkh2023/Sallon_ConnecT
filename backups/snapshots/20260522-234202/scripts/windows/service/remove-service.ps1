param(
  [switch]$Force
)

$ErrorActionPreference = 'SilentlyContinue'
$ServiceName = 'SallonConnecT'

function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "FAIL: $M" -ForegroundColor Red; throw $M }

Write-Host ""
Write-Host "== Suppression service $ServiceName ==" -ForegroundColor Cyan

$winService    = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
$scheduledTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue

if (-not $winService -and -not $scheduledTask) {
  Write-Ok "Aucun service ou tache '$ServiceName' a supprimer."
  exit 0
}

# Confirmation
if (-not $Force) {
  Write-Host ""
  Write-Host "  Service/tache a supprimer : $ServiceName" -ForegroundColor Yellow
  Write-Host "  Les donnees (logs/, runtime/, backups/) ne seront PAS supprimees."
  Write-Host ""
  $confirm = Read-Host "  Confirmer la suppression ? (oui/non)"
  if ($confirm -notin @('oui', 'o', 'yes', 'y')) {
    Write-Host "Suppression annulee." -ForegroundColor Gray
    exit 0
  }
}

# Arret propre avant suppression
if ($winService) {
  if ($winService.Status -eq 'Running') {
    Write-Host "Arret service en cours..."
    Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
  }
}
if ($scheduledTask) {
  $state = $scheduledTask.State
  if ($state -eq 'Running') {
    Write-Host "Arret tache en cours..."
    Stop-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
}

# Suppression Windows Service (NSSM)
if ($winService) {
  # Chercher NSSM
  $NssmPaths = @(
    'C:\Program Files\NSSM\nssm.exe',
    'C:\Program Files (x86)\NSSM\nssm.exe',
    'C:\ProgramData\chocolatey\bin\nssm.exe',
    'C:\tools\nssm\nssm.exe'
  )
  $NssmExe = $null
  foreach ($p in $NssmPaths) {
    if (Test-Path $p) { $NssmExe = $p; break }
  }
  if (-not $NssmExe) {
    $nssmCmd = Get-Command 'nssm.exe' -ErrorAction SilentlyContinue
    if ($nssmCmd) { $NssmExe = $nssmCmd.Source }
  }

  if ($NssmExe) {
    & $NssmExe remove $ServiceName confirm 2>$null
    Start-Sleep -Seconds 1
  } else {
    # Fallback sc.exe
    & sc.exe delete $ServiceName 2>$null
    Start-Sleep -Seconds 1
  }

  $remaining = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if (-not $remaining) {
    Write-Ok "Service Windows '$ServiceName' supprime."
  } else {
    Write-Warn "Service pas encore supprime. Il sera supprime au prochain redemarrage Windows."
  }
}

# Suppression Task Scheduler
if ($scheduledTask) {
  Unregister-ScheduledTask -TaskName $ServiceName -Confirm:$false -ErrorAction SilentlyContinue
  $remaining = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
  if (-not $remaining) {
    Write-Ok "Tache planifiee '$ServiceName' supprimee."
  } else {
    Write-Warn "Tache pas completement supprimee. Verifier dans Gestionnaire de taches."
  }
}

Write-Host ""
Write-Host "Les donnees locales (logs/, runtime/, backups/, .env) sont conservees." -ForegroundColor Gray
Write-Host "Pour supprimer le dossier application : utiliser le desinstallateur." -ForegroundColor Gray
Write-Host ""
Write-Ok "Suppression terminee."
