param(
  [switch]$SkipInstallDeps,
  [switch]$SkipBuild,
  [switch]$NoShortcut,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..\..')
$Frontend = Join-Path $Root 'frontend'
$LogDir = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$Report = Join-Path $LogDir "repair-$Stamp.txt"
$Lines = [System.Collections.Generic.List[string]]::new()

function Write-Log {
  param([string]$Message)
  $Lines.Add($Message)
  if (-not $Quiet) { Write-Host $Message }
}

function Ensure-Directory {
  param([string]$Name)
  $path = Join-Path $Root $Name
  New-Item -Path $path -ItemType Directory -Force | Out-Null
  New-Item -Path (Join-Path $path '.gitkeep') -ItemType File -Force | Out-Null
  Write-Log "OK dossier: $Name"
}

function Ensure-EnvFile {
  param(
    [string]$Target,
    [string]$Example
  )

  if (Test-Path $Target) {
    Write-Log "OK fichier local present: $(Split-Path $Target -Leaf)"
    return
  }

  if (Test-Path $Example) {
    Copy-Item -LiteralPath $Example -Destination $Target -Force
    Write-Log "OK fichier local recree depuis exemple: $(Split-Path $Target -Leaf)"
  } else {
    Write-Log "WARNING exemple absent pour $(Split-Path $Target -Leaf)"
  }
}

function Invoke-Checked {
  param(
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory,
    [switch]$AllowFailure
  )

  Push-Location $WorkingDirectory
  try {
    & $FilePath @Arguments
    $code = $LASTEXITCODE
    if ($code -ne 0 -and -not $AllowFailure) { throw "$FilePath a echoue avec le code $code" }
    if ($code -ne 0 -and $AllowFailure) { Write-Log "WARNING $FilePath a retourne le code $code" }
  } finally {
    Pop-Location
  }
}

New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
Write-Log 'Sallon-ConnecT - reparation locale'
Write-Log "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Log 'Aucune donnee utilisateur ne sera supprimee.'

foreach ($file in @('package.json', 'server.js', 'frontend/package.json', 'scripts/windows/start-sallon-connect.bat')) {
  if (Test-Path (Join-Path $Root $file)) {
    Write-Log "OK essentiel: $file"
  } else {
    Write-Log "WARNING fichier essentiel absent: $file"
  }
}

foreach ($dir in @('runtime', 'logs', 'backups', 'dist')) {
  Ensure-Directory -Name $dir
}

Ensure-EnvFile -Target (Join-Path $Root '.env') -Example (Join-Path $Root '.env.example')
Ensure-EnvFile -Target (Join-Path $Frontend '.env.local') -Example (Join-Path $Frontend '.env.example')

if (-not $SkipInstallDeps) {
  if (-not (Test-Path (Join-Path $Root 'node_modules'))) {
    Invoke-Checked -FilePath 'npm.cmd' -Arguments @('install') -WorkingDirectory $Root
  } else {
    Write-Log 'OK node_modules racine present.'
  }

  if (-not (Test-Path (Join-Path $Frontend 'node_modules'))) {
    Invoke-Checked -FilePath 'npm.cmd' -Arguments @('install') -WorkingDirectory $Frontend
  } else {
    Write-Log 'OK frontend/node_modules present.'
  }
} else {
  Write-Log 'Installation dependances ignoree par option.'
}

if (-not $SkipBuild) {
  Invoke-Checked -FilePath 'npm.cmd' -Arguments @('run', 'build:frontend') -WorkingDirectory $Root
} else {
  Write-Log 'Build frontend ignore par option.'
}

if (-not $NoShortcut) {
  Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Root 'scripts\windows\create-desktop-shortcut.ps1')) -WorkingDirectory $Root
  Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $ScriptDir 'create-start-menu-shortcut.ps1')) -WorkingDirectory $Root
} else {
  Write-Log 'Recreation des raccourcis ignoree par option.'
}

Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Root 'scripts\windows\status-sallon-connect.ps1')) -WorkingDirectory $Root -AllowFailure

Write-Log 'Reparation terminee.'
$Lines | Set-Content -Path $Report -Encoding utf8
if (-not $Quiet) { Write-Host "Rapport: logs/$(Split-Path $Report -Leaf)" -ForegroundColor Cyan }
