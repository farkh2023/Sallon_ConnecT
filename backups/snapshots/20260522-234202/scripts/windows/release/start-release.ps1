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

function Test-NodeRequires {
  param(
    [string]$WorkingDirectory,
    [string[]]$Modules
  )

  $moduleList = ($Modules | ForEach-Object { "'$($_)'" }) -join ','
  $script = "for (const name of [$moduleList]) require.resolve(name);"
  $quotedScript = '"' + $script.Replace('"', '\"') + '"'
  $process = Start-Process -FilePath 'node.exe' `
    -ArgumentList @('-e', $quotedScript) `
    -WorkingDirectory $WorkingDirectory `
    -Wait `
    -PassThru `
    -NoNewWindow `
    -RedirectStandardOutput (Join-Path $Logs 'dependency-check.out.log') `
    -RedirectStandardError (Join-Path $Logs 'dependency-check.err.log')

  return $process.ExitCode -eq 0
}

function Ensure-Dependencies {
  param(
    [string]$Name,
    [string]$WorkingDirectory,
    [string[]]$Modules
  )

  $modulesPath = Join-Path $WorkingDirectory 'node_modules'
  $complete = (Test-Path $modulesPath) -and (Test-NodeRequires -WorkingDirectory $WorkingDirectory -Modules $Modules)

  if ($complete) {
    Write-Host "Dependances $Name presentes."
    return
  }

  if (Test-Path $modulesPath) {
    Write-Host "Dependances $Name incompletes: npm install"
  }
  else {
    Write-Host "Dependances $Name absentes: npm install"
  }

  Invoke-Npm -WorkingDirectory $WorkingDirectory -Arguments @('install')

  if (-not (Test-NodeRequires -WorkingDirectory $WorkingDirectory -Modules $Modules)) {
    throw "Dependances $Name incompletes apres npm install. Relancez le script ou supprimez node_modules avant de recommencer."
  }
}

function Test-FrontendBuild {
  $buildId = Join-Path $Frontend '.next\BUILD_ID'
  $routesManifest = Join-Path $Frontend '.next\routes-manifest.json'
  return (Test-Path $buildId) -and (Test-Path $routesManifest)
}

function Test-HttpReady {
  param(
    [string]$Name,
    [string]$Url,
    [string]$ExpectedPattern = '',
    [int]$Attempts = 20,
    [int]$DelaySeconds = 1
  )

  for ($i = 1; $i -le $Attempts; $i++) {
    try {
      $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
      if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
        if ($ExpectedPattern -and ($response.Content -notmatch $ExpectedPattern)) {
          if ($i -eq $Attempts) {
            Write-Warning "$Name repond sur $Url, mais la reponse ne correspond pas a Sallon-ConnecT."
          }
          Start-Sleep -Seconds $DelaySeconds
          continue
        }
        Write-Host "$Name pret: $Url"
        return $true
      }
    }
    catch {
      if ($i -eq $Attempts) {
        Write-Warning "$Name indisponible sur $Url. Detail: $($_.Exception.Message)"
      }
    }

    Start-Sleep -Seconds $DelaySeconds
  }

  return $false
}

function Assert-PortService {
  param(
    [string]$Name,
    [int]$Port,
    [string]$HealthUrl,
    [string]$ExpectedPattern,
    [string[]]$Pids
  )

  if (Test-HttpReady -Name $Name -Url $HealthUrl -ExpectedPattern $ExpectedPattern -Attempts 3 -DelaySeconds 1) {
    return
  }

  throw "Le port $Port est occupe (PID: $($Pids -join ', ')), mais $Name ne correspond pas a Sallon-ConnecT sur $HealthUrl. Fermez le processus concerne ou lancez scripts\windows\stop-sallon-connect.ps1 -Force, puis relancez."
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

  Start-Sleep -Seconds 2
  if ($process.HasExited) {
    $errorTail = ''
    if (Test-Path $errLog) {
      $errorTail = (Get-Content -Path $errLog -Tail 12 -ErrorAction SilentlyContinue) -join "`n"
    }
    throw "$Name s'est arrete juste apres le demarrage. Consultez logs/$LogPrefix-release-$Stamp.err.log.`n$errorTail"
  }

  return $process
}

$node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Node.js est requis. Installez Node >=22.13.0 avant de lancer la release.'
}

$nodeVersion = (& node -v).Trim()
Write-Host "Node detecte: $nodeVersion"

if (-not $SkipInstall) {
  Ensure-Dependencies -Name 'racine' -WorkingDirectory $Root -Modules @('adm-zip', 'concurrently', 'dotenv', 'express')
  Ensure-Dependencies -Name 'frontend' -WorkingDirectory $Frontend -Modules @('next/package.json', 'react/package.json', 'react-dom/package.json', 'recharts/package.json')
}

if (-not $SkipBuild -and -not (Test-FrontendBuild)) {
  Write-Host 'Build frontend absent ou incomplet: npm run build'
  Invoke-Npm -WorkingDirectory $Frontend -Arguments @('run', 'build')
}

$backendPids = Get-ListeningPid -Port 3000
if ($backendPids.Count -gt 0) {
  Write-Host "Backend deja actif sur http://localhost:3000 (PID: $($backendPids -join ', '))."
  Assert-PortService -Name 'Backend Express' -Port 3000 -HealthUrl 'http://localhost:3000/api/health' -ExpectedPattern 'Sallon-ConnecT Hub' -Pids $backendPids
}
else {
  Start-AppProcess -Name 'Backend Express' -WorkingDirectory $Root -Arguments @('start') -LogPrefix 'backend'
  if (-not (Test-HttpReady -Name 'Backend Express' -Url 'http://localhost:3000/api/health' -ExpectedPattern 'Sallon-ConnecT Hub')) {
    throw 'Backend Express demarre mais endpoint /api/health indisponible. Consultez les logs backend dans logs/.'
  }
}

$frontendPids = Get-ListeningPid -Port 3001
if ($frontendPids.Count -gt 0) {
  Write-Host "Frontend deja actif sur http://localhost:3001 (PID: $($frontendPids -join ', '))."
  Assert-PortService -Name 'Frontend Next' -Port 3001 -HealthUrl 'http://localhost:3001' -ExpectedPattern 'Sallon-ConnecT' -Pids $frontendPids
}
else {
  Start-AppProcess -Name 'Frontend Next production' -WorkingDirectory $Frontend -Arguments @('run', 'start', '--', '--port', '3001') -LogPrefix 'frontend'
  if (-not (Test-HttpReady -Name 'Frontend Next' -Url 'http://localhost:3001' -ExpectedPattern 'Sallon-ConnecT')) {
    throw 'Frontend Next demarre mais http://localhost:3001 reste indisponible. Consultez les logs frontend dans logs/.'
  }
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
