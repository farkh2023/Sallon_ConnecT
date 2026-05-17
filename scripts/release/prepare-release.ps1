# prepare-release.ps1 - Sallon-ConnecT Phase 22
# Execute les controles locaux avant commit/release. Ne pousse rien vers GitHub.

param(
  [switch]$SkipHealth,
  [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$LogDir = Join-Path $Root 'logs'
$ReportName = "release-prep-$Timestamp.txt"
$LogFile = Join-Path $LogDir $ReportName
$RelativeReport = "logs\$ReportName"

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$Lines = [System.Collections.Generic.List[string]]::new()
$Failed = 0
$Warnings = 0
$NpmCommand = if ($env:OS -eq 'Windows_NT') { 'npm.cmd' } else { 'npm' }

function Sanitize-Line([string]$Text) {
  if ($null -eq $Text) { return '' }
  $Value = $Text -replace [regex]::Escape($Root.Path), '<repo>'
  $Value = $Value -replace 'C:\\Users\\[^\\\s]+\\', '<user-home>\'
  $MacHomeRegex = '/' + 'Users' + '/[^/\s]+/'
  $Value = $Value -replace $MacHomeRegex, '<user-home>/'
  return $Value
}

function Log([string]$Text) {
  $Safe = Sanitize-Line $Text
  $Lines.Add($Safe)
  if (-not $Quiet) { Write-Host $Safe }
}

function Section([string]$Name) {
  Log ''
  Log "-- $Name --"
}

function Pass([string]$Message) {
  Log "  [PASS] $Message"
}

function Warn([string]$Message) {
  $script:Warnings += 1
  Log "  [WARN] $Message"
}

function Fail([string]$Message) {
  $script:Failed += 1
  Log "  [FAIL] $Message"
}

function Run-RequiredCommand([string]$Name, [string]$Command, [string[]]$Arguments) {
  Section $Name
  $Output = & $Command @Arguments 2>&1
  $Code = $LASTEXITCODE

  if ($Code -eq 0) {
    Pass "$Name reussi"
  } else {
    Fail "$Name echoue (code $Code)"
    $Output | Select-Object -Last 20 | ForEach-Object { Log "    $_" }
  }
}

Log '======================================================='
Log ' Sallon-ConnecT - Prepare Release v0.1.0'
Log " Date : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Log ' Racine : <repo>'
Log '======================================================='

Run-RequiredCommand 'npm run check' $NpmCommand @('run', 'check')

Section 'npm run health'
if ($SkipHealth) {
  Warn 'health check ignore par option'
} else {
  $HealthOutput = & $NpmCommand @('run', 'health') 2>&1
  $HealthCode = $LASTEXITCODE
  if ($HealthCode -eq 0) {
    Pass 'Backend actif et health check OK'
  } else {
    Warn 'Backend non actif ou endpoint health indisponible - non bloquant si npm run check passe'
    $HealthOutput | Select-Object -Last 5 | ForEach-Object { Log "    $_" }
  }
}

Section 'Preflight GitHub'
$PreflightScript = Join-Path $PSScriptRoot 'preflight-github.ps1'
if (Test-Path $PreflightScript) {
  powershell -ExecutionPolicy Bypass -File $PreflightScript -Quiet
  if ($LASTEXITCODE -eq 0) {
    Pass 'Preflight GitHub OK'
  } else {
    Fail 'Preflight GitHub a detecte un probleme bloquant'
  }
} else {
  Fail 'scripts/release/preflight-github.ps1 absent'
}

Section 'Documentation principale'
$Docs = @(
  'README.md',
  'CHANGELOG.md',
  'ROADMAP.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'VERSION',
  'docs/ARCHITECTURE.md',
  'docs/SECURITY_MODEL.md',
  'docs/LOCAL_SETUP.md',
  'docs/RELEASE_CHECKLIST.md',
  'docs/VERSIONING.md'
)

foreach ($Doc in $Docs) {
  if (Test-Path $Doc) { Pass "Present : $Doc" } else { Fail "Absent : $Doc" }
}

Section 'Version'
if (Test-Path 'VERSION') {
  $Version = (Get-Content 'VERSION' -Raw).Trim()
  if ($Version -eq '0.1.0') { Pass 'VERSION = 0.1.0' } else { Fail "VERSION inattendu : $Version" }

  $PackageVersion = node -e "process.stdout.write(require('./package.json').version)" 2>$null
  if ($PackageVersion -eq $Version) { Pass 'package.json coherent avec VERSION' } else { Fail 'package.json incoherent avec VERSION' }

  $FrontendVersion = node -e "process.stdout.write(require('./frontend/package.json').version)" 2>$null
  if ($FrontendVersion -eq $Version) { Pass 'frontend/package.json coherent avec VERSION' } else { Warn 'frontend/package.json version differente de VERSION' }
} else {
  Fail 'VERSION absent'
}

Section 'Package portable'
$PortableZips = @(Get-ChildItem 'dist' -Filter '*.zip' -ErrorAction SilentlyContinue)
if ($PortableZips.Count -gt 0) {
  $LatestZip = $PortableZips | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  Pass "ZIP portable present : $($LatestZip.Name)"
} else {
  Warn 'Aucun ZIP portable dans dist - normal si le packaging manuel n a pas ete lance'
}

Section 'Git status'
$GitStatus = @(git status --porcelain 2>$null)
if ($GitStatus.Count -eq 0) {
  Pass 'Depot propre'
} else {
  Warn "$($GitStatus.Count) changement(s) locaux a commiter"
  $GitStatus | Select-Object -First 20 | ForEach-Object { Log "    $_" }
}

Log ''
Log '======================================================='
Log ' RESUME RELEASE'
Log '======================================================='
if ($Failed -eq 0) {
  Log "  RESULTAT : OK - $Warnings warning(s) non bloquant(s)"
} else {
  Log "  RESULTAT : ECHEC - $Failed verification(s) en echec"
}
Log "  Rapport  : $RelativeReport"
Log ''
Log '  Commandes Git recommandees apres validation :'
Log '    git status'
Log '    git add .'
Log '    git commit -m "Prepare v0.1.0 GitHub release"'
Log '    git tag v0.1.0'
Log '======================================================='

$Lines | Set-Content -Path $LogFile -Encoding utf8

if ($Failed -gt 0) { exit 1 }
exit 0
