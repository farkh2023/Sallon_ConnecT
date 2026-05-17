param(
  [switch]$NonInteractive,
  [switch]$Quiet
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..\..')
$LogDir = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$Report = Join-Path $LogDir "uninstall-$Stamp.txt"
$Lines = [System.Collections.Generic.List[string]]::new()

function Write-Log {
  param([string]$Message)
  $Lines.Add($Message)
  if (-not $Quiet) { Write-Host $Message }
}

function Confirm-Removal {
  param([string]$Label)
  if ($NonInteractive) { return $false }
  $answer = Read-Host "Supprimer $Label ? Cette action est optionnelle (o/N)"
  return $answer -in @('o', 'O', 'oui', 'Oui', 'y', 'Y', 'yes', 'Yes')
}

function Remove-TreeInsideRoot {
  param(
    [string]$RelativePath,
    [string]$Label
  )

  if (-not (Confirm-Removal -Label $Label)) {
    Write-Log "$Label conserve."
    return
  }

  $target = Join-Path $Root $RelativePath
  if (-not (Test-Path $target)) {
    Write-Log "$Label absent."
    return
  }

  $resolvedRoot = $Root.Path.TrimEnd('\')
  $resolvedTarget = (Resolve-Path $target).Path
  if (-not $resolvedTarget.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refus de supprimer hors projet: $Label"
  }

  Remove-Item -LiteralPath $resolvedTarget -Recurse -Force
  Write-Log "$Label supprime."
}

New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
Write-Log 'Sallon-ConnecT - desinstallation locale douce'
Write-Log "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Log 'Le dossier projet ne sera pas supprime automatiquement.'

$stopScript = Join-Path $Root 'scripts\windows\stop-sallon-connect.ps1'
if (Test-Path $stopScript) {
  & powershell -NoProfile -ExecutionPolicy Bypass -File $stopScript
  Write-Log 'Arret local demande.'
} else {
  Write-Log 'WARNING script arret introuvable.'
}

$desktopShortcut = Join-Path ([Environment]::GetFolderPath('DesktopDirectory')) 'Sallon-ConnecT.lnk'
if (Test-Path $desktopShortcut) {
  Remove-Item -LiteralPath $desktopShortcut -Force
  Write-Log 'Raccourci Bureau supprime.'
} else {
  Write-Log 'Raccourci Bureau absent.'
}

$startMenuRoot = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\Sallon-ConnecT'
if (Test-Path $startMenuRoot) {
  Remove-Item -LiteralPath $startMenuRoot -Recurse -Force
  Write-Log 'Raccourcis Menu Demarrer supprimes.'
} else {
  Write-Log 'Raccourcis Menu Demarrer absents.'
}

Remove-TreeInsideRoot -RelativePath 'logs' -Label 'logs'
Remove-TreeInsideRoot -RelativePath 'backups' -Label 'backups'
Remove-TreeInsideRoot -RelativePath 'runtime' -Label 'runtime'
Remove-TreeInsideRoot -RelativePath 'node_modules' -Label 'node_modules racine'
Remove-TreeInsideRoot -RelativePath 'frontend\node_modules' -Label 'frontend/node_modules'

Write-Log 'Desinstallation douce terminee.'
New-Item -Path $LogDir -ItemType Directory -Force | Out-Null
$Lines | Set-Content -Path $Report -Encoding utf8
if (-not $Quiet) { Write-Host "Rapport: logs/$(Split-Path $Report -Leaf)" -ForegroundColor Cyan }
