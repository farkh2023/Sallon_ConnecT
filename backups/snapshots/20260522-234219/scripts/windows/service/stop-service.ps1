param(
  [switch]$Force
)

$ErrorActionPreference = 'SilentlyContinue'
$ServiceName = 'SallonConnecT'

function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }

Write-Host ""
Write-Host "== Arret service $ServiceName ==" -ForegroundColor Cyan

$winService    = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
$scheduledTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue

$stopped = $false

if ($winService) {
  if ($winService.Status -eq 'Stopped') {
    Write-Ok "Service deja arrete."
    exit 0
  }
  Write-Host "Arret service Windows '$ServiceName'..."
  Stop-Service -Name $ServiceName -Force:$Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 2
  $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
  if ($svc -and $svc.Status -eq 'Stopped') {
    Write-Ok "Service arrete."
    $stopped = $true
  } else {
    Write-Warn "Service pas encore arrete. Tentative forcee..."
    $wmiSvc = Get-WmiObject Win32_Service -Filter "Name='$ServiceName'" -ErrorAction SilentlyContinue
    if ($wmiSvc -and $wmiSvc.ProcessId -gt 0) {
      Stop-Process -Id $wmiSvc.ProcessId -Force -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 1
      Write-Ok "Processus termine."
      $stopped = $true
    }
  }

} elseif ($scheduledTask) {
  Write-Host "Arret tache planifiee '$ServiceName'..."
  Stop-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 1
  Write-Ok "Tache arretee."
  $stopped = $true

} else {
  # Standalone : tuer par port
  Write-Host "Mode standalone : arret par port 3000..."
  $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn -and $conn.OwningProcess -gt 0) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Ok "Processus port 3000 arrete."
    $stopped = $true
  } else {
    Write-Ok "Aucun processus en ecoute sur le port 3000."
    $stopped = $true
  }
}

# Verification finale port 3000
Start-Sleep -Seconds 1
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
  Write-Warn "Port 3000 encore occupe (PID $($conn.OwningProcess)). Verifier manuellement."
  exit 1
} else {
  Write-Ok "Port 3000 libere."
}

exit 0
