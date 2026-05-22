param()

$ErrorActionPreference = 'Stop'

function Write-Step {
  param([string]$Message)
  Write-Host ""
  Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Require-Command {
  param([string]$Name)
  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if (-not $command) {
    throw "$Name est introuvable. Installez Node.js LTS puis relancez ce script."
  }
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Frontend = Join-Path $Root 'frontend'

Write-Step 'Verification Node.js'
Require-Command 'node'
Require-Command 'npm.cmd'

$nodeVersion = (& node -v)
$npmVersion = (& npm.cmd -v)
Write-Host "Node.js : $nodeVersion"
Write-Host "npm     : $npmVersion"

Write-Step 'Installation dependances racine'
Push-Location $Root
try {
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install racine a echoue avec le code $LASTEXITCODE" }
}
finally {
  Pop-Location
}

Write-Step 'Installation dependances frontend'
Push-Location $Frontend
try {
  & npm.cmd install
  if ($LASTEXITCODE -ne 0) { throw "npm install frontend a echoue avec le code $LASTEXITCODE" }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "Dependances installees avec succes." -ForegroundColor Green
Write-Host "Aucune dependance globale n'a ete installee."
