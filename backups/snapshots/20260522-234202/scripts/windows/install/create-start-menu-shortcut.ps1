param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..\..')
$WindowsScripts = Join-Path $Root 'scripts\windows'
$StartMenuRoot = Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\Sallon-ConnecT'

function New-Shortcut {
  param(
    [string]$Name,
    [string]$Target,
    [string]$Description
  )

  if (-not (Test-Path $Target)) {
    Write-Warning "Raccourci ignore, cible introuvable: $Name"
    return
  }

  New-Item -Path $StartMenuRoot -ItemType Directory -Force | Out-Null
  $shortcutPath = Join-Path $StartMenuRoot "$Name.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $Target
  $shortcut.WorkingDirectory = (Resolve-Path $Root).Path
  $shortcut.Description = $Description
  $shortcut.Save()
  Write-Host "Raccourci Menu Demarrer cree: $Name" -ForegroundColor Green
}

New-Shortcut -Name 'Sallon-ConnecT' -Target (Join-Path $WindowsScripts 'start-sallon-connect.bat') -Description 'Lancer Sallon-ConnecT local'
New-Shortcut -Name 'Ouvrir Dashboard' -Target (Join-Path $WindowsScripts 'open-dashboard.bat') -Description 'Ouvrir le dashboard Sallon-ConnecT'
New-Shortcut -Name 'Arreter Sallon-ConnecT' -Target (Join-Path $WindowsScripts 'stop-sallon-connect.bat') -Description 'Arreter Sallon-ConnecT'
New-Shortcut -Name 'Statut Sallon-ConnecT' -Target (Join-Path $WindowsScripts 'status-sallon-connect.bat') -Description 'Afficher le statut local'
