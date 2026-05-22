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
$Report = Join-Path $LogDir "install-$Stamp.txt"
$Lines = [System.Collections.Generic.List[string]]::new()
$HadWarning = $false

function Write-Log {
  param([string]$Message)
  $Lines.Add($Message)
  if (-not $Quiet) { Write-Host $Message }
}

function Write-Step {
  param([string]$Message)
  Write-Log ''
  Write-Log "== $Message =="
}

function Write-WarnSafe {
  param([string]$Message)
  $script:HadWarning = $true
  Write-Log "WARNING: $Message"
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
    if ($code -ne 0 -and -not $AllowFailure) {
      throw "$FilePath a echoue avec le code $code"
    }
    if ($code -ne 0 -and $AllowFailure) {
      Write-WarnSafe "$FilePath a retourne le code $code"
    }
  } finally {
    Pop-Location
  }
}

function Get-ListeningPid {
  param([int]$Port)
  @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)
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
    Write-Log "OK fichier local conserve: $(Split-Path $Target -Leaf)"
    return
  }

  if (-not (Test-Path $Example)) {
    Write-WarnSafe "Exemple introuvable pour $(Split-Path $Target -Leaf)"
    return
  }

  Copy-Item -LiteralPath $Example -Destination $Target -Force
  Write-Log "OK fichier local cree depuis exemple: $(Split-Path $Target -Leaf)"
}

New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
Write-Log 'Sallon-ConnecT - installation locale guidee'
Write-Log "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Log 'Aucun secret n est affiche dans ce rapport.'

Write-Step 'Pre-requis'
Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $ScriptDir 'check-prerequisites.ps1'), '-Quiet') -WorkingDirectory $Root
Write-Log 'OK pre-requis bloquants valides.'

Write-Step 'Dossiers locaux'
foreach ($dir in @('runtime', 'logs', 'backups', 'dist')) {
  Ensure-Directory -Name $dir
}

Write-Step 'Fichiers environnement'
Ensure-EnvFile -Target (Join-Path $Root '.env') -Example (Join-Path $Root '.env.example')
Ensure-EnvFile -Target (Join-Path $Frontend '.env.local') -Example (Join-Path $Frontend '.env.example')

if (-not $SkipInstallDeps) {
  Write-Step 'Installation dependances npm'
  Invoke-Checked -FilePath 'npm.cmd' -Arguments @('install') -WorkingDirectory $Root
  Invoke-Checked -FilePath 'npm.cmd' -Arguments @('install') -WorkingDirectory $Frontend
} else {
  Write-WarnSafe 'Installation des dependances ignoree par option.'
}

if (-not $SkipBuild) {
  Write-Step 'Build frontend'
  Invoke-Checked -FilePath 'npm.cmd' -Arguments @('run', 'build:frontend') -WorkingDirectory $Root
} else {
  Write-WarnSafe 'Build frontend ignore par option.'
}

if (-not $NoShortcut) {
  Write-Step 'Raccourcis'
  Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $Root 'scripts\windows\create-desktop-shortcut.ps1')) -WorkingDirectory $Root
  Invoke-Checked -FilePath 'powershell' -Arguments @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', (Join-Path $ScriptDir 'create-start-menu-shortcut.ps1')) -WorkingDirectory $Root
} else {
  Write-WarnSafe 'Creation des raccourcis ignoree par option.'
}

Write-Step 'Health'
if ((Get-ListeningPid -Port 3000).Count -gt 0) {
  Invoke-Checked -FilePath 'npm.cmd' -Arguments @('run', 'health') -WorkingDirectory $Root -AllowFailure
} else {
  Write-WarnSafe 'Backend inactif sur le port 3000. Health non bloquant ignore.'
}

Write-Step 'Resume'
if ($HadWarning) {
  Write-Log 'Installation terminee avec avertissement(s).'
} else {
  Write-Log 'Installation terminee.'
}

$Lines | Set-Content -Path $Report -Encoding utf8
if (-not $Quiet) { Write-Host "Rapport: logs/$(Split-Path $Report -Leaf)" -ForegroundColor Cyan }
