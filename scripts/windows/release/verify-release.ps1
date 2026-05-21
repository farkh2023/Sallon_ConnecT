param(
  [string]$ZipPath = '',
  [string]$Version = ''
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$Dist = Join-Path $Root 'dist'

if (-not $Version) {
  $VersionFile = Join-Path $Root 'VERSION'
  if (Test-Path $VersionFile) {
    $Version = (Get-Content -Raw -Encoding UTF8 $VersionFile).Trim()
  }
  else {
    $Version = '0.4.0'
  }
}

if (-not $ZipPath) {
  $latest = Get-ChildItem -Path $Dist -Filter 'Sallon-ConnecT-Portable-*.zip' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($latest) { $ZipPath = $latest.FullName }
}

if (-not $ZipPath -or -not (Test-Path $ZipPath)) {
  throw 'Aucun ZIP portable a verifier. Lancez package-portable.ps1 ou build-release.ps1.'
}

$ZipPath = (Resolve-Path $ZipPath).Path

$Failures = New-Object System.Collections.Generic.List[string]
$Warnings = New-Object System.Collections.Generic.List[string]

function Add-Failure {
  param([string]$Message)
  $Failures.Add($Message) | Out-Null
  Write-Host "FAIL $Message" -ForegroundColor Red
}

function Add-WarningLine {
  param([string]$Message)
  $Warnings.Add($Message) | Out-Null
  Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Add-Pass {
  param([string]$Message)
  Write-Host "OK   $Message" -ForegroundColor Green
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
try {
  $Entries = @($zip.Entries | ForEach-Object { $_.FullName.Replace('\', '/').TrimStart('/') } | Where-Object { $_ })

  function Test-EntryPresent {
    param([string]$Entry)
    if ($Entries -contains $Entry) {
      Add-Pass "ZIP contient $Entry"
    }
    else {
      Add-Failure "ZIP entree manquante: $Entry"
    }
  }

  function Test-DirectoryPresent {
    param([string]$Directory)
    $prefix = $Directory.TrimEnd('/') + '/'
    if ($Entries | Where-Object { $_.StartsWith($prefix) } | Select-Object -First 1) {
      Add-Pass "ZIP contient $prefix"
    }
    else {
      Add-Failure "ZIP dossier manquant: $prefix"
    }
  }

  function Read-ZipTextEntry {
    param([string]$EntryName)
    $entry = $zip.Entries | Where-Object { $_.FullName.Replace('\', '/').TrimStart('/') -eq $EntryName } | Select-Object -First 1
    if (-not $entry) { return '' }
    $stream = $entry.Open()
    try {
      $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8, $true)
      try { return $reader.ReadToEnd() }
      finally { $reader.Dispose() }
    }
    finally {
      $stream.Dispose()
    }
  }

  foreach ($dir in @('frontend', 'server', 'docs', 'scripts', 'logs')) {
    Test-DirectoryPresent $dir
  }

  foreach ($entry in @(
    'README.md',
    'CHANGELOG.md',
    'ROADMAP.md',
    'VERSION',
    'package.json',
    'package-lock.json',
    'server.js',
    'frontend/package.json',
    'frontend/package-lock.json',
    'docs/PHASE32.md',
    'docs/releases/v0.4.0.md',
    'scripts/windows/start-sallon-connect.ps1',
    'scripts/windows/release/start-release.ps1',
    'scripts/windows/release/verify-release.ps1'
  )) {
    Test-EntryPresent $entry
  }

  $forbiddenPatterns = @(
    @{ Label = '.git'; Pattern = '(^|/)\.git(/|$)' },
    @{ Label = '.env reel'; Pattern = '(^|/)\.env$' },
    @{ Label = '.env.local'; Pattern = '(^|/)\.env\.local$' },
    @{ Label = 'node_modules'; Pattern = '(^|/)node_modules(/|$)' },
    @{ Label = 'cache/temp'; Pattern = '(^|/)(cache|\.cache|tmp|temp|\.turbo|\.vite)(/|$)' },
    @{ Label = '.next'; Pattern = '(^|/)\.next(/|$)' },
    @{ Label = 'runtime json'; Pattern = '^runtime/.*\.json$' },
    @{ Label = 'backup prive'; Pattern = '^backups/.*\.(zip|json)$' },
    @{ Label = 'logs bruts'; Pattern = '^logs/.*\.(json|txt|log)$' },
    @{ Label = 'cles/certificats'; Pattern = '\.(pem|key|p12|crt)$' }
  )

  foreach ($rule in $forbiddenPatterns) {
    $matches = @($Entries | Where-Object { $_ -match $rule.Pattern })
    if ($matches.Count -gt 0) {
      Add-Failure "$($rule.Label) inclus dans ZIP: $($matches -join ', ')"
    }
    else {
      Add-Pass "Exclusion $($rule.Label)"
    }
  }

  $diagnostics = Read-ZipTextEntry 'server/src/routes/diagnostics.js'
  if ($diagnostics -match 'localOnly:\s*true' -and $diagnostics -match 'cloudServices:\s*false' -and $diagnostics -match 'externalPush:\s*false') {
    Add-Pass 'Diagnostics local-only confirme'
  }
  else {
    Add-Failure 'Diagnostics local-only non confirme'
  }

  $events = Read-ZipTextEntry 'server/src/routes/events.js'
  if ($events -match 'http://localhost:3000' -and $events -match 'http://localhost:3001' -and $events -match 'ALLOWED_ORIGINS') {
    Add-Pass 'SSE limite aux origines localhost attendues'
  }
  else {
    Add-Failure 'SSE local-only non confirme'
  }

  $diagHook = Read-ZipTextEntry 'frontend/src/hooks/useDiagnosticsOverview.ts'
  if ($diagHook -match '/api/diagnostics/overview' -and $diagHook -match 'backup') {
    Add-Pass 'Hook diagnostic inclut endpoint et backup'
  }
  else {
    Add-Failure 'Hook diagnostic incomplet'
  }

  $textExtensions = @('.js', '.ts', '.tsx', '.json', '.md', '.html', '.ps1', '.bat', '.txt', '.yml', '.yaml', '.css')
  $secretRules = @(
    @{ Label = 'Bearer token probable'; Pattern = 'Bearer\s+(?!\[token|<token|TOKEN|REDACTED|masqu)[A-Za-z0-9._~+/=-]{20,}' },
    @{ Label = 'Secret assigne probable'; Pattern = '(?i)\b(token|password|secret|api[_-]?key)\s*[:=]\s*(?!\[|<|""|''''|false|true|null|undefined|masqu|placeholder|token-placeholder|your-|votre-|absent|process\.env|config\.|String\(|Boolean\()[A-Za-z0-9._~+/=-]{12,}' }
  )

  foreach ($entry in $zip.Entries) {
    $name = $entry.FullName.Replace('\', '/').TrimStart('/')
    $extension = [System.IO.Path]::GetExtension($name)
    if ($entry.Length -gt 1MB) { continue }
    if ($textExtensions -notcontains $extension) { continue }

    $content = Read-ZipTextEntry $name
    foreach ($rule in $secretRules) {
      if ($content -match $rule.Pattern) {
        Add-Failure "$($rule.Label) dans $name"
      }
    }
  }
  Add-Pass 'Scan secrets probable termine'

  $hash = Get-FileHash -Path $ZipPath -Algorithm SHA256
  $sizeMb = [Math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
  Add-Pass "SHA256 $($hash.Hash.ToLowerInvariant())"
  Add-Pass "Taille ZIP $sizeMb MB"

  if ($Warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "Avertissements: $($Warnings.Count)" -ForegroundColor Yellow
  }

  if ($Failures.Count -gt 0) {
    Write-Host ""
    Write-Host "Verification release echouee: $($Failures.Count) probleme(s)." -ForegroundColor Red
    exit 1
  }

  Write-Host ""
  Write-Host "Release v$Version verifiee: ZIP portable local-only valide." -ForegroundColor Green
}
finally {
  $zip.Dispose()
}
