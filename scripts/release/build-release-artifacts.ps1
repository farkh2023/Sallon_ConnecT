# build-release-artifacts.ps1 - Sallon-ConnecT Phase 26
# Prepare les artefacts de release locale pour v0.1.0.
# Ne pousse rien. Ne cree pas de tag. Ne publie pas sur GitHub.

param(
  [switch]$SkipCheck,
  [switch]$SkipPackage,
  [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$Version = '0.1.0'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$DistDir = Join-Path $Root 'dist'
$LogDir = Join-Path $Root 'logs'
$ChecksumFile = Join-Path $DistDir "Sallon-ConnecT-v$Version-checksums.txt"
$NpmCommand = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }

$Lines = [System.Collections.Generic.List[string]]::new()
$Failed = 0
$Warnings = 0

function Log([string]$Text, [string]$Level = 'INFO') {
  $Line = "[$Level] $Text"
  $Lines.Add($Line)
  if (-not $Quiet) { Write-Host $Line }
}

function Fail([string]$Text) {
  $script:Failed++
  Log $Text 'FAIL'
}

function Warn([string]$Text) {
  $script:Warnings++
  Log $Text 'WARN'
}

function Pass([string]$Text) { Log $Text 'PASS' }

Log "=========================================="
Log "  Sallon-ConnecT - Build Release Artifacts"
Log "  Version : $Version"
$NowStr = Get-Date -Format 'yyyy-MM-dd HH:mm'
Log "  Date    : $NowStr"
Log "=========================================="

# --- Ensure dist directory ---
if (-not (Test-Path $DistDir)) {
  New-Item -ItemType Directory -Path $DistDir -Force | Out-Null
  Pass "Repertoire dist/ cree."
} else {
  Pass "Repertoire dist/ present."
}

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# --- 1. npm run check ---
if (-not $SkipCheck) {
  Log ""
  Log "--- Etape 1 : npm run check ---"
  $checkResult = & $NpmCommand run check 2>&1
  if ($LASTEXITCODE -eq 0) {
    Pass "npm run check : OK"
  } else {
    Fail "npm run check : ECHEC (code $LASTEXITCODE)"
    $errStr = $checkResult | Out-String
    $Lines.Add($errStr)
  }
} else {
  Warn "npm run check : IGNORE (SkipCheck actif)"
}

# --- 2. Build portable package ---
if (-not $SkipPackage) {
  Log ""
  Log "--- Etape 2 : package-portable.ps1 ---"
  $PackageScript = Join-Path $Root 'scripts\windows\package-portable.ps1'
  if (Test-Path $PackageScript) {
    & powershell -ExecutionPolicy Bypass -File $PackageScript 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
      Pass "package-portable.ps1 : OK"
    } else {
      Warn "package-portable.ps1 : code $LASTEXITCODE (non bloquant si dist/ absent)"
    }
  } else {
    Warn "package-portable.ps1 introuvable : $PackageScript"
  }
} else {
  Warn "package-portable.ps1 : IGNORE (SkipPackage actif)"
}

# --- 3. Localiser le ZIP portable ---
Log ""
Log "--- Etape 3 : Localisation du ZIP portable ---"
$ZipFiles = Get-ChildItem -Path $DistDir -Filter '*.zip' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch 'backup|restore' } |
  Sort-Object LastWriteTime -Descending

$ZipFile = $null
if ($ZipFiles.Count -eq 0) {
  Warn "Aucun ZIP portable trouve dans dist/. Le checksum sera vide."
} else {
  $ZipFile = $ZipFiles[0]
  Pass "ZIP portable : $($ZipFile.Name)"
}

# --- 4. Verifier contenu du ZIP (fichiers interdits) ---
if ($ZipFile -ne $null) {
  Log ""
  Log "--- Etape 4 : Verification contenu ZIP ---"

  $Forbidden = @(
    '\.env$',
    'frontend[/\\]\.env\.local',
    'runtime[/\\][^/\\]+\.json',
    'logs[/\\][^/\\]+\.(json|txt|log)',
    'node_modules[/\\]',
    'frontend[/\\]node_modules[/\\]',
    '\.git[/\\]',
    '\.next[/\\]',
    'frontend[/\\]\.next[/\\]',
    '\.pem$',
    '\.key$'
  )

  try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem -ErrorAction SilentlyContinue
    $Zip = [System.IO.Compression.ZipFile]::OpenRead($ZipFile.FullName)
    $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName }
    $Zip.Dispose()

    $ForbiddenFound = @()
    foreach ($Pattern in $Forbidden) {
      $ZipMatches = $ZipEntries | Where-Object { $_ -match $Pattern }
      if ($ZipMatches) {
        $ForbiddenFound += $ZipMatches
      }
    }

    if ($ForbiddenFound.Count -gt 0) {
      foreach ($F in $ForbiddenFound) {
        Fail "Fichier interdit dans le ZIP : $F"
      }
    } else {
      $EntryCount = $ZipEntries.Count
      Pass "ZIP verifie : $EntryCount entrees, aucun fichier interdit detecte"
    }
  } catch {
    $ErrMsg = $_.ToString()
    Warn "Erreur inspection ZIP : $ErrMsg"
  }
}

# --- 5. Generer SHA256 checksum ---
Log ""
Log "--- Etape 5 : Generation checksum SHA256 ---"

$DateGenStr = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$CsLines = [System.Collections.Generic.List[string]]::new()
$CsLines.Add("# Sallon-ConnecT v$Version - Checksums SHA256")
$CsLines.Add("# Genere le : $DateGenStr")
$CsLines.Add("# Ne pas modifier manuellement.")
$CsLines.Add("")

if ($ZipFile -ne $null) {
  try {
    $Hash = Get-FileHash -Path $ZipFile.FullName -Algorithm SHA256
    $HashVal = $Hash.Hash
    $ZipName = $ZipFile.Name
    $CsLines.Add("$HashVal  $ZipName")
    Pass "SHA256 genere : $HashVal"
    Pass "  Fichier : $ZipName"
    $SizeMB = [math]::Round($ZipFile.Length / 1MB, 2)
    Log "  Taille  : $SizeMB MB"
  } catch {
    $ErrMsg2 = $_.ToString()
    Warn "Erreur calcul SHA256 : $ErrMsg2"
    $CsLines.Add("# ERREUR : calcul SHA256 echoue")
  }
} else {
  $CsLines.Add("# Aucun artefact ZIP disponible lors de la generation.")
  $CsLines.Add("# Relancer apres avoir construit le ZIP portable.")
  Warn "Checksum vide : aucun ZIP disponible."
}

$CsLines.Add("")
$CsLines.Add("# Verification manuelle sous PowerShell :")
$CsLines.Add("#   Get-FileHash dist\<fichier>.zip -Algorithm SHA256")
$CsLines.Add("#")
$CsLines.Add("# Verification manuelle sous Linux/macOS :")
$CsLines.Add("#   sha256sum dist/<fichier>.zip")

$CsLines | Set-Content -Path $ChecksumFile -Encoding UTF8
Pass "Checksum ecrit : dist\Sallon-ConnecT-v$Version-checksums.txt"

# --- 6. Verifier fichiers release obligatoires ---
Log ""
Log "--- Etape 6 : Verification fichiers release ---"

$RequiredFiles = @(
  "VERSION",
  "CHANGELOG.md",
  "README.md",
  "docs\releases\v$Version.md",
  "docs\RELEASE_CHECKLIST.md",
  "scripts\release\preflight-github.ps1",
  "scripts\release\prepare-release.ps1",
  "scripts\release\build-release-artifacts.ps1",
  "scripts\release\final-release-check.ps1"
)

foreach ($F in $RequiredFiles) {
  $Path = Join-Path $Root $F
  if (Test-Path $Path) {
    Pass "Present : $F"
  } else {
    Fail "Manquant : $F"
  }
}

# --- 7. Verifier VERSION ---
Log ""
Log "--- Etape 7 : Verification VERSION ---"
$VersionFile = Join-Path $Root 'VERSION'
if (Test-Path $VersionFile) {
  $FileVersion = (Get-Content $VersionFile -Raw).Trim()
  if ($FileVersion -eq $Version) {
    Pass "VERSION = $FileVersion"
  } else {
    Fail "VERSION attendu $Version, trouve $FileVersion"
  }
}

# --- 8. Rapport ---
Log ""
Log "=========================================="
Log "  RESUME BUILD RELEASE ARTIFACTS"
Log "=========================================="
Log "  Echecs  : $Failed"
Log "  Warnings: $Warnings"

if ($Failed -eq 0) {
  Log "  Statut  : OK - artefacts prets pour review manuelle"
} else {
  Log "  Statut  : ECHEC - corriger avant de proceder"
}
Log "=========================================="

$ReportName = "build-release-artifacts-$Timestamp.txt"
$ReportPath = Join-Path $LogDir $ReportName

try {
  $Lines | Set-Content -Path $ReportPath -Encoding UTF8
  Log "Rapport ecrit : logs\$ReportName"
} catch {
  $ErrRpt = $_.ToString()
  Warn "Erreur ecriture rapport : $ErrRpt"
}

if ($Failed -gt 0) { exit 1 } else { exit 0 }
