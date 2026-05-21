param(
  [switch]$NoOpen,
  [switch]$SkipInstall,
  [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$Frontend = Join-Path $Root 'frontend'
$Logs = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'

New-Item -Path $Logs -ItemType Directory -Force | Out-Null
foreach ($dir in @('runtime', 'backups', 'dist')) {
  New-Item -Path (Join-Path $Root $dir) -ItemType Directory -Force | Out-Null
}

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

function Invoke-Npm {
  param(
    [string]$WorkingDirectory,
    [string[]]$Arguments
  )
  $process = Start-Process -FilePath 'npm.cmd' -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -Wait -PassThru -NoNewWindow
  if ($process.ExitCode -ne 0) {
    throw "npm $($Arguments -join ' ') a echoue dans $WorkingDirectory."
  }
}

function Start-AppProcess {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Arguments,
    [string]$LogPrefix
  )

  $outLog = Join-Path $Logs "$LogPrefix-release-$Stamp.log"
  $errLog = Join-Path $Logs "$LogPrefix-release-$Stamp.err.log"

  $process = Start-Process -FilePath 'npm.cmd' `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -WindowStyle Hidden `
    -RedirectStandardOutput $outLog `
    -RedirectStandardError $errLog `
    -PassThru

  Write-Host "$Name demarre (PID $($process.Id)). Logs: logs/$LogPrefix-release-$Stamp.log"
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Node.js est requis. Installez Node >=22.13.0 avant de lancer la release.'
}

$nodeVersion = (& node -v).Trim()
Write-Host "Node detecte: $nodeVersion"

if (-not $SkipInstall) {
  if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    Write-Host 'Dependances racine absentes: npm install'
    Invoke-Npm -WorkingDirectory $Root -Arguments @('install')
  }
  if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Write-Host 'Dependances frontend absentes: npm install'
    Invoke-Npm -WorkingDirectory $Frontend -Arguments @('install')
  }
}

if (-not $SkipBuild -and -not (Test-Path (Join-Path $Frontend '.next'))) {
  Write-Host 'Build frontend absent: npm run build'
  Invoke-Npm -WorkingDirectory $Frontend -Arguments @('run', 'build')
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
  Write-Host "Frontend deja actif sur http://localhost:3001 (PID: $($frontendPids -join ', '))."
}
else {
  Start-AppProcess -Name 'Frontend Next production' -WorkingDirectory $Frontend -Arguments @('run', 'start', '--', '--port', '3001') -LogPrefix 'frontend'
}

Write-Host ""
Write-Host "Sallon-ConnecT release locale" -ForegroundColor Cyan
Write-Host "Backend       : http://localhost:3000"
Write-Host "Frontend      : http://localhost:3001"
Write-Host "Diagnostics   : http://localhost:3000/api/diagnostics/overview"
Write-Host "SSE clients   : http://localhost:3000/api/events/client-count"
Write-Host "Stop          : scripts\windows\stop-sallon-connect.ps1"
Write-Host ""
Write-Host "Local-only: aucun secret .env n'est affiche par ce script."

if (-not $NoOpen) {
  Start-Sleep -Seconds 2
  Start-Process 'http://localhost:3001'
}
