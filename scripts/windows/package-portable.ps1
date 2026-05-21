param()

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Resolve-Path (Join-Path $ScriptDir '..\..')
$Dist = Join-Path $Root 'dist'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmm'
$ZipPath = Join-Path $Dist "Sallon-ConnecT-Portable-$Stamp.zip"
$StageRoot = Join-Path $Dist "_portable-stage-$Stamp"
$StageApp = Join-Path $StageRoot 'Sallon-ConnecT'

New-Item -Path $Dist -ItemType Directory -Force | Out-Null
if (Test-Path $StageRoot) { Remove-Item -LiteralPath $StageRoot -Recurse -Force }
New-Item -Path $StageApp -ItemType Directory -Force | Out-Null

$excludedDirs = @('.git', 'node_modules', '.next', 'logs', 'dist', 'tests', '__tests__', 'coverage', 'cache', '.cache', 'tmp', 'temp', '.turbo', '.vite')
$excludedFiles = @('.env', '.env.local', '.env.production', 'secrets.json', 'config.local.json')
$excludedExtensions = @('.pem', '.key', '.p12', '.crt')

function Should-Exclude {
  param(
    [string]$RelativePath,
    [bool]$IsDirectory
  )

  $normalized = $RelativePath.Replace('\', '/')
  $segments = @($normalized.Split('/') | Where-Object { $_ })
  foreach ($segment in $segments) {
    if ($excludedDirs -contains $segment) { return $true }
  }

  $leaf = Split-Path $normalized -Leaf
  if ($excludedFiles -contains $leaf) { return $true }
  if (-not $IsDirectory -and $normalized -like 'runtime/*.json') { return $true }
  if (-not $IsDirectory -and $normalized -like 'backups/*.zip') { return $true }
  if (-not $IsDirectory -and $normalized -like 'backups/*.json') { return $true }
  if (-not $IsDirectory -and $normalized -match '^logs/.*\.(json|txt|log)$') { return $true }
  if (-not $IsDirectory -and $normalized -match '(^|/).*(token|secret|credential|private).*$') { return $true }

  $extension = [System.IO.Path]::GetExtension($leaf)
  if ($excludedExtensions -contains $extension) { return $true }

  return $false
}

function Copy-SafeTree {
  param(
    [string]$Source,
    [string]$Destination
  )

  $sourceRoot = (Resolve-Path $Source).Path.TrimEnd('\')
  New-Item -Path $Destination -ItemType Directory -Force | Out-Null

  Get-ChildItem -LiteralPath $Source -Force -Recurse | ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length).TrimStart('\')
    if (-not $relative) { return }
    if (Should-Exclude -RelativePath $relative -IsDirectory $_.PSIsContainer) { return }

    $target = Join-Path $Destination $relative
    if ($_.PSIsContainer) {
      New-Item -Path $target -ItemType Directory -Force | Out-Null
    }
    else {
      $parent = Split-Path -Parent $target
      New-Item -Path $parent -ItemType Directory -Force | Out-Null
      Copy-Item -LiteralPath $_.FullName -Destination $target -Force
    }
  }
}

$directories = @('assets', 'data', 'docs', 'frontend', 'scripts', 'server')
foreach ($directory in $directories) {
  $source = Join-Path $Root $directory
  if (Test-Path $source) {
    Copy-SafeTree -Source $source -Destination (Join-Path $StageApp $directory)
  }
}

$files = @(
  'index.html',
  'server.js',
  'package.json',
  'package-lock.json',
  'README.md',
  'CHANGELOG.md',
  'ROADMAP.md',
  'VERSION',
  'SECURITY.md',
  '.env.example',
  'sallon-connect-hub.html'
)

foreach ($file in $files) {
  $source = Join-Path $Root $file
  if (Test-Path $source) {
    Copy-Item -LiteralPath $source -Destination (Join-Path $StageApp $file) -Force
  }
}

New-Item -Path (Join-Path $StageApp 'runtime') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'logs') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'backups') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'dist') -ItemType Directory -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'runtime/.gitkeep') -ItemType File -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'logs/.gitkeep') -ItemType File -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'backups/.gitkeep') -ItemType File -Force | Out-Null
New-Item -Path (Join-Path $StageApp 'dist/.gitkeep') -ItemType File -Force | Out-Null

$requiredPortableItems = @(
  'scripts/windows/install/install-sallon-connect.bat',
  'scripts/windows/install/check-prerequisites.ps1',
  'scripts/windows/release/start-release.ps1',
  'scripts/windows/release/verify-release.ps1',
  'docs/user/INSTALLER_WINDOWS_GUIDE.md'
)

foreach ($item in $requiredPortableItems) {
  if (-not (Test-Path (Join-Path $StageApp $item))) {
    throw "Element portable manquant: $item"
  }
}

if (Test-Path $ZipPath) { Remove-Item -LiteralPath $ZipPath -Force }
Compress-Archive -Path (Join-Path $StageApp '*') -DestinationPath $ZipPath -CompressionLevel Optimal
Remove-Item -LiteralPath $StageRoot -Recurse -Force

Write-Host "Archive creee: dist/$(Split-Path $ZipPath -Leaf)" -ForegroundColor Green
Write-Host "Exclusions appliquees: .env, .env.local, node_modules, tests, cache, temp, .next, runtime/*.json, backups/*.zip, logs, .git, *.pem, *.key."
