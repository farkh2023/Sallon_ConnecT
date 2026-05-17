param(
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..\..')
$Frontend = Join-Path $Root 'frontend'
$LogDir = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$Report = Join-Path $LogDir "first-run-$Stamp.txt"
$Lines = [System.Collections.Generic.List[string]]::new()

function Write-Log {
  param([string]$Message)
  $Lines.Add($Message)
  if (-not $Quiet) { Write-Host $Message }
}

function Ask-YesNo {
  param(
    [string]$Question,
    [bool]$DefaultYes = $false
  )

  $suffix = if ($DefaultYes) { 'O/n' } else { 'o/N' }
  $answer = Read-Host "$Question ($suffix)"
  if ([string]::IsNullOrWhiteSpace($answer)) { return $DefaultYes }
  return $answer -in @('o', 'O', 'oui', 'Oui', 'y', 'Y', 'yes', 'Yes')
}

function Ensure-EnvFile {
  param(
    [string]$Target,
    [string]$Example
  )

  if (Test-Path $Target) {
    Write-Log "Conserve: $(Split-Path $Target -Leaf)"
    return
  }

  if (Test-Path $Example) {
    Copy-Item -LiteralPath $Example -Destination $Target -Force
    Write-Log "Cree depuis exemple: $(Split-Path $Target -Leaf)"
  } else {
    Write-Log "WARNING exemple absent pour $(Split-Path $Target -Leaf)"
  }
}

New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
Write-Log 'Assistant premiere configuration Sallon-ConnecT'
Write-Log 'Aucun token ni secret ne sera journalise.'

if (Ask-YesNo 'Creer les fichiers .env depuis les exemples si absents ?' $true) {
  Ensure-EnvFile -Target (Join-Path $Root '.env') -Example (Join-Path $Root '.env.example')
  Ensure-EnvFile -Target (Join-Path $Frontend '.env.local') -Example (Join-Path $Frontend '.env.example')
} else {
  Write-Log 'Creation des fichiers environnement ignoree.'
}

if (Ask-YesNo 'Configurer SmartThings maintenant ?' $false) {
  Write-Log 'SmartThings: configuration manuelle recommandee dans .env. Aucun token saisi dans ce wizard.'
  Write-Host 'Editez .env manuellement pour SmartThings. Ne collez pas de token dans un terminal partage.' -ForegroundColor Yellow
} else {
  Write-Log 'SmartThings: ignore.'
}

if (Ask-YesNo 'Configurer ADB maintenant ?' $false) {
  Write-Log 'ADB: verifier .env et garder le mode lecture seule.'
} else {
  Write-Log 'ADB: ignore.'
}

if (Ask-YesNo 'Configurer DLNA maintenant ?' $false) {
  Write-Log 'DLNA: verifier .env et rester en decouverte locale.'
} else {
  Write-Log 'DLNA: ignore.'
}

if (Ask-YesNo 'Configurer un dossier medias local maintenant ?' $false) {
  Write-Log 'Medias: renseigner un dossier local dans .env sans publier le chemin.'
} else {
  Write-Log 'Medias: ignore.'
}

Write-Log 'Notifications navigateur: activation uniquement depuis le navigateur, apres ouverture du dashboard.'

if (Ask-YesNo 'Creer le raccourci Bureau ?' $true) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root 'scripts\windows\create-desktop-shortcut.ps1')
  Write-Log 'Raccourci Bureau: demande executee.'
} else {
  Write-Log 'Raccourci Bureau: ignore.'
}

if (Ask-YesNo 'Creer les raccourcis Menu Demarrer ?' $true) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $ScriptDir 'create-start-menu-shortcut.ps1')
  Write-Log 'Raccourcis Menu Demarrer: demande executee.'
} else {
  Write-Log 'Raccourcis Menu Demarrer: ignore.'
}

$Lines | Set-Content -Path $Report -Encoding utf8
Write-Host "Rapport: logs/$(Split-Path $Report -Leaf)" -ForegroundColor Cyan
