; =============================================================================
; Sallon-ConnecT - Installateur Windows autonome
; Version 0.4.0 - local-only
; Outil    : Inno Setup 6.x
; Genere   : scripts\windows\installer\build-installer.ps1
; =============================================================================

#define AppName      "Sallon-ConnecT"
#define AppVersion   "0.4.0"
#define AppPublisher "Sallon-ConnecT"
#define AppUrl       "http://localhost:3001"
; Chemin relatif depuis ce fichier .iss jusqu'a la racine du projet
#define AppRoot      "..\..\.."

; ---------------------------------------------------------------------------
[Setup]
; UUID unique de l'application - ne pas modifier apres premiere release
AppId={{B7A4E2C1-9F3D-4E5A-8B2F-1C6D8E3A7F9B}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppUrl}
AppSupportURL={#AppUrl}
AppUpdatesURL={#AppUrl}

; Installation dans le profil utilisateur - pas de droits admin requis
DefaultDirName={localappdata}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes

; Pas d'elevation UAC
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=commandline

; Artefact de sortie
OutputDir={#AppRoot}\dist
OutputBaseFilename={#AppName}-Setup-{#AppVersion}

; Compression maximale
Compression=lzma2/ultra64
SolidCompression=yes

; Style moderne Windows 11
WizardStyle=modern
WizardResizable=no

; Metadonnees installateur
UninstallDisplayName={#AppName} {#AppVersion}
UninstallDisplayIcon={app}\scripts\windows\start-sallon-connect.bat
ShowLanguageDialog=no
LanguageDetectionMethod=none

; Windows 10 1809 minimum (version 17763)
MinVersion=10.0.17763

; Architecture 64-bit
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; ---------------------------------------------------------------------------
[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

; ---------------------------------------------------------------------------
[Messages]
WelcomeLabel2=Cet assistant va installer [name] [ver] sur votre ordinateur.%n%nSallon-ConnecT est un hub intelligent local. Aucune connexion cloud n'est requise.%n%nPre-requis obligatoire : Node.js 22.13 ou plus recent.%n%nCliquez sur Suivant pour continuer.
FinishedHeadingLabel=Installation de [name] terminee
FinishedLabel=L'installation de [name] [ver] est terminee.%n%nCliquez sur Terminer pour quitter l'assistant. Vous pouvez ensuite lancer Sallon-ConnecT via le raccourci cree.%n%nNote : le premier demarrage peut prendre quelques secondes le temps que le backend initialise.

; ---------------------------------------------------------------------------
[Tasks]
Name: "desktopicon"; Description: "Creer un raccourci sur le Bureau"; GroupDescription: "Raccourcis supplementaires :"; Flags: unchecked
Name: "autostart"; Description: "Demarrage automatique a l'ouverture de session (Task Scheduler)"; GroupDescription: "Demarrage automatique :"; Flags: unchecked
Name: "installservice"; Description: "Demarrage automatique via Task Scheduler (recommande, sans admin)"; GroupDescription: "Service Windows :"; Flags: unchecked
Name: "trayicon"; Description: "Lancer le tray Sallon-ConnecT (icone zone de notification)"; GroupDescription: "Tray :"; Flags: unchecked
Name: "firstrun"; Description: "Lancer l'assistant de premier lancement apres installation"; GroupDescription: "Premier lancement :"; Flags: unchecked

; ---------------------------------------------------------------------------
[Files]

; --- Fichiers racine ---
Source: "{#AppRoot}\server.js";          DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRoot}\package.json";       DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRoot}\package-lock.json";  DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\VERSION";            DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRoot}\README.md";          DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\CHANGELOG.md";       DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\ROADMAP.md";         DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\SECURITY.md";        DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\.env.example";       DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\index.html";         DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\jest.config.js";     DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\sallon-connect-hub.html"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist

; --- Dossier server ---
Source: "{#AppRoot}\server\*"; DestDir: "{app}\server"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; --- Dossier scripts ---
; Inclut tous les scripts Windows - sans secrets
Source: "{#AppRoot}\scripts\*"; DestDir: "{app}\scripts"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; --- Dossier docs ---
Source: "{#AppRoot}\docs\*"; DestDir: "{app}\docs"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; --- Dossier data ---
Source: "{#AppRoot}\data\*"; DestDir: "{app}\data"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; --- Dossier assets ---
Source: "{#AppRoot}\assets\*"; DestDir: "{app}\assets"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; --- Frontend source (sans .next, node_modules, .env.local) ---
Source: "{#AppRoot}\frontend\*.json";            DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\*.ts";              DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\*.mjs";             DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\*.md";              DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\.env.example";      DestDir: "{app}\frontend"; Flags: ignoreversion skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\src\*";             DestDir: "{app}\frontend\src"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist
Source: "{#AppRoot}\frontend\public\*";          DestDir: "{app}\frontend\public"; Flags: ignoreversion recursesubdirs createallsubdirs skipifsourcedoesntexist

; ---------------------------------------------------------------------------
[Dirs]
; Dossiers de donnees locales crees vides
Name: "{app}\runtime"
Name: "{app}\logs"
Name: "{app}\backups"
Name: "{app}\dist"

; ---------------------------------------------------------------------------
[Icons]
; Menu Demarrer
Name: "{group}\Demarrer {#AppName}";    Filename: "{app}\scripts\windows\start-sallon-connect.bat";  WorkingDir: "{app}"; Comment: "Lancer {#AppName} en local"
Name: "{group}\Arreter {#AppName}";     Filename: "{app}\scripts\windows\stop-sallon-connect.bat";   WorkingDir: "{app}"; Comment: "Arreter {#AppName}"
Name: "{group}\Verifier {#AppName}";    Filename: "{app}\scripts\windows\status-sallon-connect.bat"; WorkingDir: "{app}"; Comment: "Afficher le statut de {#AppName}"
Name: "{group}\Desinstaller {#AppName}"; Filename: "{uninstallexe}"; Comment: "Desinstaller {#AppName}"

; Bureau (optionnel)
Name: "{commondesktop}\Demarrer {#AppName}"; Filename: "{app}\scripts\windows\start-sallon-connect.bat"; WorkingDir: "{app}"; Comment: "Lancer {#AppName} en local"; Tasks: desktopicon

; Demarrage automatique (optionnel)
Name: "{userstartup}\{#AppName}"; Filename: "{app}\scripts\windows\start-sallon-connect.bat"; WorkingDir: "{app}"; Comment: "Lancer {#AppName} au demarrage"; Tasks: autostart

; Raccourci tray dans le Menu Demarrer
Name: "{group}\Tray {#AppName}"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\windows\tray\start-tray.ps1"""; WorkingDir: "{app}"; Comment: "Lancer le tray {#AppName}"

; Raccourci assistant premier lancement dans le Menu Demarrer
Name: "{group}\Assistant premier lancement"; Filename: "powershell.exe"; Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\first-run\first-run.ps1"""; WorkingDir: "{app}"; Comment: "Assistant de premier lancement {#AppName}"

; ---------------------------------------------------------------------------
[Run]
; Post-installation : npm install + build frontend (mode silencieux)
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\install\install-sallon-connect.ps1"" -NoShortcut -Quiet"; \
  WorkingDir: "{app}"; \
  StatusMsg: "Installation des dependances npm et build frontend (quelques minutes)..."; \
  Flags: runhidden waituntilterminated

; Service Task Scheduler (optionnel, sans admin)
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\service\install-service.ps1"" -UseTaskScheduler -Unattended -SkipTests"; \
  WorkingDir: "{app}"; \
  StatusMsg: "Configuration demarrage automatique (Task Scheduler)..."; \
  Flags: runhidden waituntilterminated; \
  Tasks: installservice

; Tray (optionnel - lance en arriere-plan, sans admin)
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""{app}\scripts\windows\tray\start-tray.ps1"""; \
  WorkingDir: "{app}"; \
  StatusMsg: "Lancement du tray..."; \
  Flags: runhidden nowait; \
  Tasks: trayicon

; Assistant premier lancement (optionnel - terminal visible, interactif)
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\first-run\first-run.ps1"""; \
  WorkingDir: "{app}"; \
  StatusMsg: "Lancement de l'assistant premier lancement..."; \
  Flags: nowait; \
  Tasks: firstrun

; Lancement optionnel apres installation
Filename: "{app}\scripts\windows\start-sallon-connect.bat"; \
  WorkingDir: "{app}"; \
  Description: "Lancer {#AppName} maintenant"; \
  Flags: postinstall nowait skipifsilent unchecked

; ---------------------------------------------------------------------------
[UninstallRun]
; Arret tray avant desinstallation
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\tray\stop-tray.ps1"""; \
  Flags: runhidden; \
  RunOnceId: "StopTrayBeforeUninstall"

; Arret propre backend avant desinstallation
Filename: "powershell.exe"; \
  Parameters: "-NoProfile -ExecutionPolicy Bypass -File ""{app}\scripts\windows\stop-sallon-connect.ps1"""; \
  Flags: runhidden; \
  RunOnceId: "StopBeforeUninstall"

; ---------------------------------------------------------------------------
[UninstallDelete]
; Supprimer les fichiers crees post-installation (pas les donnees utilisateur)
Type: files; Name: "{app}\logs\*.txt"
Type: files; Name: "{app}\logs\*.log"
Type: filesandordirs; Name: "{app}\frontend\.next"
Type: filesandordirs; Name: "{app}\frontend\node_modules"
Type: filesandordirs; Name: "{app}\node_modules"

; ---------------------------------------------------------------------------
[Code]

function NodeVersionOk(): Boolean;
var
  ResultCode: Integer;
  Output: String;
begin
  Result := Exec('node.exe', '--version', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  if not Result then
    Result := False;
end;

function InitializeSetup(): Boolean;
begin
  Result := True;
  if not NodeVersionOk() then
  begin
    MsgBox(
      'Node.js est introuvable dans le PATH.' + #13#10#13#10 +
      'Sallon-ConnecT necessite Node.js 22.13 ou plus recent.' + #13#10#13#10 +
      'Installez Node.js depuis : https://nodejs.org/fr/' + #13#10 +
      'Choisissez la version LTS recommandee (22.x ou superieure).' + #13#10#13#10 +
      'Apres installation de Node.js, relancez cet installateur.' + #13#10 +
      'Redemarrez votre session Windows si Node.js n''est pas reconnu.',
      mbError,
      MB_OK
    );
    Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  EnvExample, EnvTarget: String;
  FrontEnvExample, FrontEnvTarget: String;
begin
  if CurStep = ssPostInstall then
  begin
    ; Creer .env depuis .env.example si absent
    EnvExample := ExpandConstant('{app}\.env.example');
    EnvTarget  := ExpandConstant('{app}\.env');
    if FileExists(EnvExample) and not FileExists(EnvTarget) then
      FileCopy(EnvExample, EnvTarget, False);

    ; Creer frontend/.env.local depuis frontend/.env.example si absent
    FrontEnvExample := ExpandConstant('{app}\frontend\.env.example');
    FrontEnvTarget  := ExpandConstant('{app}\frontend\.env.local');
    if FileExists(FrontEnvExample) and not FileExists(FrontEnvTarget) then
      FileCopy(FrontEnvExample, FrontEnvTarget, False);
  end;
end;
