param(
  [string]$Version = '',
  [switch]$Force
)

$ErrorActionPreference = 'Continue'

$ScriptDir      = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root           = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$CheckScript    = Join-Path $ScriptDir 'check-update.ps1'
$UpdatesDir     = Join-Path $Root 'runtime\updates'
$AllowedExts    = @('.zip', '.txt', '.json')
$AllowedHostPfx = 'https://github.com/farkh2023/'

function Write-Ok   { param([string]$M) Write-Host "  OK   $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "  WARN $M" -ForegroundColor Yellow }
function Write-Fail { param([string]$M) Write-Host "  FAIL $M" -ForegroundColor Red }
function Write-Info { param([string]$M) Write-Host "  $M" }

Write-Host ''
Write-Host '== Telechargement mise a jour Sallon-ConnecT ==' -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Obtenir info release via check-update
# ---------------------------------------------------------------------------
$releaseInfo = $null
try {
    $psArgs  = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $CheckScript, '-Json', '-Silent')
    $rawJson = & powershell.exe @psArgs
    $releaseInfo = ($rawJson -join '') | ConvertFrom-Json
} catch {
    Write-Fail "Impossible de contacter l'API GitHub."
    exit 1
}

if (-not $releaseInfo) {
    Write-Fail "Aucune information release obtenue."
    exit 1
}

if ($releaseInfo.error) {
    Write-Fail "Erreur API GitHub : $($releaseInfo.error)"
    Write-Info 'Verifier la connexion internet.'
    exit 1
}

$targetVersion = if ($Version -ne '') { $Version -replace '^v', '' } else { $releaseInfo.remoteVersion }

if ($targetVersion -eq 'n/a' -or $targetVersion -eq '') {
    Write-Fail 'Version distante non disponible.'
    exit 1
}

if (-not $releaseInfo.updateAvailable -and -not $Force) {
    Write-Info "Version locale ($($releaseInfo.localVersion)) deja a jour."
    Write-Info 'Utiliser -Force pour forcer le telechargement.'
    exit 0
}

Write-Info "Version locale    : $($releaseInfo.localVersion)"
Write-Info "Version a jour    : $targetVersion"

# ---------------------------------------------------------------------------
# Dossier de destination
# ---------------------------------------------------------------------------
$updateDir = Join-Path $UpdatesDir $targetVersion
New-Item -Path $updateDir -ItemType Directory -Force | Out-Null

# ---------------------------------------------------------------------------
# Telecharger chaque asset autorise
# ---------------------------------------------------------------------------
$logLines   = @("Telechargement $targetVersion $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$downloaded = [System.Collections.Generic.List[string]]::new()

foreach ($asset in @($releaseInfo.assets)) {
    if (-not $asset) { continue }

    $ext = [System.IO.Path]::GetExtension($asset.name).ToLower()
    $url = [string]$asset.url

    if ($ext -notin $AllowedExts) {
        Write-Warn "Extension refusee : $($asset.name)"
        $logLines += "SKIP (ext refusee) : $($asset.name)"
        continue
    }

    if (-not $url.StartsWith($AllowedHostPfx)) {
        Write-Warn "URL non autorisee : $url"
        $logLines += "SKIP (url refusee) : $($asset.name)"
        continue
    }

    $destPath = Join-Path $updateDir $asset.name

    if ((Test-Path $destPath) -and -not $Force) {
        Write-Info "Deja telecharge : $($asset.name)"
        $logLines += "SKIP (deja present) : $($asset.name)"
        $downloaded.Add($destPath)
        continue
    }

    Write-Info "Telechargement : $($asset.name)..."
    try {
        Invoke-WebRequest -Uri $url -OutFile $destPath -UseBasicParsing -TimeoutSec 120 -ErrorAction Stop
        $sz = (Get-Item $destPath -ErrorAction SilentlyContinue).Length
        if (-not $sz -or $sz -eq 0) {
            if (Test-Path $destPath) { Remove-Item $destPath -Force }
            Write-Fail "Fichier vide : $($asset.name)"
            $logLines += "FAIL (vide) : $($asset.name)"
            continue
        }
        $mb = [Math]::Round($sz / 1MB, 2)
        Write-Ok "$($asset.name) ($mb MB)"
        $logLines += "OK : $($asset.name) ($sz bytes)"
        $downloaded.Add($destPath)
    } catch {
        Write-Fail "Echec $($asset.name) : $($_.Exception.Message)"
        $logLines += "FAIL : $($asset.name) - $($_.Exception.Message)"
    }
}

# ---------------------------------------------------------------------------
# Verification SHA256
# ---------------------------------------------------------------------------
$zipPath    = $null
$sha256Path = $null
$jsonPath2  = $null

foreach ($d in $downloaded) {
    if ($d -like '*.zip')          { $zipPath    = $d }
    if ($d -like '*sha256*')       { $sha256Path = $d }
    if ($d -like '*release.json')  { $jsonPath2  = $d }
}

$expectedHash = ''
$localHash    = ''
$verified     = $false

if ($zipPath -and (Test-Path $zipPath)) {
    $hashResult = Get-FileHash -Path $zipPath -Algorithm SHA256 -ErrorAction SilentlyContinue
    if ($hashResult) { $localHash = $hashResult.Hash.ToUpper() }

    # Lire hash attendu depuis sha256.txt
    if ($sha256Path -and (Test-Path $sha256Path)) {
        $raw = Get-Content $sha256Path -Raw -ErrorAction SilentlyContinue
        if ($raw -match '([A-Fa-f0-9]{64})') { $expectedHash = $Matches[1].ToUpper() }
    }

    # Fallback : lire depuis release.json
    if (-not $expectedHash -and $jsonPath2 -and (Test-Path $jsonPath2)) {
        try {
            $rj = Get-Content $jsonPath2 -Raw | ConvertFrom-Json
            if ($rj.sha256) { $expectedHash = $rj.sha256.ToString().ToUpper() }
        } catch { }
    }

    if ($localHash -and $expectedHash) {
        $verified = ($localHash -eq $expectedHash)
        if ($verified) {
            Write-Ok "SHA256 verifie : $($localHash.Substring(0, 16))..."
        } else {
            Write-Fail 'SHA256 invalide !'
            Write-Fail "  Attendu : $expectedHash"
            Write-Fail "  Calcule : $localHash"
        }
        $logLines += "SHA256 verified=$verified"
    } elseif ($localHash) {
        Write-Warn 'SHA256 attendu introuvable. Verification manuelle requise avant apply.'
        Write-Info "  SHA256 : $localHash"
        $logLines += "SHA256 local=$localHash expected=UNKNOWN"
    }
}

# ---------------------------------------------------------------------------
# Rapport verification
# ---------------------------------------------------------------------------
$zipName  = if ($zipPath) { Split-Path $zipPath -Leaf } else { $null }
$zipSize  = if ($zipPath -and (Test-Path $zipPath)) { (Get-Item $zipPath).Length } else { 0 }

$verif = [PSCustomObject]@{
    timestamp      = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    version        = $targetVersion
    zipFile        = $zipName
    zipSizeBytes   = $zipSize
    sha256Local    = $localHash
    sha256Expected = $expectedHash
    verified       = $verified
}
$verif | ConvertTo-Json | Set-Content -Path (Join-Path $updateDir 'verification.json') -Encoding utf8
$logLines | Set-Content -Path (Join-Path $updateDir 'download-log.txt') -Encoding utf8

# ---------------------------------------------------------------------------
# Resume
# ---------------------------------------------------------------------------
Write-Host ''
Write-Host "  Dossier : runtime\updates\$targetVersion" -ForegroundColor Cyan
if ($zipPath -and $verified) {
    Write-Host '  Appliquer : scripts\windows\update\apply-update.ps1' -ForegroundColor Green
} elseif ($zipPath -and $expectedHash -and -not $verified) {
    Write-Warn 'SHA256 invalide — apply refuse. Retelecharger avec -Force.'
} elseif ($zipPath) {
    Write-Warn 'SHA256 non verifie automatiquement. Verifier avant apply.'
} else {
    Write-Warn 'Aucun ZIP telecharge.'
}
Write-Host ''
exit 0
