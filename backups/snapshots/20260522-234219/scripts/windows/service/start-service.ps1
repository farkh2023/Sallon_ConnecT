param(
  [switch]$NoWait
)

$ErrorActionPreference = 'Stop'
$ServiceName = 'SallonConnecT'

function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "FAIL: $M" -ForegroundColor Red; throw $M }

Write-Host ""
Write-Host "== Demarrage service $ServiceName ==" -ForegroundColor Cyan

# Detection mode
$winService    = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
$scheduledTask = Get-ScheduledTask -TaskName $ServiceName -ErrorAction SilentlyContinue

if ($winService) {
  if ($winService.Status -eq 'Running') {
    Write-Ok "Service deja en cours d'execution."
    exit 0
  }
  Write-Host "Demarrage service Windows..."
  Start-Service -Name $ServiceName
  Write-Ok "Commande de demarrage envoyee."

} elseif ($scheduledTask) {
  Write-Host "Demarrage tache planifiee..."
  Start-ScheduledTask -TaskName $ServiceName
  Write-Ok "Commande de demarrage envoyee."

} else {
  Write-Fail "Service '$ServiceName' non installe. Lancer: install-service.ps1"
}

if ($NoWait) { exit 0 }

# Attente demarrage
Write-Host "En attente du backend (port 3000)..."
$maxWait = 20
$ok = $false
for ($i = 0; $i -lt $maxWait; $i++) {
  Start-Sleep -Seconds 1
  try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($r -and $r.StatusCode -eq 200) { $ok = $true; break }
  } catch { }
}

if ($ok) {
  Write-Ok "Backend operationnel sur http://localhost:3000/api/health"
  Write-Host "  Frontend : demarrer manuellement via start-sallon-connect.bat" -ForegroundColor Gray
} else {
  Write-Warn "Backend pas encore pret apres ${maxWait}s. Verifier avec service-status.ps1"
  exit 1
}
