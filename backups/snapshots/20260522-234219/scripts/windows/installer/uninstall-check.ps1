param(
  [string]$InstallDir = '',
  [switch]$Simulate
)

$ErrorActionPreference = 'SilentlyContinue'

$AppName = 'Sallon-ConnecT'
$Errors  = 0
$Warns   = 0

function Write-Check {
  param([string]$Label, [string]$Status, [string]$Detail = '')
  $color = switch ($Status) {
    'OK'     { 'Green' }
    'WARN'   { 'Yellow' }
    'ABSENT' { 'Green' }
    'RESTE'  { 'Red' }
    default  { 'White' }
  }
  $msg = "[$Status] $Label"
  if ($Detail) { $msg += " - $Detail" }
  Write-Host $msg -ForegroundColor $color
  if ($Status -eq 'RESTE') { $script:Errors++ }
  if ($Status -eq 'WARN')  { $script:Warns++ }
}

Write-Host ''
Write-Host "== Verification desinstallation $AppName ==" -ForegroundColor Cyan
Write-Host "Date     : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "Simuler  : $Simulate"
Write-Host ''

# ---------------------------------------------------------------------------
# Dossier d'installation
# ---------------------------------------------------------------------------
if (-not $InstallDir) {
  $InstallDir = Join-Path $env:LOCALAPPDATA $AppName
}
Write-Host "Dossier cible : $InstallDir"
Write-Host ''

# ---------------------------------------------------------------------------
# Verifications raccourcis
# ---------------------------------------------------------------------------
Write-Host '-- Raccourcis --'

$StartMenuDir = Join-Path ([Environment]::GetFolderPath('StartMenu')) "Programs\$AppName"
if (Test-Path $StartMenuDir) {
  $lnks = Get-ChildItem -Path $StartMenuDir -Filter '*.lnk' -ErrorAction SilentlyContinue
  if ($lnks) {
    Write-Check "Raccourcis Menu Demarrer dans $StartMenuDir" 'RESTE' "$($lnks.Count) raccourci(s) restant(s)"
    foreach ($lnk in $lnks) { Write-Host "  - $($lnk.Name)" -ForegroundColor Red }
  } else {
    Write-Check 'Raccourcis Menu Demarrer' 'ABSENT'
  }
} else {
  Write-Check 'Dossier Menu Demarrer' 'ABSENT'
}

$DesktopIcon = Join-Path ([Environment]::GetFolderPath('CommonDesktopDirectory')) "Demarrer $AppName.lnk"
if (Test-Path $DesktopIcon) {
  Write-Check 'Raccourci Bureau' 'RESTE' $DesktopIcon
} else {
  Write-Check 'Raccourci Bureau' 'ABSENT'
}

$UserDesktopIcon = Join-Path ([Environment]::GetFolderPath('Desktop')) "Demarrer $AppName.lnk"
if (Test-Path $UserDesktopIcon) {
  Write-Check 'Raccourci Bureau utilisateur' 'RESTE' $UserDesktopIcon
} else {
  Write-Check 'Raccourci Bureau utilisateur' 'ABSENT'
}

$StartupIcon = Join-Path ([Environment]::GetFolderPath('Startup')) "$AppName.lnk"
if (Test-Path $StartupIcon) {
  Write-Check 'Raccourci Demarrage automatique' 'RESTE' $StartupIcon
} else {
  Write-Check 'Raccourci Demarrage automatique' 'ABSENT'
}

# ---------------------------------------------------------------------------
# Verifications dossier d'installation
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '-- Dossier installation --'

if (Test-Path $InstallDir) {
  $items = Get-ChildItem -Path $InstallDir -Recurse -File -ErrorAction SilentlyContinue
  $count = if ($items) { @($items).Count } else { 0 }
  Write-Check "Dossier $InstallDir" 'RESTE' "$count fichier(s) restant(s) - donnees utilisateur conservees"
  Write-Host '  Note : les dossiers logs/, runtime/, backups/ sont conserves par securite.' -ForegroundColor Yellow
  Write-Host '  Pour supprimer manuellement : rd /s /q "' + $InstallDir + '"' -ForegroundColor Gray
} else {
  Write-Check "Dossier $InstallDir" 'ABSENT'
}

# ---------------------------------------------------------------------------
# Verifications registre
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '-- Registre Windows --'

$UninstallKey = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$AppName*"
$regEntries = Get-ChildItem -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like "*$AppName*" -or ($_ | Get-ItemProperty -ErrorAction SilentlyContinue).DisplayName -like "*$AppName*" }

if ($regEntries) {
  Write-Check 'Entree registre desinstallation' 'RESTE' "$($regEntries.Count) entree(s)"
} else {
  Write-Check 'Entree registre desinstallation' 'ABSENT'
}

# ---------------------------------------------------------------------------
# Processus actifs
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '-- Processus --'

$nodeProcs = Get-Process -Name 'node' -ErrorAction SilentlyContinue |
  Where-Object { $_.MainModule.FileName -like "*$AppName*" -or $_.CommandLine -like "*server.js*" }

if ($nodeProcs) {
  Write-Check 'Processus node Sallon-ConnecT' 'RESTE' "$(@($nodeProcs).Count) processus actif(s)"
  Write-Host '  Arreter avec : scripts\windows\stop-sallon-connect.bat' -ForegroundColor Yellow
} else {
  Write-Check 'Processus node Sallon-ConnecT' 'ABSENT'
}

# ---------------------------------------------------------------------------
# Resume
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '== Resume ==' -ForegroundColor Cyan

if ($Errors -eq 0 -and $Warns -eq 0) {
  Write-Host 'Desinstallation propre validee - aucun residu detecte.' -ForegroundColor Green
} elseif ($Errors -gt 0) {
  Write-Host "$Errors element(s) restant(s) detecte(s) apres desinstallation." -ForegroundColor Red
  Write-Host 'Relancer le desinstallateur ou supprimer manuellement les elements signales.' -ForegroundColor Yellow
} else {
  Write-Host "Desinstallation OK avec $Warns avertissement(s) - donnees utilisateur conservees." -ForegroundColor Yellow
}

Write-Host ''
exit $Errors
