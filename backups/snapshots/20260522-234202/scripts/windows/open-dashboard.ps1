param(
  [switch]$NoOpen
)

$ErrorActionPreference = 'SilentlyContinue'

function Test-Url {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
  }
  catch {
    return $false
  }
}

$target = $null
if (Test-Url 'http://localhost:3001') {
  $target = 'http://localhost:3001'
}
elseif (Test-Url 'http://localhost:3000') {
  $target = 'http://localhost:3000'
}

if ($target) {
  Write-Host "Dashboard disponible: $target" -ForegroundColor Green
  if (-not $NoOpen) { Start-Process $target }
}
else {
  Write-Host "Sallon-ConnecT ne semble pas demarre" -ForegroundColor Yellow
  exit 1
}
