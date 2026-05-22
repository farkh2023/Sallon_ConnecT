param(
  [switch]$Json,
  [switch]$Silent
)

$ErrorActionPreference = 'SilentlyContinue'

$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root        = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$ApiUrl      = 'https://api.github.com/repos/farkh2023/Sallon_ConnecT/releases/latest'
$AllowedExts = @('.zip', '.txt', '.json')
$RepoPrefix  = 'https://github.com/farkh2023/'

# ---------------------------------------------------------------------------
# Version locale
# ---------------------------------------------------------------------------
$localVersion = 'unknown'
$vFile = Join-Path $Root 'VERSION'
$pFile = Join-Path $Root 'package.json'

if (Test-Path $vFile) {
    $localVersion = (Get-Content $vFile -Raw -ErrorAction SilentlyContinue).Trim()
} elseif (Test-Path $pFile) {
    try {
        $pkg = Get-Content $pFile -Raw | ConvertFrom-Json
        if ($pkg.version) { $localVersion = $pkg.version }
    } catch { }
}
$localVersion = $localVersion -replace '^v', ''

# ---------------------------------------------------------------------------
# Comparaison SemVer
# ---------------------------------------------------------------------------
function Compare-SemVer {
    param([string]$A, [string]$B)
    $cA = ($A -replace '^v', '' -replace '-.*$', '').Trim()
    $cB = ($B -replace '^v', '' -replace '-.*$', '').Trim()
    try {
        return ([Version]$cA).CompareTo([Version]$cB)
    } catch { return 0 }
}

# ---------------------------------------------------------------------------
# Appel API GitHub
# ---------------------------------------------------------------------------
$updateAvailable = $false
$remoteVersion   = 'n/a'
$remoteBody      = ''
$remoteUrl       = ''
$remoteAssets    = @()
$apiError        = $null

try {
    $headers  = @{
        'User-Agent' = 'Sallon-ConnecT-Updater/0.4.0'
        'Accept'     = 'application/vnd.github.v3+json'
    }
    $resp    = Invoke-WebRequest -Uri $ApiUrl -Headers $headers -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
    $release = $resp.Content | ConvertFrom-Json

    $remoteVersion = ($release.tag_name -replace '^v', '').Trim()
    if ($release.body) {
        $remoteBody = (($release.body -split '\r?\n') | Select-Object -First 5) -join ' '
    }
    $remoteUrl = $release.html_url

    foreach ($asset in @($release.assets)) {
        if (-not $asset) { continue }
        $ext = [System.IO.Path]::GetExtension($asset.name).ToLower()
        $url = [string]$asset.browser_download_url
        if ($ext -in $AllowedExts -and $url.StartsWith($RepoPrefix)) {
            $remoteAssets += [PSCustomObject]@{
                name      = $asset.name
                url       = $url
                sizeBytes = [long]$asset.size
            }
        }
    }

    $updateAvailable = (Compare-SemVer -A $localVersion -B $remoteVersion) -lt 0

} catch {
    $apiError = $_.Exception.Message
}

# ---------------------------------------------------------------------------
# Resultat
# ---------------------------------------------------------------------------
$result = [PSCustomObject]@{
    timestamp       = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    localVersion    = $localVersion
    remoteVersion   = $remoteVersion
    updateAvailable = $updateAvailable
    changelog       = $remoteBody
    releaseUrl      = $remoteUrl
    assets          = $remoteAssets
    error           = $apiError
}

if ($Json) {
    $result | ConvertTo-Json -Depth 4
    exit $(if ($updateAvailable) { 0 } else { 1 })
}

if (-not $Silent) {
    Write-Host ''
    Write-Host '== Verification mise a jour Sallon-ConnecT ==' -ForegroundColor Cyan
    Write-Host "  Version locale   : $localVersion"
    Write-Host "  Version distante : $remoteVersion"

    if ($apiError) {
        Write-Host "  Erreur           : $apiError" -ForegroundColor Red
        Write-Host '  Verifier la connexion internet.' -ForegroundColor Yellow
    } elseif ($updateAvailable) {
        Write-Host '  Statut           : MISE A JOUR DISPONIBLE' -ForegroundColor Green
        Write-Host "  Release          : $remoteUrl"
        if ($remoteBody) { Write-Host "  Changelog        : $remoteBody" }
        Write-Host ''
        Write-Host '  Assets disponibles :' -ForegroundColor Cyan
        foreach ($a in $remoteAssets) {
            $mb = [Math]::Round($a.sizeBytes / 1MB, 2)
            Write-Host "    $($a.name) ($mb MB)"
        }
        Write-Host ''
        Write-Host '  Telecharger : scripts\windows\update\download-update.ps1' -ForegroundColor Cyan
    } else {
        Write-Host '  Statut           : A jour - aucune mise a jour disponible.' -ForegroundColor Green
    }
    Write-Host ''
}

exit $(if ($updateAvailable) { 0 } else { 1 })
