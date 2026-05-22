param(
  [switch]$Json
)

$ErrorActionPreference = 'SilentlyContinue'

$PidFile  = Join-Path $env:TEMP 'SallonConnecT-Tray.pid'
$trayPid  = 0
$running  = $false
$memoryMb = 0

if (Test-Path $PidFile) {
    try { $trayPid = [int](Get-Content $PidFile -Raw -ErrorAction SilentlyContinue) } catch { }
    if ($trayPid -gt 0) {
        $proc = Get-Process -Id $trayPid -ErrorAction SilentlyContinue
        if ($proc) {
            $running  = $true
            $memoryMb = [Math]::Round($proc.WorkingSet64 / 1MB, 1)
        }
    }
}

if ($Json) {
    [PSCustomObject]@{
        running   = $running
        pid       = if ($running) { $trayPid } else { $null }
        memoryMb  = if ($running) { $memoryMb } else { $null }
        pidFile   = $PidFile
    } | ConvertTo-Json
    exit $(if ($running) { 0 } else { 1 })
}

Write-Host ""
Write-Host "== Statut tray Sallon-ConnecT ==" -ForegroundColor Cyan
if ($running) {
    Write-Host "  Etat   : EN COURS" -ForegroundColor Green
    Write-Host "  PID    : $trayPid"
    Write-Host "  Mem.   : $memoryMb MB"
    Write-Host "  Arreter: scripts\windows\tray\stop-tray.ps1"
} else {
    Write-Host "  Etat   : ARRETE" -ForegroundColor Yellow
    Write-Host "  Lancer : scripts\windows\tray\start-tray.ps1"
}
Write-Host ""

exit $(if ($running) { 0 } else { 1 })
