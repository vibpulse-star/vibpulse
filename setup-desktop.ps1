# Creates Windows desktop shortcuts that open each VibPulse app in its own window (no browser bar).
# Preferred route is the app's "Install app" button in Edge/Chrome; use this script as a fallback.
# Usage: powershell -ExecutionPolicy Bypass -File .\setup-desktop.ps1 [-BaseUrl https://your-host/path]
param(
  [string]$BaseUrl = "https://vibpulse-star.github.io/vibpulse"
)

$ErrorActionPreference = "Stop"

$edge = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $edge) { throw "Microsoft Edge not found. Open $BaseUrl in Chrome and use the Install app button instead." }

$apps = [ordered]@{ "Skill Tree" = "skill-tree"; "War Room" = "war-room"; "Gap Mining" = "gap-mining" }
$desktop = [Environment]::GetFolderPath("Desktop")
$shell = New-Object -ComObject WScript.Shell

foreach ($name in $apps.Keys) {
  $lnk = $shell.CreateShortcut((Join-Path $desktop "$name.lnk"))
  $lnk.TargetPath = $edge
  $lnk.Arguments = "--app=$($BaseUrl.TrimEnd('/'))/$($apps[$name])/"
  $lnk.Description = $name
  $lnk.Save()
  Write-Host "Created desktop shortcut: $name"
}
