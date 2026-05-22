param()

$ErrorActionPreference = 'SilentlyContinue'

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# ── Chemins ───────────────────────────────────────────────────────────────────
$ScriptDir           = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:Root         = (Resolve-Path (Join-Path $ScriptDir '..\..\..')).Path
$script:ServiceDir   = Join-Path $script:Root 'scripts\windows\service'
$script:LogsDir      = Join-Path $script:Root 'logs'
$script:PidFile      = Join-Path $env:TEMP 'SallonConnecT-Tray.pid'

# ── Instance unique ────────────────────────────────────────────────────────────
if (Test-Path $script:PidFile) {
    $existingPid = 0
    try { $existingPid = [int](Get-Content $script:PidFile -Raw -ErrorAction SilentlyContinue) } catch { }
    if ($existingPid -gt 0) {
        $existingProc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
        if ($existingProc) { exit 0 }
    }
}
try { "$PID" | Set-Content -Path $script:PidFile -Encoding UTF8 -Force } catch { }

# ── Etat interne ───────────────────────────────────────────────────────────────
$script:lastStatus       = 'unknown'
$script:notifThrottleSec = 60
$script:lastNotifTime    = @{
    started  = [DateTime]::MinValue
    stopped  = [DateTime]::MinValue
    degraded = [DateTime]::MinValue
    error    = [DateTime]::MinValue
}

# ── Helpers ────────────────────────────────────────────────────────────────────
function Invoke-ServiceScript {
    param([string]$Script, [bool]$Visible = $false)
    $style = if ($Visible) { 'Normal' } else { 'Hidden' }
    $psArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $Script)
    Start-Process powershell.exe -ArgumentList $psArgs -WindowStyle $style -ErrorAction SilentlyContinue
}

function Show-TrayBalloon {
    param(
        [string]$Type,
        [string]$Title,
        [string]$Text,
        [System.Windows.Forms.ToolTipIcon]$TipIcon = [System.Windows.Forms.ToolTipIcon]::Info
    )
    $now = Get-Date
    $last = $script:lastNotifTime[$Type]
    if ($null -eq $last) { $last = [DateTime]::MinValue }
    if (($now - $last).TotalSeconds -lt $script:notifThrottleSec) { return }
    $script:lastNotifTime[$Type] = $now
    try { $script:trayIcon.ShowBalloonTip(3000, $Title, $Text, $TipIcon) } catch { }
}

# ── Icone tray ─────────────────────────────────────────────────────────────────
$script:trayIcon = New-Object System.Windows.Forms.NotifyIcon
$script:trayIcon.Visible = $false
$script:trayIcon.Icon    = [System.Drawing.SystemIcons]::Application
$script:trayIcon.Text    = 'Sallon-ConnecT (verification...)'

# ── Menu contextuel ────────────────────────────────────────────────────────────
$ctxMenu = New-Object System.Windows.Forms.ContextMenuStrip

# Statut en-tete (desactive)
$script:itemStatus = New-Object System.Windows.Forms.ToolStripMenuItem
$script:itemStatus.Text    = 'Verification en cours...'
$script:itemStatus.Enabled = $false

$sep1 = New-Object System.Windows.Forms.ToolStripSeparator

# Ouvrir dashboard
$itemOpen = New-Object System.Windows.Forms.ToolStripMenuItem
$itemOpen.Text = 'Ouvrir Sallon-ConnecT'
$itemOpen.Font = New-Object System.Drawing.Font($itemOpen.Font, [System.Drawing.FontStyle]::Bold)
$itemOpen.Add_Click({ Start-Process 'http://localhost:3001' })

$sep2 = New-Object System.Windows.Forms.ToolStripSeparator

# Demarrer backend
$itemStart = New-Object System.Windows.Forms.ToolStripMenuItem
$itemStart.Text = 'Demarrer le backend'
$itemStart.Add_Click({
    $svc = Join-Path $script:ServiceDir 'start-service.ps1'
    Invoke-ServiceScript -Script $svc
    Show-TrayBalloon -Type 'started' -Title 'Sallon-ConnecT' -Text 'Demarrage du backend...'
})

# Arreter backend
$itemStop = New-Object System.Windows.Forms.ToolStripMenuItem
$itemStop.Text = 'Arreter le backend'
$itemStop.Add_Click({
    $svc = Join-Path $script:ServiceDir 'stop-service.ps1'
    Invoke-ServiceScript -Script $svc
    Show-TrayBalloon -Type 'stopped' -Title 'Sallon-ConnecT' -Text 'Arret du backend...' `
        -TipIcon ([System.Windows.Forms.ToolTipIcon]::Warning)
})

# Redemarrer
$itemRestart = New-Object System.Windows.Forms.ToolStripMenuItem
$itemRestart.Text = 'Redemarrer le backend'
$itemRestart.Add_Click({
    $svc = Join-Path $script:ServiceDir 'restart-service.ps1'
    Invoke-ServiceScript -Script $svc
    Show-TrayBalloon -Type 'started' -Title 'Sallon-ConnecT' -Text 'Redemarrage du backend...'
})

$sep3 = New-Object System.Windows.Forms.ToolStripSeparator

# Statut detaille (fenetre visible)
$itemStatusDetail = New-Object System.Windows.Forms.ToolStripMenuItem
$itemStatusDetail.Text = 'Statut detaille...'
$itemStatusDetail.Add_Click({
    $svc = Join-Path $script:ServiceDir 'service-status.ps1'
    Invoke-ServiceScript -Script $svc -Visible $true
})

# Ouvrir dossier logs
$itemLogs = New-Object System.Windows.Forms.ToolStripMenuItem
$itemLogs.Text = 'Ouvrir les logs'
$itemLogs.Add_Click({
    if (Test-Path $script:LogsDir) {
        Start-Process explorer.exe -ArgumentList $script:LogsDir
    }
})

# Documentation
$itemDocs = New-Object System.Windows.Forms.ToolStripMenuItem
$itemDocs.Text = 'Documentation'
$itemDocs.Add_Click({
    $docsDir = Join-Path $script:Root 'docs'
    if (Test-Path $docsDir) { Start-Process explorer.exe -ArgumentList $docsDir }
})

# Ouvrir dossier sauvegardes
$itemBackups = New-Object System.Windows.Forms.ToolStripMenuItem
$itemBackups.Text = 'Ouvrir les sauvegardes'
$itemBackups.Add_Click({
    $backupsDir = Join-Path $script:Root 'backups\snapshots'
    if (-not (Test-Path $backupsDir)) {
        New-Item -ItemType Directory -Path $backupsDir -Force -ErrorAction SilentlyContinue | Out-Null
    }
    Start-Process explorer.exe -ArgumentList $backupsDir -ErrorAction SilentlyContinue
})

$sep3b = New-Object System.Windows.Forms.ToolStripSeparator

# Verifier mise a jour
$itemUpdate = New-Object System.Windows.Forms.ToolStripMenuItem
$itemUpdate.Text = 'Verifier mise a jour...'
$itemUpdate.Add_Click({
    $updScript = Join-Path $script:Root 'scripts\windows\update\check-update.ps1'
    Invoke-ServiceScript -Script $updScript -Visible $true
})

$sep4 = New-Object System.Windows.Forms.ToolStripSeparator

# Quitter le tray
$itemQuit = New-Object System.Windows.Forms.ToolStripMenuItem
$itemQuit.Text = 'Quitter le tray'
$itemQuit.Add_Click({
    $script:timer.Stop()
    $script:trayIcon.Visible = $false
    try { $script:trayIcon.Dispose() } catch { }
    try { Remove-Item $script:PidFile -Force -ErrorAction SilentlyContinue } catch { }
    [System.Windows.Forms.Application]::Exit()
})

# Assemblage du menu
$ctxMenu.Items.Add($script:itemStatus) | Out-Null
$ctxMenu.Items.Add($sep1) | Out-Null
$ctxMenu.Items.Add($itemOpen) | Out-Null
$ctxMenu.Items.Add($sep2) | Out-Null
$ctxMenu.Items.Add($itemStart) | Out-Null
$ctxMenu.Items.Add($itemStop) | Out-Null
$ctxMenu.Items.Add($itemRestart) | Out-Null
$ctxMenu.Items.Add($sep3) | Out-Null
$ctxMenu.Items.Add($itemStatusDetail) | Out-Null
$ctxMenu.Items.Add($itemLogs) | Out-Null
$ctxMenu.Items.Add($itemDocs) | Out-Null
$ctxMenu.Items.Add($itemBackups) | Out-Null
$ctxMenu.Items.Add($sep3b) | Out-Null
$ctxMenu.Items.Add($itemUpdate) | Out-Null
$ctxMenu.Items.Add($sep4) | Out-Null
$ctxMenu.Items.Add($itemQuit) | Out-Null

$script:trayIcon.ContextMenuStrip = $ctxMenu

# Double-clic gauche : ouvrir dashboard
$script:trayIcon.Add_DoubleClick({ Start-Process 'http://localhost:3001' })

# ── Mise a jour du statut ──────────────────────────────────────────────────────
function Update-TrayStatus {
    $status = 'stopped'

    # Health check HTTP
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:3000/api/health' `
            -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($r -and $r.StatusCode -eq 200) { $status = 'running' }
    } catch { }

    # Si non joignable, verifier si service actif (degrade)
    if ($status -ne 'running') {
        $svc  = Get-Service -Name 'SallonConnecT' -ErrorAction SilentlyContinue
        $task = Get-ScheduledTask -TaskName 'SallonConnecT' -ErrorAction SilentlyContinue
        if (($svc -and $svc.Status -eq 'Running') -or ($task -and $task.State -eq 'Running')) {
            $status = 'degraded'
        }
    }

    # Icone systray
    $newIcon = if ($status -eq 'running') {
        [System.Drawing.SystemIcons]::Information
    } elseif ($status -eq 'degraded') {
        [System.Drawing.SystemIcons]::Error
    } else {
        [System.Drawing.SystemIcons]::Warning
    }
    try { $script:trayIcon.Icon = $newIcon } catch { }

    # Bulle tooltip
    $tooltip = if ($status -eq 'running') {
        'Sallon-ConnecT - En ligne'
    } elseif ($status -eq 'degraded') {
        'Sallon-ConnecT - Degrade'
    } else {
        'Sallon-ConnecT - Arrete'
    }
    try {
        if ($tooltip.Length -gt 63) { $tooltip = $tooltip.Substring(0, 63) }
        $script:trayIcon.Text = $tooltip
    } catch { }

    # Texte menu en-tete
    $menuText = if ($status -eq 'running') {
        'Etat : En ligne'
    } elseif ($status -eq 'degraded') {
        'Etat : Degrade'
    } else {
        'Etat : Arrete'
    }
    try { $script:itemStatus.Text = $menuText } catch { }

    # Notifications sur changement d'etat (avec throttle)
    if ($status -ne $script:lastStatus) {
        if ($status -eq 'running') {
            Show-TrayBalloon -Type 'started' -Title 'Sallon-ConnecT' -Text 'Backend en ligne et disponible.'
        } elseif ($status -eq 'stopped') {
            Show-TrayBalloon -Type 'stopped' -Title 'Sallon-ConnecT' -Text 'Backend arrete.' `
                -TipIcon ([System.Windows.Forms.ToolTipIcon]::Warning)
        } elseif ($status -eq 'degraded') {
            Show-TrayBalloon -Type 'degraded' -Title 'Sallon-ConnecT' -Text 'Backend degrade - health check echec.' `
                -TipIcon ([System.Windows.Forms.ToolTipIcon]::Warning)
        }
        $script:lastStatus = $status
    }
}

# ── Timer de polling ───────────────────────────────────────────────────────────
$script:timer = New-Object System.Windows.Forms.Timer
$script:timer.Interval = 5000
$script:timer.Add_Tick({ Update-TrayStatus })
$script:timer.Start()

# Premier check et affichage
$script:trayIcon.Visible = $true
Update-TrayStatus

# ── Boucle de messages Windows ─────────────────────────────────────────────────
[System.Windows.Forms.Application]::Run()

# Nettoyage
try { $script:trayIcon.Dispose() } catch { }
try { Remove-Item $script:PidFile -Force -ErrorAction SilentlyContinue } catch { }
