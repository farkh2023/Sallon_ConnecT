param(
  [switch]$Json
)

$ErrorActionPreference = 'SilentlyContinue'

$ServiceName = 'SallonConnecT'
$result      = [ordered]@{
  timestamp   = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')
  name        = $ServiceName
  mode        = 'none'
  status      = 'stopped'
  uptime      = 0
  pid         = $null
  lastStart   = $null
  restartCount = $null
  logStdout   = $null
  logStderr   = $null
  backend3000 = $false
  message     = ''
}

function Write-StatusLine {
  param([string]$Label, [string]$Value, [string]$Color = 'White')
  Write-Host ("  {0,-22} {1}" -f "${Label}:", $Value) -ForegroundColor $Color
}

# ---------------------------------------------------------------------------
# Detection du mode
# ---------------------------------------------------------------------------
$winService  = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
$scheduledTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue

if ($winService) {
  $result.mode = 'nssm'

  $statusStr = $winService.Status.ToString().ToLower()
  $result.status = $statusStr

  # Uptime via processus
  $svcProcess = $null
  try {
    $wmiSvc = Get-WmiObject Win32_Service -Filter "Name='$ServiceName'" -ErrorAction SilentlyContinue
    if ($wmiSvc -and $wmiSvc.ProcessId -gt 0) {
      $result.pid = $wmiSvc.ProcessId
      $proc = Get-Process -Id $wmiSvc.ProcessId -ErrorAction SilentlyContinue
      if ($proc) {
        $result.uptime    = [Math]::Floor(((Get-Date) - $proc.StartTime).TotalSeconds)
        $result.lastStart = $proc.StartTime.ToString('yyyy-MM-ddTHH:mm:ss')
        $svcProcess       = $proc
      }
    }
  } catch { }

  # Logs NSSM
  $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
  $Root = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
  $LogStdout = Join-Path $Root 'logs\service-stdout.log'
  $LogStderr = Join-Path $Root 'logs\service-stderr.log'
  if (Test-Path $LogStdout) { $result.logStdout = $LogStdout }
  if (Test-Path $LogStderr) { $result.logStderr = $LogStderr }

  # Restart count (Windows Event Log)
  try {
    $events = Get-WinEvent -FilterHashtable @{ LogName='System'; Id=7036; ProviderName='Service Control Manager' } -MaxEvents 50 -ErrorAction SilentlyContinue |
      Where-Object { $_.Message -like "*$ServiceName*" -and $_.Message -like '*en cours d*execution*' }
    if ($events) { $result.restartCount = $events.Count - 1 }
  } catch { }

  if ($result.status -ne 'running') { $result.message = "Service arrete. Lancer: start-service.ps1" }

} elseif ($scheduledTask) {
  $result.mode   = 'task-scheduler'
  $taskState     = $scheduledTask.State.ToString().ToLower()
  $result.status = if ($taskState -eq 'running') { 'running' } elseif ($taskState -eq 'ready') { 'stopped' } else { $taskState }

  # PID via port 3000
  $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn -and $conn.OwningProcess -gt 0) {
    $result.pid = $conn.OwningProcess
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
      $result.uptime    = [Math]::Floor(((Get-Date) - $proc.StartTime).TotalSeconds)
      $result.lastStart = $proc.StartTime.ToString('yyyy-MM-ddTHH:mm:ss')
    }
  }

  if ($result.status -eq 'stopped') { $result.message = "Tache en attente. Lancer: start-service.ps1" }

} else {
  $result.mode = 'standalone'

  # Verifier si backend tourne en standalone (port 3000)
  $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn -and $conn.OwningProcess -gt 0) {
    $result.status = 'running'
    $result.pid    = $conn.OwningProcess
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
      $result.uptime    = [Math]::Floor(((Get-Date) - $proc.StartTime).TotalSeconds)
      $result.lastStart = $proc.StartTime.ToString('yyyy-MM-ddTHH:mm:ss')
    }
  } else {
    $result.status  = 'stopped'
    $result.message = "Pas de service configure. Voir: install-service.ps1"
  }
}

# ---------------------------------------------------------------------------
# Health check HTTP
# ---------------------------------------------------------------------------
try {
  $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 3 -ErrorAction SilentlyContinue
  $result.backend3000 = ($r -and $r.StatusCode -eq 200)
} catch { $result.backend3000 = $false }

if ($result.status -eq 'running' -and -not $result.backend3000) {
  $result.status  = 'degraded'
  $result.message = "Processus actif mais /api/health ne repond pas."
}

# ---------------------------------------------------------------------------
# Sortie
# ---------------------------------------------------------------------------
if ($Json) {
  $result | ConvertTo-Json -Depth 3
  exit 0
}

$statusColor = switch ($result.status) {
  'running'  { 'Green' }
  'stopped'  { 'Yellow' }
  'degraded' { 'Red' }
  default    { 'Gray' }
}
$modeLabel = switch ($result.mode) {
  'nssm'           { 'Service Windows (NSSM)' }
  'task-scheduler' { 'Tache planifiee (Task Scheduler)' }
  'standalone'     { 'Standalone (manuel)' }
  default          { 'Non configure' }
}

Write-Host ""
Write-Host "== Statut service Sallon-ConnecT ==" -ForegroundColor Cyan
Write-Host ""
Write-StatusLine 'Mode'    $modeLabel
Write-StatusLine 'Statut'  ($result.status).ToUpper() $statusColor
Write-StatusLine 'PID'     $(if ($result.pid) { $result.pid } else { 'n/a' })
Write-StatusLine 'Uptime'  $(if ($result.uptime -gt 0) { "$([Math]::Floor($result.uptime / 60)) min $($result.uptime % 60) sec" } else { 'n/a' })
Write-StatusLine 'Dernier demarrage' $(if ($result.lastStart) { $result.lastStart } else { 'n/a' })
Write-StatusLine 'Redemarrages'      $(if ($null -ne $result.restartCount) { $result.restartCount } else { 'n/a' })
Write-StatusLine 'Health /api/health' $(if ($result.backend3000) { 'OK' } else { 'NON' }) $(if ($result.backend3000) { 'Green' } else { 'Red' })
if ($result.logStdout) { Write-StatusLine 'Log stdout' $result.logStdout }
if ($result.logStderr) { Write-StatusLine 'Log stderr' $result.logStderr }
if ($result.message)   { Write-Host "  Note : $($result.message)" -ForegroundColor Yellow }
Write-Host ""

exit $(if ($result.status -eq 'running') { 0 } else { 1 })
