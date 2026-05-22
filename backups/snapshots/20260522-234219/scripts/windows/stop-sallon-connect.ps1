param(
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Get-ListeningPid {
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

  $pids
}

function Is-SystemProcess {
  param([System.Diagnostics.Process]$Process)
  if ($Process.Id -in @(0, 4)) { return $true }
  return $Process.ProcessName -in @('Idle', 'System', 'Registry', 'smss', 'csrss', 'wininit', 'services', 'lsass', 'svchost')
}

$ports = @(3000, 3001)
$targets = foreach ($port in $ports) {
  foreach ($processId in (Get-ListeningPid -Port $port)) {
    $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($process) {
      [PSCustomObject]@{
        Port = $port
        Pid = $process.Id
        Name = $process.ProcessName
        Safe = -not (Is-SystemProcess -Process $process)
      }
    }
  }
}

if (-not $targets -or $targets.Count -eq 0) {
  Write-Host "Aucun processus en ecoute sur les ports 3000 ou 3001."
  exit 0
}

Write-Host "Processus detectes:" -ForegroundColor Cyan
$targets | Format-Table Port, Pid, Name, Safe -AutoSize

if (($targets | Select-Object -ExpandProperty Pid -Unique).Count -gt 1 -and -not $Force) {
  $answer = Read-Host "Plusieurs processus seront arretes. Continuer ? (o/N)"
  if ($answer -notin @('o', 'O', 'oui', 'Oui', 'y', 'Y', 'yes', 'Yes')) {
    Write-Host "Arret annule."
    exit 1
  }
}

foreach ($target in ($targets | Sort-Object Pid -Unique)) {
  if (-not $target.Safe) {
    Write-Warning "PID $($target.Pid) ignore: processus systeme."
    continue
  }

  Write-Host "Arret PID $($target.Pid) ($($target.Name)) sur port $($target.Port)."
  try {
    if ($Force) {
      Stop-Process -Id $target.Pid -Force -ErrorAction Stop
    }
    else {
      Stop-Process -Id $target.Pid -ErrorAction Stop
    }
  }
  catch {
    Write-Warning "Impossible d'arreter PID $($target.Pid): $($_.Exception.Message)"
    continue
  }

  Start-Sleep -Milliseconds 500
  if (Get-Process -Id $target.Pid -ErrorAction SilentlyContinue) {
    Write-Warning "PID $($target.Pid) encore actif apres la demande d'arret. Fermez le processus depuis le Gestionnaire des taches si necessaire."
  }
}

Write-Host "Commande d'arret terminee."
