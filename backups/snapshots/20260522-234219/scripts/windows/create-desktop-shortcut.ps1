param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).ProviderPath
$Target = Join-Path $ScriptDir 'start-sallon-connect.bat'
$Desktop = [Environment]::GetFolderPath('DesktopDirectory')
$ShortcutPath = Join-Path $Desktop 'Sallon-ConnecT.lnk'

if (-not (Test-Path $Target)) {
    throw "Wrapper de lancement introuvable: scripts/windows/start-sallon-connect.bat"
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($ShortcutPath)
$shortcut.TargetPath = [string]$Target
$shortcut.WorkingDirectory = [string]$Root
$shortcut.Description = 'Lancer Sallon-ConnecT local'
$shortcut.Save()

Write-Host "Raccourci Bureau cree: Sallon-ConnecT" -ForegroundColor Green