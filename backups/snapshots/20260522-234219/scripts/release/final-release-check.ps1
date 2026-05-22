# final-release-check.ps1 - Sallon-ConnecT Phase 26
# Verification finale avant release locale v0.1.0.
# Ne pousse rien. Ne cree pas de tag. Ne publie pas sur GitHub.

param(
  [switch]$SkipHealth,
  [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$Version = '0.1.0'
$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$LogDir = Join-Path $Root 'logs'
$NpmCommand = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

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

function RunScript([string]$Label, [string]$ScriptPath) {
  Log ""
  Log "--- $Label ---"
  if (-not (Test-Path $ScriptPath)) {
    Fail "$Label : script introuvable ($ScriptPath)"
    return
  }
  $Out = & powershell -ExecutionPolicy Bypass -File $ScriptPath 2>&1
  $Out | ForEach-Object { $Lines.Add("  $_") }
  if (-not $Quiet) { $Out | ForEach-Object { Write-Host "  $_" } }
  if ($LASTEXITCODE -eq 0) {
    Pass "$Label : OK"
  } else {
    Fail "$Label : ECHEC (code $LASTEXITCODE)"
  }
}

$NowStr = Get-Date -Format 'yyyy-MM-dd HH:mm'
Log "=========================================="
Log "  Sallon-ConnecT - Final Release Check"
Log "  Version : $Version"
Log "  Date    : $NowStr"
Log "=========================================="

# --- 1. npm run check ---
Log ""
Log "--- Etape 1 : npm run check ---"
$checkOut = & $NpmCommand run check 2>&1
if ($LASTEXITCODE -eq 0) {
  Pass "npm run check : OK"
} else {
  Fail "npm run check : ECHEC"
  $checkOut | ForEach-Object { $Lines.Add("  $_") }
}

# --- 2. npm run health (non bloquant) ---
if (-not $SkipHealth) {
  Log ""
  Log "--- Etape 2 : npm run health (non bloquant) ---"
  $healthOut = & $NpmCommand run health 2>&1
  if ($LASTEXITCODE -eq 0) {
    Pass "npm run health : OK"
  } else {
    Warn "npm run health : avertissement (backend peut-etre inactif)"
    Warn "  Lancer npm run dev:backend puis relancer si necessaire."
    $healthOut | ForEach-Object { $Lines.Add("  $_") }
  }
} else {
  Warn "npm run health : IGNORE (SkipHealth actif)"
}

# --- 3. preflight-github.ps1 ---
RunScript "Preflight GitHub" (Join-Path $Root 'scripts\release\preflight-github.ps1')

# --- 4. prepare-release.ps1 ---
RunScript "Prepare Release" (Join-Path $Root 'scripts\release\prepare-release.ps1')

# --- 5. build-release-artifacts.ps1 ---
RunScript "Build Release Artifacts" (Join-Path $Root 'scripts\release\build-release-artifacts.ps1')

# --- 6. Verifier docs/releases/v0.1.0.md ---
Log ""
Log "--- Etape 6 : docs/releases/v$Version.md ---"
$RelNotes = Join-Path $Root "docs\releases\v$Version.md"
if (Test-Path $RelNotes) {
  $Content = Get-Content $RelNotes -Raw
  if ($Content -match "Sallon-ConnecT v$Version") {
    Pass "Release notes presentes et contiennent le bon titre."
  } else {
    Warn "Release notes presentes mais titre inattendu."
  }
} else {
  Fail "Release notes absentes : docs\releases\v$Version.md"
}

# --- 7. Verifier VERSION ---
Log ""
Log "--- Etape 7 : VERSION ---"
$VersionFile = Join-Path $Root 'VERSION'
if (Test-Path $VersionFile) {
  $FileVersion = (Get-Content $VersionFile -Raw).Trim()
  if ($FileVersion -eq $Version) {
    Pass "VERSION = $FileVersion"
  } else {
    Fail "VERSION attendu $Version, trouve $FileVersion"
  }
} else {
  Fail "Fichier VERSION absent."
}

# --- 8. Verifier CHANGELOG.md ---
Log ""
Log "--- Etape 8 : CHANGELOG.md ---"
$ChangelogFile = Join-Path $Root 'CHANGELOG.md'
if (Test-Path $ChangelogFile) {
  $ChangelogContent = Get-Content $ChangelogFile -Raw
  if ($ChangelogContent -match "0\.1\.0") {
    Pass "CHANGELOG.md contient l'entree 0.1.0."
  } else {
    Fail "CHANGELOG.md ne contient pas d'entree 0.1.0."
  }
} else {
  Fail "CHANGELOG.md absent."
}

# --- 9. Verifier artefacts dist/ ---
Log ""
Log "--- Etape 9 : Artefacts dist/ ---"
$DistDir = Join-Path $Root 'dist'
$ZipFiles = Get-ChildItem -Path $DistDir -Filter '*.zip' -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -notmatch 'backup|restore' } |
  Sort-Object LastWriteTime -Descending

if ($ZipFiles.Count -gt 0) {
  Pass "ZIP portable present : $($ZipFiles[0].Name)"
} else {
  Warn "Aucun ZIP portable dans dist/ - relancer build-release-artifacts.ps1 si necessaire."
}

$ChecksumFile = Join-Path $DistDir "Sallon-ConnecT-v$Version-checksums.txt"
if (Test-Path $ChecksumFile) {
  Pass "Checksum present : dist\Sallon-ConnecT-v$Version-checksums.txt"
} else {
  Warn "Checksum absent - sera genere par build-release-artifacts.ps1."
}

# --- 10. Verifier git status ---
Log ""
Log "--- Etape 10 : Git status ---"
$GitStatus = git status --short 2>&1
if (-not $GitStatus) {
  Pass "Working tree propre."
} else {
  Warn "Fichiers non commites detectes :"
  $GitStatus | ForEach-Object { Warn "  $_" }
}

# --- Rapport final ---
Log ""
Log "=========================================="
Log "  RESUME FINAL RELEASE CHECK"
Log "=========================================="
Log "  Echecs  : $Failed"
Log "  Warnings: $Warnings"

if ($Failed -eq 0 -and $Warnings -eq 0) {
  Log "  Statut  : PARFAIT - release prete pour validation manuelle"
} elseif ($Failed -eq 0) {
  Log "  Statut  : OK avec avertissements - verifier les WARN ci-dessus"
} else {
  Log "  Statut  : ECHEC - corriger les FAIL avant de proceder"
}

Log "=========================================="
Log ""
Log "COMMANDES GIT (a executer manuellement apres validation) :"
Log ""
Log "  git status"
Log "  git add ."
Log "  git commit -m 'Prepare GitHub release v$Version'"
Log "  git tag v$Version"
Log ""
Log "Puis, seulement quand pret a publier :"
Log ""
Log "  git remote add origin URL_DU_DEPOT"
Log "  git push -u origin main"
Log "  git push origin v$Version"
Log ""
Log "La release GitHub se cree manuellement sur github.com en joignant :"
Log "  - dist\Sallon-ConnecT-Portable-*.zip"
Log "  - dist\Sallon-ConnecT-v$Version-checksums.txt"
Log "=========================================="

$ReportName = "final-release-check-$Timestamp.txt"
$ReportPath = Join-Path $LogDir $ReportName
try {
  $Lines | Set-Content -Path $ReportPath -Encoding UTF8
  Log "Rapport : logs\$ReportName"
} catch {
  $ErrRpt = $_.ToString()
  Warn "Erreur ecriture rapport : $ErrRpt"
}

if ($Failed -gt 0) { exit 1 } else { exit 0 }
