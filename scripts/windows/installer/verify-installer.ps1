param(
  [string]$InstallerPath = '',
  [string]$ExpectedVersion = '0.4.0',
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root      = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$Dist      = Join-Path $Root 'dist'
$Errors    = 0
$Warnings  = 0

function Write-Check {
  param([string]$Label, [string]$Status, [string]$Detail = '')
  $color = switch ($Status) {
    'OK'   { 'Green' }
    'WARN' { 'Yellow' }
    'FAIL' { 'Red' }
    default { 'White' }
  }
  $msg = "[$Status] $Label"
  if ($Detail) { $msg += " - $Detail" }
  Write-Host $msg -ForegroundColor $color
  if ($Status -eq 'FAIL') { $script:Errors++ }
  if ($Status -eq 'WARN') { $script:Warnings++ }
}

Write-Host ''
Write-Host '== Verification installateur Sallon-ConnecT ==' -ForegroundColor Cyan
Write-Host "Date    : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Host "Version : $ExpectedVersion"
Write-Host ''

# ---------------------------------------------------------------------------
# Localiser l'installateur
# ---------------------------------------------------------------------------
if (-not $InstallerPath) {
  $found = Get-ChildItem -Path $Dist -Filter "Sallon-ConnecT-Setup-$ExpectedVersion.exe" -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if (-not $found) {
    $found = Get-ChildItem -Path $Dist -Filter "Sallon-ConnecT-Setup-*.exe" -ErrorAction SilentlyContinue |
      Sort-Object LastWriteTime -Descending |
      Select-Object -First 1
  }
  if ($found) { $InstallerPath = $found.FullName }
}

if (-not $InstallerPath -or -not (Test-Path $InstallerPath)) {
  Write-Host "[FAIL] Installateur introuvable dans dist\." -ForegroundColor Red
  Write-Host ''
  Write-Host 'Aucun fichier Sallon-ConnecT-Setup-*.exe trouve.' -ForegroundColor Yellow
  Write-Host 'Lancez d''abord : scripts\windows\installer\build-installer.ps1' -ForegroundColor Yellow
  Write-Host ''
  Write-Host 'Si Inno Setup n''est pas installe :' -ForegroundColor Yellow
  Write-Host '  winget install JRSoftware.InnoSetup' -ForegroundColor Cyan
  Write-Host '  https://jrsoftware.org/isdl.php' -ForegroundColor Cyan
  exit 1
}

$Installer = Get-Item $InstallerPath
Write-Host "Fichier : $($Installer.FullName)"
Write-Host ''

# ---------------------------------------------------------------------------
# Verifications
# ---------------------------------------------------------------------------

# 1. Existence
Write-Check 'Fichier existe' 'OK' $Installer.Name

# 2. Extension
if ($Installer.Extension -eq '.exe') {
  Write-Check 'Extension .exe' 'OK'
} else {
  Write-Check 'Extension .exe' 'FAIL' "Extension trouvee : $($Installer.Extension)"
}

# 3. Taille minimale (> 500 Ko = pas un fichier vide)
$SizeKb = [Math]::Round($Installer.Length / 1KB, 0)
$SizeMb = [Math]::Round($Installer.Length / 1MB, 2)
if ($Installer.Length -gt 500KB) {
  Write-Check 'Taille minimale (>500 Ko)' 'OK' "$SizeMb MB ($SizeKb Ko)"
} else {
  Write-Check 'Taille minimale (>500 Ko)' 'FAIL' "$SizeMb MB - trop petit, build probablement incomplet"
}

# 4. SHA256
$Hash = (Get-FileHash -Path $Installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
Write-Check 'SHA256 calcule' 'OK' $Hash

# 5. Checksum existant
$ChecksumFile = Join-Path $Dist "Sallon-ConnecT-Setup-v$ExpectedVersion-sha256.txt"
if (Test-Path $ChecksumFile) {
  $ChecksumContent = Get-Content $ChecksumFile -Encoding UTF8 | Where-Object { $_ -notmatch '^#' }
  $ExpectedHash = ($ChecksumContent | Select-Object -First 1).Split(' ')[0].Trim()
  if ($ExpectedHash -eq $Hash) {
    Write-Check 'SHA256 correspond au checksum' 'OK'
  } else {
    Write-Check 'SHA256 correspond au checksum' 'FAIL' "Attendu: $ExpectedHash - Obtenu: $Hash"
  }
} else {
  Write-Check 'Fichier checksum presente' 'WARN' 'Checksum SHA256 non trouve - generer avec build-installer.ps1'
}

# 6. Version dans le nom de fichier
if ($Installer.Name -match $ExpectedVersion.Replace('.', '\.')) {
  Write-Check "Version $ExpectedVersion dans le nom" 'OK'
} else {
  Write-Check "Version $ExpectedVersion dans le nom" 'WARN' "Nom : $($Installer.Name)"
}

# 7. Date recente (< 24h)
$AgeHours = ((Get-Date) - $Installer.LastWriteTime).TotalHours
if ($AgeHours -lt 24) {
  Write-Check 'Artefact recent (<24h)' 'OK' "$([Math]::Round($AgeHours, 1))h"
} else {
  Write-Check 'Artefact recent (<24h)' 'WARN' "$([Math]::Round($AgeHours, 1))h - considerez un rebuild"
}

# 8. Fichier .iss source present
$IssFile = Join-Path $ScriptDir 'Sallon-ConnecT.iss'
if (Test-Path $IssFile) {
  Write-Check 'Script .iss source present' 'OK'
} else {
  Write-Check 'Script .iss source present' 'FAIL' "Introuvable : $IssFile"
}

# 9. Securite : pas de .env dans dist
$EnvInDist = Get-ChildItem -Path $Dist -Filter '.env' -ErrorAction SilentlyContinue
if ($EnvInDist) {
  Write-Check 'Aucun .env dans dist/' 'FAIL' 'Fichier .env detecte dans dist/ - risque de fuite de secrets'
} else {
  Write-Check 'Aucun .env dans dist/' 'OK'
}

# 10. Script build present
$BuildScript = Join-Path $ScriptDir 'build-installer.ps1'
if (Test-Path $BuildScript) {
  Write-Check 'Script build-installer.ps1 present' 'OK'
} else {
  Write-Check 'Script build-installer.ps1 present' 'FAIL'
}

# 11. Script uninstall-check present
$UninstallCheck = Join-Path $ScriptDir 'uninstall-check.ps1'
if (Test-Path $UninstallCheck) {
  Write-Check 'Script uninstall-check.ps1 present' 'OK'
} else {
  Write-Check 'Script uninstall-check.ps1 present' 'WARN' 'Non trouve - verification desinstallation impossible'
}

# ---------------------------------------------------------------------------
# Resume
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host '== Resume ==' -ForegroundColor Cyan
Write-Host "Erreurs   : $Errors"
Write-Host "Avertiss. : $Warnings"
Write-Host ''

if ($Errors -gt 0) {
  Write-Host "VERIFICATION ECHOUEE ($Errors erreur(s))" -ForegroundColor Red
  exit 1
} elseif ($Warnings -gt 0 -and $Strict) {
  Write-Host "VERIFICATION ECHOUEE - mode strict ($Warnings avertissement(s))" -ForegroundColor Red
  exit 1
} elseif ($Warnings -gt 0) {
  Write-Host "VERIFICATION OK avec $Warnings avertissement(s)" -ForegroundColor Yellow
  Write-Host "Installateur : $($Installer.Name) ($SizeMb MB)" -ForegroundColor Green
  Write-Host "SHA256       : $Hash" -ForegroundColor Green
  exit 0
} else {
  Write-Host 'VERIFICATION OK' -ForegroundColor Green
  Write-Host "Installateur : $($Installer.Name) ($SizeMb MB)" -ForegroundColor Green
  Write-Host "SHA256       : $Hash" -ForegroundColor Green
  exit 0
}
