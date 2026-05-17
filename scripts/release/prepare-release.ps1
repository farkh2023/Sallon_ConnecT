# prepare-release.ps1 — Sallon-ConnecT Phase 22
# Valide que le projet est pret pour une release locale et une publication GitHub.
# Ne pousse RIEN automatiquement.

param(
    [switch]$SkipHealth,
    [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$LogDir    = Join-Path $PSScriptRoot '..\..\logs'
$LogFile   = Join-Path $LogDir "release-prep-$Timestamp.txt"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$Root    = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$Results = [System.Collections.Generic.List[string]]::new()
$Failed  = 0

function Log([string]$Text) {
    $Results.Add($Text)
    if (-not $Quiet) { Write-Host $Text }
}

function Step([string]$Name) { Log ""; Log "── $Name ──" }
function Pass([string]$Msg)  { Log "  [PASS] $Msg" }
function Fail([string]$Msg)  { $script:Failed++; Log "  [FAIL] $Msg" }
function Skip([string]$Msg)  { Log "  [SKIP] $Msg" }
function Info([string]$Msg)  { Log "  [INFO] $Msg" }

Log "======================================================="
Log " Sallon-ConnecT — Prepare Release v0.1.0"
Log " Date : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Log " Racine : $Root"
Log "======================================================="

Set-Location $Root

# ── npm run check ─────────────────────────────────────────────────
Step "npm run check (lint + tests + build)"
$checkResult = npm run check 2>&1
if ($LASTEXITCODE -eq 0) {
    Pass "npm run check reussi"
} else {
    Fail "npm run check echoue — corriger avant release"
    $checkResult | Select-Object -Last 10 | ForEach-Object { Log "    $_" }
}

# ── npm run health ────────────────────────────────────────────────
Step "npm run health (non bloquant)"
if ($SkipHealth) {
    Skip "health check ignore (--SkipHealth)"
} else {
    $healthResult = npm run health 2>&1
    if ($LASTEXITCODE -eq 0) {
        Pass "Backend repond (health ok)"
    } else {
        Log "  [WARN]  Backend non actif — health check ignore (non bloquant)"
    }
}

# ── Preflight GitHub ──────────────────────────────────────────────
Step "Preflight GitHub"
$preflightScript = Join-Path $PSScriptRoot 'preflight-github.ps1'
if (Test-Path $preflightScript) {
    powershell -ExecutionPolicy Bypass -File $preflightScript -Quiet
    if ($LASTEXITCODE -eq 0) {
        Pass "Preflight GitHub OK"
    } else {
        Fail "Preflight GitHub detecte des problemes — corriger avant publication"
    }
} else {
    Fail "preflight-github.ps1 introuvable"
}

# ── Docs principales ──────────────────────────────────────────────
Step "Documentation principale"
$Docs = @('README.md', 'CHANGELOG.md', 'ROADMAP.md', 'SECURITY.md',
          'CONTRIBUTING.md', 'VERSION', 'docs/ARCHITECTURE.md',
          'docs/LOCAL_SETUP.md', 'docs/RELEASE_CHECKLIST.md')
foreach ($doc in $Docs) {
    if (Test-Path $doc) { Pass "Present : $doc" } else { Fail "Absent  : $doc" }
}

# ── ZIP portable ──────────────────────────────────────────────────
Step "Package portable (optionnel)"
$zips = Get-ChildItem 'dist' -Filter '*.zip' -ErrorAction SilentlyContinue
if ($zips) {
    $latest = $zips | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    $ageDays = ((Get-Date) - $latest.LastWriteTime).TotalDays
    if ($ageDays -lt 7) {
        Pass "ZIP portable recent : $($latest.Name) ($([math]::Round($ageDays,1)) jours)"
    } else {
        Log "  [WARN]  ZIP portable present mais age de $([math]::Round($ageDays,0)) jours — reconstruire ?"
    }
} else {
    Skip "Aucun ZIP portable dans dist/ (normal si non packagé)"
}

# ── Version ───────────────────────────────────────────────────────
Step "Version"
if (Test-Path 'VERSION') {
    $ver = (Get-Content 'VERSION').Trim()
    Pass "VERSION : $ver"
    $pkgVer = (node -e "process.stdout.write(require('./package.json').version)" 2>$null)
    if ($pkgVer -eq $ver) {
        Pass "package.json version ($pkgVer) = VERSION ($ver)"
    } else {
        Log "  [WARN]  package.json version ($pkgVer) != VERSION ($ver)"
    }
} else {
    Fail "Fichier VERSION absent"
}

# ── Git status ────────────────────────────────────────────────────
Step "Git status"
$gitStatus = git status --porcelain 2>$null
if (-not $gitStatus) {
    Pass "Depot propre — rien a commiter"
} else {
    Log "  [WARN]  Fichiers non commites detectes :"
    $gitStatus | Select-Object -First 10 | ForEach-Object { Log "    $_" }
}

# ── Résumé ────────────────────────────────────────────────────────
Log ""
Log "======================================================="
Log " RÉSUMÉ RELEASE"
Log "======================================================="

if ($Failed -eq 0) {
    Log "  RESULTAT : OK — Projet pret pour release"
} else {
    Log "  RESULTAT : ECHEC — $Failed verification(s) en echec"
}
Log "  Rapport  : $LogFile"
Log ""
Log "  Commandes recommandees pour publication GitHub :"
Log "    git status"
Log "    git add ."
Log "    git commit -m ""Prepare v0.1.0 GitHub release"""
Log "    git tag v0.1.0"
Log "    # git push origin main --tags  <-- A executer manuellement"
Log "======================================================="

$Results | Set-Content -Path $LogFile -Encoding utf8

if ($Failed -gt 0) { exit 1 } else { exit 0 }
