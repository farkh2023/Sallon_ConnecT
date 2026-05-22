param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$TrayScript = Join-Path $ScriptDir 'Sallon-ConnecT-Tray.ps1'
$PidFile    = Join-Path $env:TEMP 'SallonConnecT-Tray.pid'

# Verifier si deja en cours
if (-not $Force -and (Test-Path $PidFile)) {
    $existingPid = 0
    try { $existingPid = [int](Get-Content $PidFile -Raw -ErrorAction SilentlyContinue) } catch { }
    if ($existingPid -gt 0) {
        $existingProc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProc) {
            Write-Host "Tray deja en cours (PID $existingPid)." -ForegroundColor Yellow
            Write-Host "  Arreter : scripts\windows\tray\stop-tray.ps1"
            exit 0
        }
    }
    Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

if (-not (Test-Path $TrayScript)) {
    Write-Host "FAIL: Script tray introuvable : $TrayScript" -ForegroundColor Red
    exit 1
}

Write-Host "Lancement du tray Sallon-ConnecT..." -ForegroundColor Cyan

$psArgs = @(
    '-NoProfile',
    '-ExecutionPolicy', 'Bypass',
    '-WindowStyle', 'Hidden',
    '-File', $TrayScript
)

$proc = Start-Process powershell.exe -ArgumentList $psArgs -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 1

if ($proc -and $proc.Id -gt 0) {
    Write-Host "OK: Tray demarre (PID $($proc.Id))." -ForegroundColor Green
    Write-Host "  Statut : scripts\windows\tray\tray-status.ps1"
    Write-Host "  Arreter: scripts\windows\tray\stop-tray.ps1"
} else {
    Write-Host "WARN: Demarrage du tray incertain. Verifier avec tray-status.ps1" -ForegroundColor Yellow
}
