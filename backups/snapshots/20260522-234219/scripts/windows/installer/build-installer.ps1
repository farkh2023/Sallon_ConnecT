param(
  [string]$Version = '',
  [switch]$SkipValidation,
  [switch]$SkipTests
)

$ErrorActionPreference = 'Stop'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root       = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$Dist       = Join-Path $Root 'dist'
$IssFile    = Join-Path $ScriptDir 'Sallon-ConnecT.iss'
$Stamp      = Get-Date -Format 'yyyyMMdd-HHmmss'
$Lines      = [System.Collections.Generic.List[string]]::new()

function Write-Log {
  param([string]$Message)
  $Lines.Add($Message)
  Write-Host $Message
}

function Write-Step {
  param([string]$Message)
  Write-Log ''
  Write-Log "== $Message =="
}

function Write-Ok   { param([string]$M) Write-Log "OK: $M" }
function Write-Warn { param([string]$M) Write-Log "WARN: $M" }
function Write-Fail { param([string]$M) Write-Log "FAIL: $M"; throw $M }

# ---------------------------------------------------------------------------
# Version
# ---------------------------------------------------------------------------
if (-not $Version) {
  $VersionFile = Join-Path $Root 'VERSION'
  $Version = if (Test-Path $VersionFile) { (Get-Content -Raw $VersionFile -Encoding UTF8).Trim() } else { '0.4.0' }
}

New-Item -Path $Dist -ItemType Directory -Force | Out-Null

Write-Log "# Sallon-ConnecT - Build installateur Windows"
Write-Log "Version  : $Version"
Write-Log "Date     : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Log "Racine   : $Root"
Write-Log "Script   : $IssFile"

# ---------------------------------------------------------------------------
# Localiser iscc.exe (Inno Setup Compiler)
# ---------------------------------------------------------------------------
Write-Step 'Localisation Inno Setup'

$InnoPaths = @(
  'C:\Program Files (x86)\Inno Setup 6\ISCC.exe',
  'C:\Program Files\Inno Setup 6\ISCC.exe',
  'C:\Program Files (x86)\Inno Setup 5\ISCC.exe',
  'C:\Program Files\Inno Setup 5\ISCC.exe'
)

$IsccPath = $null
foreach ($p in $InnoPaths) {
  if (Test-Path $p) { $IsccPath = $p; break }
}

if (-not $IsccPath) {
  $cmd = Get-Command 'iscc.exe' -ErrorAction SilentlyContinue
  if ($cmd) { $IsccPath = $cmd.Source }
}

if (-not $IsccPath) {
  Write-Log ''
  Write-Log '======================================================================'
  Write-Log 'INNO SETUP NON INSTALLE - INSTALLATEUR NON GENERE'
  Write-Log '======================================================================'
  Write-Log ''
  Write-Log 'Inno Setup est requis pour compiler le fichier .iss en installateur .exe.'
  Write-Log ''
  Write-Log 'Installation rapide (winget) :'
  Write-Log '  winget install JRSoftware.InnoSetup'
  Write-Log ''
  Write-Log 'Ou telechargement manuel :'
  Write-Log '  https://jrsoftware.org/isdl.php'
  Write-Log '  -> Choisir "Inno Setup 6.x" -> Installer avec les options par defaut'
  Write-Log ''
  Write-Log 'Apres installation, relancer cette commande :'
  Write-Log '  powershell -ExecutionPolicy Bypass -File scripts\windows\installer\build-installer.ps1'
  Write-Log ''
  Write-Log 'Le fichier .iss est pret a etre compile :'
  Write-Log "  $IssFile"
  Write-Log ''
  Write-Log 'Ou depuis l''interface Inno Setup :'
  Write-Log '  1. Ouvrir Inno Setup IDE'
  Write-Log '  2. Ouvrir le fichier : scripts\windows\installer\Sallon-ConnecT.iss'
  Write-Log '  3. Menu Build > Compile (Ctrl+F9)'
  Write-Log '  4. L''installateur est genere dans : dist\'
  Write-Log ''
  Write-Log '======================================================================'
  $Lines | Set-Content -Path (Join-Path $Dist "build-installer-$Stamp.log") -Encoding UTF8
  Write-Host ''
  Write-Host 'Statut : Inno Setup requis. Voir instructions ci-dessus.' -ForegroundColor Yellow
  exit 0
}

Write-Ok "ISCC trouve : $IsccPath"

# ---------------------------------------------------------------------------
# Validations pre-build
# ---------------------------------------------------------------------------
if (-not $SkipValidation) {
  Write-Step 'Validation pre-build'

  $pnpmCmd = Get-Command 'pnpm.cmd' -ErrorAction SilentlyContinue
  $ToolPath = if ($pnpmCmd) { $pnpmCmd.Source } else { $null }
  if (-not $ToolPath) {
    $npmCmd = Get-Command 'npm.cmd' -ErrorAction SilentlyContinue
    $ToolPath = if ($npmCmd) { $npmCmd.Source } else { $null }
  }
  if (-not $ToolPath) { Write-Fail 'pnpm ou npm introuvable dans PATH.' }
  $ToolName = Split-Path $ToolPath -Leaf

  Write-Log "Runner : $ToolName"

  if (-not $SkipTests) {
    Write-Step 'Lint'
    $p = Start-Process -FilePath $ToolPath -ArgumentList @('lint') -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Fail "Lint echoue (code $($p.ExitCode))." }
    Write-Ok 'Lint passe'

    Write-Step 'Tests'
    $p = Start-Process -FilePath $ToolPath -ArgumentList @('test') -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Fail "Tests echoues (code $($p.ExitCode))." }
    Write-Ok 'Tests passes'

    Write-Step 'Build frontend'
    $p = Start-Process -FilePath $ToolPath -ArgumentList @('build') -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Fail "Build echoue (code $($p.ExitCode))." }
    Write-Ok 'Build passe'

    Write-Step 'Tests backend'
    $p = Start-Process -FilePath $ToolPath -ArgumentList @('test:backend') -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Fail "Tests backend echoues (code $($p.ExitCode))." }
    Write-Ok 'Tests backend passes'

    Write-Step 'Tests Windows'
    $p = Start-Process -FilePath $ToolPath -ArgumentList @('test:windows') -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
    if ($p.ExitCode -ne 0) { Write-Fail "Tests Windows echoues (code $($p.ExitCode))." }
    Write-Ok 'Tests Windows passes'
  } else {
    Write-Warn 'Tests ignores par -SkipTests.'
  }

  # Verifier que .env n'est pas embarque
  Write-Step 'Securite pre-build'
  $sensitiveFiles = @('.env', '.env.local', '.env.production', 'secrets.json')
  foreach ($f in $sensitiveFiles) {
    $path = Join-Path $Root $f
    if (Test-Path $path) {
      Write-Ok "$f present localement mais exclu du build ISS."
    }
  }
  Write-Ok 'Aucun secret embarque dans le .iss detecte.'
} else {
  Write-Warn 'Validations ignorees par -SkipValidation.'
}

# ---------------------------------------------------------------------------
# Compilation Inno Setup
# ---------------------------------------------------------------------------
Write-Step 'Compilation installateur Inno Setup'
Write-Log "Commande : $IsccPath $IssFile"

$p = Start-Process -FilePath $IsccPath -ArgumentList @("`"$IssFile`"") -WorkingDirectory $Root -Wait -PassThru -NoNewWindow
if ($p.ExitCode -ne 0) {
  Write-Fail "ISCC echoue avec le code $($p.ExitCode)."
}
Write-Ok 'Compilation Inno Setup reussie.'

# ---------------------------------------------------------------------------
# Artefact
# ---------------------------------------------------------------------------
Write-Step 'Artefact'

$ExeFile = Get-ChildItem -Path $Dist -Filter "Sallon-ConnecT-Setup-*.exe" -ErrorAction SilentlyContinue |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $ExeFile) {
  Write-Fail 'Installateur .exe introuvable dans dist/ apres compilation.'
}

$Hash    = (Get-FileHash -Path $ExeFile.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
$SizeMb  = [Math]::Round($ExeFile.Length / 1MB, 2)

$ChecksumFile = Join-Path $Dist "Sallon-ConnecT-Setup-v$Version-sha256.txt"
Set-Content -Path $ChecksumFile -Encoding UTF8 -Value @(
  "# Sallon-ConnecT Setup v$Version SHA256"
  "# Build $Stamp"
  "$Hash  $($ExeFile.Name)"
)

Write-Log ''
Write-Log '======================================================================'
Write-Log "Installateur : dist\$($ExeFile.Name)"
Write-Log "Taille       : $SizeMb MB"
Write-Log "SHA256       : $Hash"
Write-Log "Checksum     : dist\$(Split-Path $ChecksumFile -Leaf)"
Write-Log '======================================================================'

# ---------------------------------------------------------------------------
# Rapport
# ---------------------------------------------------------------------------
$ReportFile = Join-Path $Dist "build-installer-$Stamp.log"
$Lines | Set-Content -Path $ReportFile -Encoding UTF8
Write-Host ''
Write-Host "Rapport : dist\$(Split-Path $ReportFile -Leaf)" -ForegroundColor Cyan
Write-Host "Installateur pret : dist\$($ExeFile.Name)" -ForegroundColor Green
