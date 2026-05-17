$ErrorActionPreference = 'Stop'

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$scriptsDir = Join-Path $root 'scripts\windows'
$scripts = @(Get-ChildItem -Path $scriptsDir -Filter '*.ps1' -File -Recurse)

if ($scripts.Count -eq 0) {
  throw 'Aucun script PowerShell trouve dans scripts/windows.'
}

$errorsFound = 0
foreach ($script in $scripts) {
  $tokens = $null
  $errors = $null
  [System.Management.Automation.Language.Parser]::ParseFile($script.FullName, [ref]$tokens, [ref]$errors) | Out-Null
  if ($errors.Count -gt 0) {
    $errorsFound += $errors.Count
    Write-Host "ERREUR $($script.Name)" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  $($_.Message)" -ForegroundColor Red }
  }
  else {
    Write-Host "OK $($script.Name)" -ForegroundColor Green
  }
}

if ($errorsFound -gt 0) {
  throw "$errorsFound erreur(s) de syntaxe PowerShell detectee(s)."
}

Write-Host ""
Write-Host "$($scripts.Count) script(s) PowerShell valides. Aucun script n'a ete execute." -ForegroundColor Green
