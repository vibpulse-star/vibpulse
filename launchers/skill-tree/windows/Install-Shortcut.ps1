# Installs a "Skill Tree" shortcut (Desktop + Start menu) with its own icon.
# Run: right-click > Run with PowerShell   (or: powershell -ExecutionPolicy Bypass -File Install-Shortcut.ps1)
$ErrorActionPreference = 'Stop'
$Name = 'Skill Tree'
$Url  = 'https://claude.ai/artifact/FdE6GAtPFz5Je6VLtAMAsZ'
$Home_ = Join-Path $env:LOCALAPPDATA 'VibPulse\skill-tree'
New-Item -ItemType Directory -Force -Path $Home_ | Out-Null
$Icon = Join-Path $Home_ 'app.ico'
Copy-Item -Force (Join-Path $PSScriptRoot 'app.ico') $Icon

$Edge = @("${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
          "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
$Targets = @([Environment]::GetFolderPath('Desktop'), (Join-Path ([Environment]::GetFolderPath('Programs')) 'VibPulse'))
$Shell = New-Object -ComObject WScript.Shell
foreach ($Dir in $Targets) {
    New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    if ($Edge) {
        $Lnk = $Shell.CreateShortcut((Join-Path $Dir "$Name.lnk"))
        $Lnk.TargetPath = $Edge
        $Lnk.Arguments = "--app=$Url"
        $Lnk.IconLocation = "$Icon,0"
        $Lnk.Description = $Name
        $Lnk.Save()
    } else {
        Set-Content -Encoding ASCII -Path (Join-Path $Dir "$Name.url") -Value @(
            '[InternetShortcut]', "URL=$Url", "IconFile=$Icon", 'IconIndex=0')
    }
}
Write-Host "$Name installed on the Desktop and in Start > VibPulse."
