param()

$ErrorActionPreference = 'Stop'
$ServiceName = 'SallonConnecT'
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "FAIL: $M" -ForegroundColor Red; throw $M }

Write-Host ""
Write-Host "== Redemarrage service $ServiceName ==" -ForegroundColor Cyan

# Arret
Write-Host "Etape 1/2 : arret..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ScriptDir 'stop-service.ps1') -Force
if ($LASTEXITCODE -ne 0) {
  Write-Warn "Arret retourne code $LASTEXITCODE (continue quand meme)."
}

Start-Sleep -Seconds 2

# Demarrage
Write-Host "Etape 2/2 : demarrage..."
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ScriptDir 'start-service.ps1')
if ($LASTEXITCODE -ne 0) {
  Write-Fail "Demarrage echoue (code $LASTEXITCODE)."
}

Write-Ok "Redemarrage termine."
