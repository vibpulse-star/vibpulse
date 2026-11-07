<#
.SYNOPSIS
  Installs Launch Engine as a standalone offline app window on Windows (no admin rights needed).
.DESCRIPTION
  Copies launch-engine.html to a FIXED folder (%LOCALAPPDATA%\LaunchEngine) and creates Desktop and
  Start menu shortcuts that open it in its own Edge (or Chrome) app window with a dedicated profile.
  The dedicated profile means clearing your normal browser data never touches your launch data.
  Re-run to update: the file is replaced in place, so your data stays.
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\Install-LaunchEngine.ps1
  powershell -ExecutionPolicy Bypass -File .\Install-LaunchEngine.ps1 -Uninstall
#>
param([switch]$Uninstall)
$ErrorActionPreference = 'Stop'

$AppDir    = Join-Path $env:LOCALAPPDATA 'LaunchEngine'
$Html      = Join-Path $AppDir 'launch-engine.html'
$Icon      = Join-Path $AppDir 'launch-engine.ico'
$DataDir   = Join-Path $AppDir 'profile'
$Shortcuts = @(
    (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Launch Engine.lnk'),
    (Join-Path ([Environment]::GetFolderPath('Programs')) 'Launch Engine.lnk')
)

if ($Uninstall) {
    $Shortcuts | Where-Object { Test-Path $_ } | Remove-Item
    Write-Host "Shortcuts removed. Your data is kept in $DataDir (delete that folder to erase it)."
    return
}

function Find-Browser {
    foreach ($exe in 'msedge.exe', 'chrome.exe') {
        foreach ($hive in 'HKCU:', 'HKLM:') {
            $key = "$hive\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$exe"
            if (Test-Path $key) {
                $path = (Get-ItemProperty $key).'(default)'
                if ($path -and (Test-Path $path)) { return $path }
            }
        }
    }
    return $null
}

$src = Join-Path $PSScriptRoot 'launch-engine.html'
if (-not (Test-Path $src)) { throw "launch-engine.html must sit next to this script ($PSScriptRoot)." }

New-Item -ItemType Directory -Force -Path $AppDir | Out-Null
Copy-Item $src $Html -Force
Copy-Item (Join-Path $PSScriptRoot 'launch-engine.ico') $Icon -Force -ErrorAction SilentlyContinue

$uri = ([Uri]$Html).AbsoluteUri  # handles spaces and non-ASCII user names
$browser = Find-Browser
$shell = New-Object -ComObject WScript.Shell
foreach ($lnk in $Shortcuts) {
    $s = $shell.CreateShortcut($lnk)
    if ($browser) {
        $s.TargetPath = $browser
        $s.Arguments  = "--app=`"$uri`" --user-data-dir=`"$DataDir`" --no-first-run --no-default-browser-check"
    } else {
        $s.TargetPath = $Html  # opens in the default browser; data then lives in that browser's profile
    }
    $s.WorkingDirectory = $AppDir
    if (Test-Path $Icon) { $s.IconLocation = $Icon }
    $s.Description = 'Launch Engine'
    $s.Save()
}

if (-not $browser) {
    Write-Warning 'Edge or Chrome not found: the shortcut opens your default browser. Clearing its data would erase launch data, so export backups.'
}
Write-Host "Installed. Open 'Launch Engine' from the Desktop or Start menu. Right-click it to pin to the taskbar."
