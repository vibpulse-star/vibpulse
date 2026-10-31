# One-time Windows setup for VibPulse. Safe to re-run.
#   .\setup-desktop.ps1 -SiteUrl https://your-domain -Token <SKILL_SNAPSHOT_TOKEN>
param(
  [Parameter(Mandatory)][string]$SiteUrl,
  [Parameter(Mandatory)][string]$Token
)
$ErrorActionPreference = 'Stop'

foreach ($id in 'Git.Git', 'OpenJS.NodeJS.LTS') {
  if (-not (winget list --id $id -e 2>$null | Select-String $id)) {
    winget install --id $id -e --accept-source-agreements --accept-package-agreements
  }
}

# User-scoped env vars read by scripts\skill-snapshot.ps1
[Environment]::SetEnvironmentVariable('VIBPULSE_SITE_URL', $SiteUrl, 'User')
[Environment]::SetEnvironmentVariable('VIBPULSE_SKILL_TOKEN', $Token, 'User')

# Hourly Skill Tree snapshot
$script = Join-Path $PSScriptRoot 'scripts\skill-snapshot.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$script`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName 'VibPulse Skill Snapshot' -Action $action -Trigger $trigger -Force | Out-Null

$env:VIBPULSE_SITE_URL = $SiteUrl; $env:VIBPULSE_SKILL_TOKEN = $Token
& $script
Write-Host 'Done. Skill Tree snapshot runs hourly.'
