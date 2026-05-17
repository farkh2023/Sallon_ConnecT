# preflight-github.ps1 — Sallon-ConnecT Phase 22
# Verifie que le depot est pret pour une publication GitHub propre et securisee.
# Ne jamais afficher la valeur complete d'un secret.
# Produit un rapport dans logs/github-preflight-YYYYMMDD-HHMM.txt

param(
    [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$LogDir    = Join-Path $PSScriptRoot '..\..\logs'
$LogFile   = Join-Path $LogDir "github-preflight-$Timestamp.txt"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$Lines  = [System.Collections.Generic.List[string]]::new()
$Errors = 0
$Warns  = 0

function Write-Line([string]$Text) {
    $Lines.Add($Text)
    if (-not $Quiet) { Write-Host $Text }
}

function OK([string]$Msg) { Write-Line "  [OK]      $Msg" }
function WARN([string]$Msg) { $script:Warns++; Write-Line "  [WARNING] $Msg" }
function ERR([string]$Msg) { $script:Errors++; Write-Line "  [ERROR]   $Msg" }

Write-Line "======================================================="
Write-Line " Sallon-ConnecT — Preflight GitHub v0.1.0"
Write-Line " Date : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-Line "======================================================="
Write-Line ""

# ── Contexte Git ──────────────────────────────────────────────────
Write-Line "── Git ──"
$Branch = git rev-parse --abbrev-ref HEAD 2>$null
if ($Branch) { OK "Branche courante : $Branch" } else { WARN "Impossible de lire la branche Git" }

$Status = git status --porcelain 2>$null
if ($Status) { WARN "$($Status.Count) fichier(s) non commites detectes" } else { OK "Depot Git propre (rien a commiter)" }

Write-Line ""

# ── Fichiers requis ───────────────────────────────────────────────
Write-Line "── Fichiers requis ──"
$Required = @(
    'README.md', '.gitignore', '.env.example',
    'frontend/.env.example', 'docs', '.github/workflows/tests.yml',
    'package.json', 'frontend/package.json', 'SECURITY.md',
    'CONTRIBUTING.md', 'CHANGELOG.md', 'VERSION'
)
foreach ($f in $Required) {
    if (Test-Path $f) { OK "Present : $f" } else { ERR "Absent  : $f" }
}

Write-Line ""

# ── Fichiers interdits dans Git ───────────────────────────────────
Write-Line "── Fichiers interdits dans Git (suivi) ──"

$Tracked = git ls-files 2>$null

function Check-Absent([string]$Pattern, [string]$Label) {
    $found = $Tracked | Where-Object { $_ -match $Pattern }
    if ($found) { ERR "INTERDIT SUIVI : $Label — $($found -join ', ')" }
    else { OK "Absent (suivi) : $Label" }
}

Check-Absent '\.env$'                        '.env reel'
Check-Absent 'frontend[/\\]\.env\.local'    'frontend/.env.local'
Check-Absent 'runtime/.*\.json'             'runtime/*.json'
Check-Absent 'backups/.*\.zip'              'backups/*.zip'
Check-Absent 'logs/.*\.(log|txt|json)$'     'logs/*.log/txt/json'
Check-Absent '^node_modules[/\\]'           'node_modules/'
Check-Absent 'frontend[/\\]node_modules'    'frontend/node_modules/'
Check-Absent '^\.(next)[/\\]'               '.next/'
Check-Absent 'frontend[/\\]\.next[/\\]'     'frontend/.next/'
Check-Absent '\.(pem|key|p12|crt)$'        '*.pem/*.key/*.p12/*.crt'

Write-Line ""

# ── Scan contenu sensible ─────────────────────────────────────────
Write-Line "── Scan contenu sensible dans fichiers suivis ──"

$SensitivePatterns = @{
    'Bearer token'           = 'Bearer\s+[A-Za-z0-9\-_]{20,}'
    'SMARTTHINGS_TOKEN='     = 'SMARTTHINGS_TOKEN=[^\s"]{5,}'
    'IMEI'                   = '\bIMEI\b[=:]\s*\d{10,}'
    'Chemin /Users/'         = '/Users/[A-Za-z]'
    'Chemin C:\Users\'       = 'C:\\\\Users\\\\'
    'Token connu R5C'        = 'R5C[A-Za-z0-9]{6,}'
    'Serie 353079'           = '353079\d{4,}'
}

$TrackedFiles = git ls-files --cached 2>$null
$SensitiveFound = $false

foreach ($pattern in $SensitivePatterns.GetEnumerator()) {
    $hits = @()
    foreach ($file in $TrackedFiles) {
        if (-not (Test-Path $file)) { continue }
        try {
            $content = Get-Content $file -Raw -ErrorAction SilentlyContinue
            if ($content -and ($content -match $pattern.Value)) {
                $hits += $file
            }
        } catch { }
    }
    if ($hits.Count -gt 0) {
        ERR "Contenu sensible ($($pattern.Key)) dans : $($hits -join ', ')"
        $SensitiveFound = $true
    } else {
        OK "Absent : $($pattern.Key)"
    }
}

if (-not $SensitiveFound) { OK "Aucun secret detecte dans les fichiers suivis" }

Write-Line ""

# ── Résumé ────────────────────────────────────────────────────────
Write-Line "======================================================="
Write-Line " RÉSUMÉ"
Write-Line "======================================================="

if ($Errors -eq 0 -and $Warns -eq 0) {
    Write-Line "  RESULTAT : OK — Depot pret pour GitHub"
} elseif ($Errors -eq 0) {
    Write-Line "  RESULTAT : WARNING — $Warns avertissement(s), pas d'erreur bloquante"
} else {
    Write-Line "  RESULTAT : ERROR — $Errors erreur(s) bloquante(s) detectee(s)"
}
Write-Line "  Rapport  : $LogFile"
Write-Line "======================================================="

# ── Ecriture rapport ──────────────────────────────────────────────
$Lines | Set-Content -Path $LogFile -Encoding utf8

if ($Errors -gt 0) {
    Write-Host ""
    Write-Host "  ECHEC : $Errors erreur(s) bloquante(s). Corriger avant publication." -ForegroundColor Red
    exit 1
} elseif ($Warns -gt 0) {
    Write-Host ""
    Write-Host "  ATTENTION : $Warns avertissement(s). Verifier avant publication." -ForegroundColor Yellow
    exit 0
} else {
    exit 0
}
