param(
  [string]$Version = '',
  [string]$BuildNumber = '',
  [switch]$SkipValidation
)

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$Dist = Join-Path $Root 'dist'
$Logs = Join-Path $Root 'logs'

if (-not $Version) {
  $VersionFile = Join-Path $Root 'VERSION'
  if (Test-Path $VersionFile) {
    $Version = (Get-Content -Raw -Encoding UTF8 $VersionFile).Trim()
  }
  else {
    $Version = '0.4.0'
  }
}

if (-not $BuildNumber) {
  $BuildNumber = Get-Date -Format 'yyyyMMdd-HHmmss'
}

New-Item -Path $Dist -ItemType Directory -Force | Out-Null
New-Item -Path $Logs -ItemType Directory -Force | Out-Null

$Report = New-Object System.Collections.Generic.List[string]

function Add-Report {
  param([string]$Line)
  $Report.Add($Line) | Out-Null
  Write-Host $Line
}

function Invoke-NativeStep {
  param(
    [string]$Name,
    [string]$FilePath,
    [string[]]$Arguments,
    [string]$WorkingDirectory
  )

  Add-Report ""
  Add-Report "== $Name =="
  Add-Report "Command: $FilePath $($Arguments -join ' ')"
  $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -Wait -PassThru -NoNewWindow
  if ($process.ExitCode -ne 0) {
    throw "$Name a echoue avec le code $($process.ExitCode)."
  }
  Add-Report "OK: $Name"
}

function Invoke-ScriptStep {
  param(
    [string]$Name,
    [string]$ScriptPath,
    [string[]]$Arguments
  )

  $args = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $ScriptPath) + $Arguments
  Invoke-NativeStep -Name $Name -FilePath 'powershell.exe' -Arguments $args -WorkingDirectory $Root
}

function Get-ToolPath {
  param([string]$Preferred, [string]$Fallback)
  $cmd = Get-Command $Preferred -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  $fallbackCmd = Get-Command $Fallback -ErrorAction SilentlyContinue
  if ($fallbackCmd) { return $fallbackCmd.Source }
  throw "Commande introuvable: $Preferred ou $Fallback"
}

function Test-NodeRuntime {
  $node = Get-Command node.exe -ErrorAction SilentlyContinue
  if (-not $node) { throw 'Node.js introuvable dans PATH.' }
  $raw = (& node -v).Trim()
  Add-Report "Node detecte: $raw"
  $version = $raw.TrimStart('v')
  $parts = @($version.Split('.') | ForEach-Object { [int]$_ })
  if ($parts[0] -lt 22 -or ($parts[0] -eq 22 -and $parts[1] -lt 13)) {
    Add-Report "WARN: Node >=22.13.0 recommande, version courante $raw."
  }
  else {
    Add-Report 'OK: Node >=22.13.0'
  }
}

$Tool = Get-ToolPath -Preferred 'pnpm.cmd' -Fallback 'npm.cmd'
$ToolName = Split-Path $Tool -Leaf

Add-Report "# Sallon-ConnecT release locale v$Version"
Add-Report "Build: $BuildNumber"
Add-Report "Date: $(Get-Date -Format o)"
Add-Report "Root: $Root"
Add-Report "Runner: $ToolName"
Test-NodeRuntime

if (-not $SkipValidation) {
  Invoke-NativeStep -Name 'Lint' -FilePath $Tool -Arguments @('lint') -WorkingDirectory $Root
  Invoke-NativeStep -Name 'Tests complets' -FilePath $Tool -Arguments @('test') -WorkingDirectory $Root
  Invoke-NativeStep -Name 'Build frontend' -FilePath $Tool -Arguments @('build') -WorkingDirectory $Root
  Invoke-NativeStep -Name 'Tests backend isoles' -FilePath $Tool -Arguments @('test:backend') -WorkingDirectory $Root
}
else {
  Add-Report 'WARN: validations lint/test/build ignorees par -SkipValidation.'
}

$PackageScript = Join-Path $Root 'scripts\windows\package-portable.ps1'
Invoke-ScriptStep -Name 'Packaging ZIP portable' -ScriptPath $PackageScript -Arguments @()

$ZipFile = Get-ChildItem -Path $Dist -Filter 'Sallon-ConnecT-Portable-*.zip' -ErrorAction Stop |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1

if (-not $ZipFile) {
  throw 'ZIP portable introuvable apres packaging.'
}

$VerifyScript = Join-Path $Root 'scripts\windows\release\verify-release.ps1'
Invoke-ScriptStep -Name 'Verification release local-only' -ScriptPath $VerifyScript -Arguments @('-ZipPath', $ZipFile.FullName, '-Version', $Version)

$Hash = Get-FileHash -Path $ZipFile.FullName -Algorithm SHA256
$HashValue = $Hash.Hash.ToLowerInvariant()
$SizeMb = [Math]::Round($ZipFile.Length / 1MB, 2)

$ChecksumFile = Join-Path $Dist "Sallon-ConnecT-v$Version-sha256.txt"
Set-Content -Path $ChecksumFile -Encoding UTF8 -Value @(
  "# Sallon-ConnecT v$Version SHA256"
  "# Build $BuildNumber"
  "$HashValue  $($ZipFile.Name)"
)

$MetadataFile = Join-Path $Dist "Sallon-ConnecT-v$Version-release.json"
$Metadata = [PSCustomObject]@{
  project = 'Sallon-ConnecT'
  version = $Version
  tag = "v$Version"
  buildNumber = $BuildNumber
  releaseDate = (Get-Date -Format o)
  recommendedNode = '>=22.13.0'
  zip = $ZipFile.Name
  zipSizeMb = $SizeMb
  sha256 = $HashValue
  localOnly = $true
  limitations = @(
    'Node.js requis sur la machine cible',
    'Dependances npm non incluses dans le ZIP',
    'Fichiers .env reels non inclus',
    'SSE limite a localhost',
    'Exports JSON limites aux diagnostics non sensibles'
  )
}
$Metadata | ConvertTo-Json -Depth 5 | Set-Content -Path $MetadataFile -Encoding UTF8

Add-Report ""
Add-Report "== Artefacts =="
Add-Report "ZIP: dist\$($ZipFile.Name)"
Add-Report "Taille ZIP: $SizeMb MB"
Add-Report "SHA256: $HashValue"
Add-Report "Checksum: dist\$(Split-Path $ChecksumFile -Leaf)"
Add-Report "Metadata: dist\$(Split-Path $MetadataFile -Leaf)"
Add-Report "Tag propose: v$Version"

$ReportFile = Join-Path $Dist "Sallon-ConnecT-v$Version-release-report-$BuildNumber.txt"
$Report | Set-Content -Path $ReportFile -Encoding UTF8
Write-Host ""
Write-Host "Release locale construite: dist\$(Split-Path $ReportFile -Leaf)" -ForegroundColor Green
