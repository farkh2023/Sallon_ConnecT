# preflight-github.ps1 - Sallon-ConnecT Phase 22
# Verifie qu'une publication GitHub locale reste propre et sans secret.

param(
  [switch]$Quiet
)

Set-StrictMode -Off
$ErrorActionPreference = 'Continue'

$Root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $Root

$Timestamp = Get-Date -Format 'yyyyMMdd-HHmm'
$LogDir = Join-Path $Root 'logs'
$ReportName = "github-preflight-$Timestamp.txt"
$LogFile = Join-Path $LogDir $ReportName
$RelativeReport = "logs\$ReportName"

if (-not (Test-Path $LogDir)) {
  New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$Lines = [System.Collections.Generic.List[string]]::new()
$Errors = 0
$Warns = 0

function Write-ReportLine([string]$Text) {
  $Lines.Add($Text)
  if (-not $Quiet) { Write-Host $Text }
}

function OK([string]$Message) {
  Write-ReportLine "  [OK]      $Message"
}

function WARN([string]$Message) {
  $script:Warns += 1
  Write-ReportLine "  [WARNING] $Message"
}

function ERR([string]$Message) {
  $script:Errors += 1
  Write-ReportLine "  [ERROR]   $Message"
}

function Section([string]$Name) {
  Write-ReportLine ''
  Write-ReportLine "-- $Name --"
}

Write-ReportLine '======================================================='
Write-ReportLine ' Sallon-ConnecT - Preflight GitHub v0.1.0'
Write-ReportLine " Date : $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
Write-ReportLine '======================================================='

Section 'Git'
$Branch = git rev-parse --abbrev-ref HEAD 2>$null
if ($Branch) { OK "Branche courante : $Branch" } else { WARN 'Impossible de lire la branche Git' }

$Status = @(git status --porcelain 2>$null)
if ($Status.Count -gt 0) {
  WARN "$($Status.Count) fichier(s) non commites detectes"
} else {
  OK 'Depot Git propre'
}

Section 'Fichiers requis'
$Required = @(
  'README.md',
  '.gitignore',
  '.env.example',
  'frontend/.env.example',
  'docs',
  '.github/workflows/tests.yml',
  'package.json',
  'frontend/package.json',
  'VERSION',
  'CHANGELOG.md',
  'ROADMAP.md',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'docs/ARCHITECTURE.md',
  'docs/SECURITY_MODEL.md',
  'docs/LOCAL_SETUP.md',
  'docs/RELEASE_CHECKLIST.md',
  'docs/VERSIONING.md'
)

foreach ($Item in $Required) {
  if (Test-Path $Item) { OK "Present : $Item" } else { ERR "Absent : $Item" }
}

Section 'Fichiers interdits suivis par Git'
$Tracked = @(git ls-files --cached 2>$null | ForEach-Object { $_ -replace '\\', '/' })

$ForbiddenRules = @(
  @{ Label = '.env reel'; Pattern = '^\.env$' },
  @{ Label = '.env.local'; Pattern = '^\.env\.local$' },
  @{ Label = 'frontend/.env.local'; Pattern = '^frontend/\.env\.local$' },
  @{ Label = 'runtime/*.json'; Pattern = '^runtime/.*\.json$' },
  @{ Label = 'backups/*.zip'; Pattern = '^backups/.*\.zip$' },
  @{ Label = 'backups/*.json'; Pattern = '^backups/.*\.json$' },
  @{ Label = 'logs/*.json|*.txt|*.log'; Pattern = '^logs/.*\.(json|txt|log)$' },
  @{ Label = 'node_modules/'; Pattern = '(^|/)node_modules(/|$)' },
  @{ Label = 'frontend/node_modules/'; Pattern = '^frontend/node_modules(/|$)' },
  @{ Label = '.next/'; Pattern = '^\.next(/|$)' },
  @{ Label = 'frontend/.next/'; Pattern = '^frontend/\.next(/|$)' },
  @{ Label = '*.pem|*.key|*.p12|*.crt'; Pattern = '\.(pem|key|p12|crt)$' }
)

foreach ($Rule in $ForbiddenRules) {
  $Found = @($Tracked | Where-Object { $_ -match $Rule.Pattern })
  if ($Found.Count -gt 0) {
    ERR "Interdit suivi : $($Rule.Label) -> $($Found -join ', ')"
  } else {
    OK "Absent du suivi : $($Rule.Label)"
  }
}

Section 'Scan contenu sensible suivi par Git'
$TextExtensions = @(
  '.bat', '.cmd', '.config', '.css', '.example', '.gitignore', '.html',
  '.js', '.json', '.md', '.mjs', '.ps1', '.ts', '.tsx', '.txt', '.webmanifest',
  '.yml', '.yaml', ''
)

$WindowsHomeRegex = [regex]::Escape(('C:' + [char]92 + 'Users' + [char]92))
$MacHomeRegex = '/' + 'Users' + '/[A-Za-z0-9._-]+'
$SerialPrefixRegex = '\b' + 'R' + '5C' + '[A-Za-z0-9]{6,}\b'
$NumericPrefixRegex = '\b' + '353' + '079' + '\d{4,}\b'
$SensitiveRules = @(
  @{ Label = 'Bearer token value'; Pattern = 'Bearer\s+[A-Za-z0-9._~+/=-]{16,}' },
  @{ Label = 'SmartThings token value'; Pattern = 'SMARTTHINGS_TOKEN\s*=\s*[A-Za-z0-9._~+/=-]{8,}' },
  @{ Label = 'IMEI-like value'; Pattern = '\bIMEI\b[^0-9\r\n]{0,16}\d{10,}|\b\d{15}\b' },
  @{ Label = 'phone-like value'; Pattern = '\b(phone|telephone)\b[^0-9\r\n]{0,24}\+?\d[\d\s().-]{5,}' },
  @{ Label = 'numero de telephone value'; Pattern = 'num[eé]ro de t[eé]l[eé]phone[^0-9\r\n]{0,24}\+?\d[\d\s().-]{5,}' },
  @{ Label = 'Samsung serial-like value'; Pattern = $SerialPrefixRegex },
  @{ Label = 'IMEI prefix-like value'; Pattern = $NumericPrefixRegex },
  @{ Label = 'macOS personal path'; Pattern = $MacHomeRegex },
  @{ Label = 'Windows personal path'; Pattern = $WindowsHomeRegex }
)

foreach ($Rule in $SensitiveRules) {
  $Hits = [System.Collections.Generic.List[string]]::new()

  foreach ($CleanFile in $Tracked) {
    
try {
    if ([string]::IsNullOrWhiteSpace($CleanFile)) {
        continue
    }

    $CleanFile = [string]$CleanFile
    $CleanFile = $CleanFile.Trim()

    if ($CleanFile.IndexOfAny([System.IO.Path]::GetInvalidPathChars()) -ge 0) {
        Write-Host "[WARN] Chemin ignore car invalide pour Test-Path." -ForegroundColor Yellow
        continue
    }

    if (-not (Test-Path -LiteralPath $CleanFile)) {
        continue
    }
}
catch {
    Write-Host "[WARN] Chemin ignore pendant le scan sensible." -ForegroundColor Yellow
    continue
}
    $Extension = [System.IO.Path]::GetExtension($CleanFile)
    if ($CleanFile -eq '.gitignore') { $Extension = '.gitignore' }
    if ($TextExtensions -notcontains $Extension) { continue }

    try {
      $CleanFileLines = Get-Content -LiteralPath $CleanFile -ErrorAction Stop
      for ($i = 0; $i -lt $CleanFileLines.Count; $i += 1) {
        if ($CleanFileLines[$i] -match $Rule.Pattern) {
          $Hits.Add("${File}:$($i + 1)")
        }
      }
    } catch {
      WARN "Scan ignore : $CleanFile"
    }
  }

  if ($Hits.Count -gt 0) {
    ERR "Contenu sensible probable ($($Rule.Label)) dans : $($Hits -join ', ')"
  } else {
    OK "Absent : $($Rule.Label)"
  }
}

Write-ReportLine ''
Write-ReportLine '======================================================='
Write-ReportLine ' RESUME'
Write-ReportLine '======================================================='

if ($Errors -eq 0 -and $Warns -eq 0) {
  Write-ReportLine '  RESULTAT : OK - depot pret pour GitHub'
} elseif ($Errors -eq 0) {
  Write-ReportLine "  RESULTAT : WARNING - $Warns avertissement(s), aucune erreur bloquante"
} else {
  Write-ReportLine "  RESULTAT : ERROR - $Errors erreur(s) bloquante(s)"
}
Write-ReportLine "  Rapport  : $RelativeReport"
Write-ReportLine '======================================================='

$Lines | Set-Content -Path $LogFile -Encoding utf8

if ($Errors -gt 0) {
  if (-not $Quiet) {
    Write-Host ''
    Write-Host "ECHEC : $Errors erreur(s) bloquante(s). Corriger avant publication." -ForegroundColor Red
  }
  exit 1
}

if ($Warns -gt 0 -and -not $Quiet) {
  Write-Host ''
  Write-Host "ATTENTION : $Warns avertissement(s). Verifier avant publication." -ForegroundColor Yellow
}

exit 0
