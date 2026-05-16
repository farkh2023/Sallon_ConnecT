param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Frontend = Join-Path $Root 'frontend'

Push-Location $Frontend
try {
  Write-Host "Lint frontend..." -ForegroundColor Cyan
  & npm.cmd run lint
  if ($LASTEXITCODE -ne 0) { throw "npm run lint a echoue avec le code $LASTEXITCODE" }

  Write-Host "Build frontend..." -ForegroundColor Cyan
  & npm.cmd run build
  if ($LASTEXITCODE -ne 0) { throw "npm run build a echoue avec le code $LASTEXITCODE" }
}
finally {
  Pop-Location
}

Write-Host "Frontend compile avec succes." -ForegroundColor Green
