param(
  [switch]$NoOpen
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Frontend = Join-Path $Root 'frontend'
$Logs = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

New-Item -Path $Logs -ItemType Directory -Force | Out-Null

function Get-ListeningPid {
  param([int]$Port)
  $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)

  if ($pids.Count -eq 0) {
    $pids = @(
      netstat -ano |
        Select-String -Pattern "[:.]$Port\s+.*LISTENING\s+\d+$" |
        ForEach-Object { ($_ -split '\s+')[-1] } |
        Sort-Object -Unique
    )
  }

  $pids
}

function Start-AppProcess {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [string]$LogPrefix
  )

  $outLog = Join-Path $Logs "$LogPrefix-$Stamp.log"
  $errLog = Join-Path $Logs "$LogPrefix-$Stamp.err.log"

  $process = Start-Process -FilePath 'npm.cmd' `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  Write-Host "$Name demarre (PID $($process.Id)). Logs: logs/$LogPrefix-$Stamp.log"
}

$backendPids = Get-ListeningPid -Port 3000
if ($backendPids.Count -gt 0) {
  Write-Host "Backend deja actif sur http://localhost:3000 (PID: $($backendPids -join ', '))."
}
else {
  Start-AppProcess -Name 'Backend Express' -WorkingDirectory $Root -Arguments @('start') -LogPrefix 'backend'
}

$frontendPids = Get-ListeningPid -Port 3001
if ($frontendPids.Count -gt 0) {
  Write-Host "Frontend Next deja actif sur http://localhost:3001 (PID: $($frontendPids -join ', '))."
}
else {
  Start-AppProcess -Name 'Frontend Next.js' -WorkingDirectory $Frontend -Arguments @('run', 'dev', '--', '--port', '3001') -LogPrefix 'frontend'
}

Write-Host ""
Write-Host "URLs Sallon-ConnecT" -ForegroundColor Cyan
Write-Host "Backend          : http://localhost:3000"
Write-Host "Ancien frontend  : http://localhost:3000"
Write-Host "Frontend Next    : http://localhost:3001"
Write-Host ""
Write-Host "Les fichiers .env et secrets ne sont pas affiches par ces scripts."

if (-not $NoOpen) {
  Start-Sleep -Seconds 2
  Start-Process 'http://localhost:3001'
}
