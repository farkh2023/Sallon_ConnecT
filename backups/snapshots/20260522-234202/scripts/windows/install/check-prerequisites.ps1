param(
  [switch]$Quiet
)

$ErrorActionPreference = 'Continue'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..\..')
$Results = [System.Collections.Generic.List[object]]::new()
$Errors = 0

function Add-Check {
  param(
    [string]$Name,
    [string]$Status,
    [string]$Message
  )

  if ($Status -eq 'ERROR') { $script:Errors += 1 }
  $Results.Add([PSCustomObject]@{
    Check = $Name
    Status = $Status
    Message = $Message
  })
}

function Get-ListeningPid {
  param([int]$Port)

  $pids = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique)

  if ($pids.Count -eq 0) {
    $pids = @(
      netstat -ano 2>$null |
        Select-String -Pattern "[:.]$Port\s+.*LISTENING\s+\d+$" |
        ForEach-Object { ($_ -split '\s+')[-1] } |
        Sort-Object -Unique
    )
  }

  $pids
}

function Test-SallonProcess {
  param([int[]]$Pids)

  foreach ($processId in $Pids) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId=$processId" -ErrorAction SilentlyContinue
    if ($process -and $process.CommandLine -match 'Sallon[_-]ConnecT|start-sallon-connect|frontend|server\.js|next') {
      return $true
    }
  }

  return $false
}

function Test-NodeVersion {
  param([string]$RawVersion)

  $clean = $RawVersion.TrimStart('v')
  $parts = @($clean.Split('.') | ForEach-Object { [int]$_ })
  if ($parts.Count -lt 2) { return 'warning' }
  if ($parts[0] -gt 22) { return 'ok' }
  if ($parts[0] -eq 22 -and $parts[1] -gt 13) { return 'ok' }
  if ($parts[0] -eq 22 -and $parts[1] -eq 13) { return 'ok' }
  return 'warning'
}

$isWindows = [Environment]::OSVersion.Platform -eq [System.PlatformID]::Win32NT
if ($isWindows) {
  Add-Check 'Windows' 'OK' 'Systeme Windows detecte.'
} else {
  Add-Check 'Windows' 'ERROR' 'Ce script est prevu pour Windows.'
}

if ($PSVersionTable.PSVersion) {
  Add-Check 'PowerShell' 'OK' "Version $($PSVersionTable.PSVersion)."
} else {
  Add-Check 'PowerShell' 'ERROR' 'PowerShell introuvable.'
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $nodeVersion = (& node -v 2>$null)
  $nodeStatus = Test-NodeVersion -RawVersion $nodeVersion
  if ($nodeStatus -eq 'ok') {
    Add-Check 'Node.js' 'OK' "Version $nodeVersion."
  } else {
    Add-Check 'Node.js' 'WARNING' "Version $nodeVersion detectee. Node.js 22.13 ou plus recent est recommande."
  }
} else {
  Add-Check 'Node.js' 'ERROR' 'Node.js absent. Installer Node.js avant de continuer.'
}

$npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npm) { $npm = Get-Command npm -ErrorAction SilentlyContinue }
if ($npm) {
  $npmVersion = (& $npm.Source -v 2>$null)
  Add-Check 'npm' 'OK' "Version $npmVersion."
} else {
  Add-Check 'npm' 'ERROR' 'npm absent. Installer Node.js avec npm.'
}

$git = Get-Command git -ErrorAction SilentlyContinue
if ($git) {
  Add-Check 'Git' 'OK' 'Git disponible.'
} else {
  Add-Check 'Git' 'WARNING' 'Git absent. Il reste optionnel pour une installation locale.'
}

foreach ($port in @(3000, 3001)) {
  $pids = @(Get-ListeningPid -Port $port)
  if ($pids.Count -eq 0) {
    Add-Check "Port $port" 'OK' 'Port disponible.'
  } elseif (Test-SallonProcess -Pids $pids) {
    Add-Check "Port $port" 'OK' 'Port deja utilise par un processus local compatible Sallon-ConnecT.'
  } else {
    Add-Check "Port $port" 'WARNING' 'Port deja utilise par un autre processus local.'
  }
}

$drive = Get-PSDrive -Name ([System.IO.Path]::GetPathRoot($Root.Path).Substring(0, 1)) -ErrorAction SilentlyContinue
if ($drive) {
  $freeGb = [math]::Round($drive.Free / 1GB, 1)
  if ($freeGb -ge 1) {
    Add-Check 'Espace disque' 'OK' "$freeGb Go libres."
  } else {
    Add-Check 'Espace disque' 'WARNING' "$freeGb Go libres. Prevoir plus d'espace pour les dependances et builds."
  }
} else {
  Add-Check 'Espace disque' 'WARNING' 'Impossible de mesurer l espace disque.'
}

$probe = Join-Path $Root '.install-write-test.tmp'
try {
  Set-Content -Path $probe -Value 'ok' -Encoding ascii -ErrorAction Stop
  Remove-Item -LiteralPath $probe -Force -ErrorAction SilentlyContinue
  Add-Check 'Droits utilisateur' 'OK' 'Ecriture autorisee dans le dossier projet.'
} catch {
  Add-Check 'Droits utilisateur' 'ERROR' 'Ecriture impossible dans le dossier projet.'
}

if (-not $Quiet) {
  Write-Host ''
  Write-Host 'Pre-requis Sallon-ConnecT' -ForegroundColor Cyan
  $Results | Format-Table Check, Status, Message -AutoSize
}

if ($Errors -gt 0) { exit 1 }
exit 0
