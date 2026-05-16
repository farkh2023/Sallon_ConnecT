param()

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Logs = Join-Path $Root 'logs'

function Test-Port {
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
  return 'WARNING libre'
}

function Test-Http {
  param([string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 4
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
      return "OK HTTP $($response.StatusCode)"
    }
    return "WARNING HTTP $($response.StatusCode)"
  }
  catch {
    return 'ERROR indisponible'
  }
}

function Test-Exists {
  param([string]$RelativePath)
  if (Test-Path (Join-Path $Root $RelativePath)) { return 'OK present' }
  return 'WARNING absent'
}

$lastLog = 'WARNING aucun'
if (Test-Path $Logs) {
  $file = Get-ChildItem -Path $Logs -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($file) { $lastLog = "OK $($file.Name) $($file.LastWriteTime.ToString('yyyy-MM-dd HH:mm'))" }
}

$rows = @(
  [PSCustomObject]@{ Check = 'Port 3000'; Status = Test-Port 3000 }
  [PSCustomObject]@{ Check = 'Port 3001'; Status = Test-Port 3001 }
  [PSCustomObject]@{ Check = 'Backend health'; Status = Test-Http 'http://localhost:3000/api/health' }
  [PSCustomObject]@{ Check = 'Frontend Next'; Status = Test-Http 'http://localhost:3001' }
  [PSCustomObject]@{ Check = '.env'; Status = Test-Exists '.env' }
  [PSCustomObject]@{ Check = 'frontend/.env.local'; Status = Test-Exists 'frontend/.env.local' }
  [PSCustomObject]@{ Check = 'runtime/'; Status = Test-Exists 'runtime' }
  [PSCustomObject]@{ Check = 'logs/'; Status = Test-Exists 'logs' }
  [PSCustomObject]@{ Check = 'Dernier log'; Status = $lastLog }
)

$rows | Format-Table -AutoSize
