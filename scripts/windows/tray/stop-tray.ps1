param()

$ErrorActionPreference = 'SilentlyContinue'

$PidFile = Join-Path $env:TEMP 'SallonConnecT-Tray.pid'

function Write-Ok   { param([string]$M) Write-Host "OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "WARN: $M" -ForegroundColor Yellow }

Write-Host ""
Write-Host "== Arret tray Sallon-ConnecT ==" -ForegroundColor Cyan

if (-not (Test-Path $PidFile)) {
    Write-Ok "Tray non actif (PID file absent)."
    exit 0
}

$trayPid = 0
try { $trayPid = [int](Get-Content $PidFile -Raw -ErrorAction SilentlyContinue) } catch { }

if ($trayPid -le 0) {
    Write-Ok "Tray non actif (PID invalide)."
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    exit 0
}

$proc = Get-Process -Id $trayPid -ErrorAction SilentlyContinue
if (-not $proc) {
    Write-Ok "Tray non actif (processus $trayPid introuvable)."
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    exit 0
}

Stop-Process -Id $trayPid -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

$stillRunning = Get-Process -Id $trayPid -ErrorAction SilentlyContinue
if ($stillRunning) {
    Write-Warn "Processus $trayPid toujours actif. Tentative forcee..."
    Stop-Process -Id $trayPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
Write-Ok "Tray arrete (PID $trayPid)."
