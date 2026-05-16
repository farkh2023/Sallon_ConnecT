param()

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Logs = Join-Path $Root 'logs'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$Report = Join-Path $Logs "diagnostic-$Stamp.txt"

New-Item -Path $Logs -ItemType Directory -Force | Out-Null

$lines = New-Object System.Collections.Generic.List[string]

function Add-Line {
  param([string]$Line)
  $lines.Add($Line) | Out-Null
  Write-Host $Line
}

function Command-Version {
  param([string]$Command, [string[]]$CommandArgs)
  $cmd = Get-Command $Command -ErrorAction SilentlyContinue
  if (-not $cmd) { return 'absent' }
  try { return (& $Command @CommandArgs 2>$null) -join ' ' }
  catch { return 'erreur' }
}

function Port-Status {
  param([int]$Port)
  $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)

  if ($pids.Count -eq 0) {
    $pids = @(
      netstat -ano |
        Select-String -Pattern "[:.]$Port\s+.*LISTENING\s+\d+$" |
        ForEach-Object { ($_ -split '\s+')[-1] } |
        Sort-Object -Unique
    )
  }

  if ($pids.Count -gt 0) { return "OK PID $($pids -join ',')" }
  return 'libre'
}

function Http-Status {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
    return "OK HTTP $($response.StatusCode)"
  }
  catch {
    return 'indisponible'
  }
}

function Path-Status {
  param([string]$RelativePath)
  if (Test-Path (Join-Path $Root $RelativePath)) { return 'present' }
  return 'absent'
}

Add-Line 'Sallon-ConnecT diagnostic local'
Add-Line "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Line 'Projet: Sallon-ConnecT'
Add-Line ''
Add-Line "Windows: $([Environment]::OSVersion.VersionString)"
Add-Line "PowerShell: $($PSVersionTable.PSVersion)"
Add-Line "Node.js: $(Command-Version 'node' @('-v'))"
Add-Line "npm: $(Command-Version 'npm.cmd' @('-v'))"
Add-Line "Git: $(Command-Version 'git' @('--version'))"
Add-Line ''
Add-Line "Port 3000: $(Port-Status 3000)"
Add-Line "Port 3001: $(Port-Status 3001)"
Add-Line "Backend health: $(Http-Status 'http://localhost:3000/api/health')"
Add-Line "Frontend Next: $(Http-Status 'http://localhost:3001')"
Add-Line ''
foreach ($path in @('assets', 'data', 'docs', 'frontend', 'scripts', 'server', 'runtime', 'logs')) {
  Add-Line "$path/: $(Path-Status $path)"
}
Add-Line ".env.example: $(Path-Status '.env.example')"
Add-Line "README.md: $(Path-Status 'README.md')"
Add-Line "docs/PHASE15.md: $(Path-Status 'docs/PHASE15.md')"
Add-Line "docs/PHASE16.md: $(Path-Status 'docs/PHASE16.md')"
Add-Line ''

$envPath = Join-Path $Root '.env'
if (Test-Path $envPath) {
  $envSize = (Get-Item $envPath).Length
  if ($envSize -gt 0) {
    Add-Line '.env: present non vide (contenu masque)'
  }
  else {
    Add-Line '.env: WARNING present mais vide'
  }
}
else {
  Add-Line '.env: absent'
}

$gitignore = Join-Path $Root '.gitignore'
if ((Test-Path $gitignore) -and (Select-String -Path $gitignore -Pattern 'runtime/\*\.json' -Quiet)) {
  Add-Line 'runtime/*.json: ignore Git configure'
}
else {
  Add-Line 'runtime/*.json: WARNING ignore Git non verifie'
}

Add-Line ''
Add-Line 'Aucun contenu .env, token, cle, IMEI, IP complete ou chemin prive n est imprime.'

$lines | Set-Content -Path $Report -Encoding UTF8
Write-Host ""
Write-Host "Rapport diagnostic cree: logs/$(Split-Path $Report -Leaf)" -ForegroundColor Green
