param(
  [string]$Version = '',
  [switch]$Confirm,
  [switch]$Restart,
  [switch]$SkipBackup
)

$ErrorActionPreference = 'Continue'

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root       = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$UpdatesDir = Join-Path $Root 'runtime\updates'
$BackupsDir = Join-Path $Root 'runtime\update-backups'
$ServiceDir = Join-Path $Root 'scripts\windows\service'
$TrayDir    = Join-Path $Root 'scripts\windows\tray'

function Write-Title { param([string]$T) Write-Host ''; Write-Host "=== $T ===" -ForegroundColor Cyan }
function Write-Ok    { param([string]$M) Write-Host "  OK   $M" -ForegroundColor Green }
function Write-Warn  { param([string]$M) Write-Host "  WARN $M" -ForegroundColor Yellow }
function Write-Fail  { param([string]$M) Write-Host "  FAIL $M" -ForegroundColor Red }
function Write-Info  { param([string]$M) Write-Host "  $M" }

Write-Host ''
Write-Host '== Application mise a jour Sallon-ConnecT ==' -ForegroundColor Cyan

# ---------------------------------------------------------------------------
# Validation format version
# ---------------------------------------------------------------------------
if ($Version -ne '' -and $Version -notmatch '^v?[0-9]+\.[0-9]+\.[0-9]+') {
    Write-Fail "Format de version invalide : $Version"
    exit 1
}
$Version = $Version -replace '^v', ''

# ---------------------------------------------------------------------------
# Trouver le dossier de version
# ---------------------------------------------------------------------------
if ($Version -eq '') {
    $dirs = @(Get-ChildItem -Path $UpdatesDir -Directory -ErrorAction SilentlyContinue |
              Sort-Object Name -Descending)
    if ($dirs.Count -eq 0) {
        Write-Fail "Aucune mise a jour dans runtime\updates\. Lancer download-update.ps1."
        exit 1
    }
    $Version = $dirs[0].Name
    Write-Info "Version detectee : $Version"
}

$versionDir = Join-Path $UpdatesDir $Version
if (-not (Test-Path $versionDir)) {
    Write-Fail "Dossier version introuvable : runtime\updates\$Version"
    exit 1
}

# ---------------------------------------------------------------------------
# Verification SHA256 obligatoire
# ---------------------------------------------------------------------------
$verifFile = Join-Path $versionDir 'verification.json'
if (-not (Test-Path $verifFile)) {
    Write-Fail "verification.json absent. Lancer download-update.ps1 d'abord."
    exit 1
}

$verif = $null
try { $verif = Get-Content $verifFile -Raw | ConvertFrom-Json } catch { }
if (-not $verif) {
    Write-Fail "verification.json illisible."
    exit 1
}

if (-not $verif.verified) {
    Write-Fail 'SHA256 non valide — apply refuse par securite.'
    Write-Info "  SHA256 attendu : $($verif.sha256Expected)"
    Write-Info "  SHA256 calcule : $($verif.sha256Local)"
    Write-Info '  Retelecharger  : scripts\windows\update\download-update.ps1 -Force'
    exit 1
}
Write-Ok "SHA256 valide ($($verif.sha256Local.Substring(0,16))...)"

# ---------------------------------------------------------------------------
# Trouver le ZIP
# ---------------------------------------------------------------------------
$zipFile = Get-ChildItem -Path $versionDir -Filter '*.zip' -ErrorAction SilentlyContinue |
           Select-Object -First 1
if (-not $zipFile) {
    Write-Fail "Aucun ZIP dans runtime\updates\$Version"
    exit 1
}
Write-Info "ZIP     : $($zipFile.Name)"
Write-Info "Version : $Version"

# Version actuelle (avant apply)
$fromVersion = 'unknown'
$vCurrent = Join-Path $Root 'VERSION'
if (Test-Path $vCurrent) {
    $fromVersion = (Get-Content $vCurrent -Raw -ErrorAction SilentlyContinue).Trim()
}

# ---------------------------------------------------------------------------
# Confirmation explicite (obligatoire)
# ---------------------------------------------------------------------------
if (-not $Confirm) {
    Write-Host ''
    Write-Host '  ATTENTION : Cette operation remplace les fichiers applicatifs.' -ForegroundColor Yellow
    Write-Host '  Donnees preservees : logs/, runtime/, backups/, .env, data/.' -ForegroundColor Yellow
    Write-Host ''
    $answer = Read-Host '  Confirmer la mise a jour ? [oui/non]'
    if ($answer.Trim() -notmatch '^(oui|o|yes|y)$') {
        Write-Info 'Mise a jour annulee.'
        exit 0
    }
}

# ---------------------------------------------------------------------------
# Arreter service et tray
# ---------------------------------------------------------------------------
Write-Title 'Arret des services'

$stopTrayScript    = Join-Path $TrayDir    'stop-tray.ps1'
$stopServiceScript = Join-Path $ServiceDir 'stop-service.ps1'

if (Test-Path $stopTrayScript) {
    $psArgsT = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $stopTrayScript)
    try { & powershell.exe @psArgsT | Out-Null; Write-Ok 'Tray arrete.' } catch { Write-Warn 'Tray: aucun actif.' }
}
if (Test-Path $stopServiceScript) {
    $psArgsS = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $stopServiceScript)
    try { & powershell.exe @psArgsS | Out-Null; Write-Ok 'Service arrete.' } catch { Write-Warn 'Service: aucun actif.' }
}

# ---------------------------------------------------------------------------
# Backup version actuelle
# ---------------------------------------------------------------------------
$backupStamp = ''
if (-not $SkipBackup) {
    Write-Title 'Sauvegarde version actuelle'
    $backupStamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $backupDir   = Join-Path $BackupsDir $backupStamp
    New-Item -Path $backupDir -ItemType Directory -Force | Out-Null

    $backupPaths = @('server.js', 'package.json', 'package-lock.json', 'VERSION', 'server', 'scripts')
    foreach ($bp in $backupPaths) {
        $src = Join-Path $Root $bp
        $dst = Join-Path $backupDir $bp
        if (Test-Path $src) {
            try {
                Copy-Item -Path $src -Destination $dst -Recurse -Force -ErrorAction Stop
                Write-Ok "Sauvegarde : $bp"
            } catch {
                Write-Warn "Sauvegarde partielle : $bp"
            }
        }
    }

    $bManifest = [PSCustomObject]@{
        timestamp   = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
        fromVersion = $fromVersion
        toVersion   = $Version
        backupDir   = $backupStamp
    }
    $bManifest | ConvertTo-Json | Set-Content -Path (Join-Path $backupDir 'backup-manifest.json') -Encoding utf8
    Write-Ok "Backup : runtime\update-backups\$backupStamp"

    # Snapshot utilisateur Phase 40 (backups/snapshots/)
    $createBackupScript = Join-Path $Root 'scripts\windows\backup\create-backup.ps1'
    if (Test-Path $createBackupScript) {
        $psArgsB = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $createBackupScript,
                     '-Type', 'quick', '-Description', "Pre-update v$fromVersion vers v$Version",
                     '-RootPath', $Root)
        try { & powershell.exe @psArgsB | Out-Null; Write-Ok 'Snapshot utilisateur cree (backups/snapshots/).' }
        catch { Write-Warn 'Snapshot utilisateur: echec non bloquant.' }
    }
} else {
    Write-Warn 'Sauvegarde ignoree (-SkipBackup).'
}

# ---------------------------------------------------------------------------
# Extraction du ZIP
# ---------------------------------------------------------------------------
Write-Title 'Extraction'
$extractDir = Join-Path $versionDir 'extracted'
if (Test-Path $extractDir) {
    Remove-Item $extractDir -Recurse -Force -ErrorAction SilentlyContinue
}
try {
    Expand-Archive -Path $zipFile.FullName -DestinationPath $extractDir -Force -ErrorAction Stop
    Write-Ok "Extraction : runtime\updates\$Version\extracted\"
} catch {
    Write-Fail "Extraction echouee : $($_.Exception.Message)"
    exit 1
}

# Verification structure minimale
if (-not (Test-Path (Join-Path $extractDir 'server.js')) -or
    -not (Test-Path (Join-Path $extractDir 'package.json'))) {
    Write-Fail 'Structure ZIP invalide : server.js ou package.json manquant.'
    exit 1
}
Write-Ok 'Structure ZIP validee.'

# ---------------------------------------------------------------------------
# Application selective (preserv e donnees utilisateur)
# ---------------------------------------------------------------------------
Write-Title 'Application des fichiers'

$preserveList = @('logs', 'runtime', 'backups', 'data', '.env',
                  'node_modules', 'frontend\.next', 'frontend\node_modules', 'frontend\.env.local')

$allItems = @(Get-ChildItem -Path $extractDir -Recurse -ErrorAction SilentlyContinue)
$copied   = 0
$skipped  = 0

foreach ($item in $allItems) {
    $relPath  = $item.FullName.Substring($extractDir.Length).TrimStart('\')
    $destPath = Join-Path $Root $relPath

    $isPreserved = $false
    foreach ($p in $preserveList) {
        if ($relPath -eq $p -or $relPath.StartsWith($p + '\')) {
            $isPreserved = $true
            break
        }
    }
    if ($isPreserved) { $skipped++; continue }

    if ($item.PSIsContainer) {
        New-Item -Path $destPath -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
    } else {
        $parent = Split-Path $destPath -Parent
        New-Item -Path $parent -ItemType Directory -Force -ErrorAction SilentlyContinue | Out-Null
        try {
            Copy-Item -Path $item.FullName -Destination $destPath -Force -ErrorAction Stop
            $copied++
        } catch {
            Write-Warn "Copie echouee : $relPath"
        }
    }
}

Write-Ok "$copied fichiers appliques, $skipped ignores (preserves)."

# ---------------------------------------------------------------------------
# Rapport apply
# ---------------------------------------------------------------------------
$applyReport = [PSCustomObject]@{
    timestamp   = (Get-Date -Format 'yyyy-MM-ddTHH:mm:ss')
    fromVersion = $fromVersion
    toVersion   = $Version
    filesCopied = $copied
    filesSkipped = $skipped
    backup      = $backupStamp
    success     = $true
}
$applyReport | ConvertTo-Json | Set-Content -Path (Join-Path $versionDir 'apply-report.json') -Encoding utf8
Write-Ok 'Rapport : apply-report.json'

# ---------------------------------------------------------------------------
# Redemarrage
# ---------------------------------------------------------------------------
if ($Restart) {
    Write-Title 'Redemarrage'
    $startScript = Join-Path $Root 'scripts\windows\start-sallon-connect.ps1'
    if (Test-Path $startScript) {
        $psArgsR = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startScript)
        Start-Process powershell.exe -ArgumentList $psArgsR
        Write-Ok 'Backend relance.'
    }
} else {
    Write-Host ''
    Write-Info 'Si package.json a change, executer npm install avant de relancer.'
    Write-Info 'Relancer : scripts\windows\start-sallon-connect.ps1'
}

Write-Host ''
Write-Host "  Mise a jour v$Version appliquee avec succes." -ForegroundColor Green
Write-Host ''
exit 0
