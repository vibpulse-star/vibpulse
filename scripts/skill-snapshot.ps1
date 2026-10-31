# Sends skill NAMES and DESCRIPTIONS only (never file contents) from ~/.claude to Skill Tree.
param(
  [string]$SiteUrl = $env:VIBPULSE_SITE_URL,
  [string]$Token = $env:VIBPULSE_SKILL_TOKEN
)
$ErrorActionPreference = 'Stop'
if (-not $SiteUrl -or -not $Token) { throw 'Set VIBPULSE_SITE_URL and VIBPULSE_SKILL_TOKEN' }
$root = Join-Path $HOME '.claude'

function Read-Frontmatter([string]$path) {
  $lines = Get-Content -LiteralPath $path -TotalCount 40
  if ($lines[0] -ne '---') { return $null }
  $meta = @{}
  foreach ($l in $lines[1..($lines.Count - 1)]) {
    if ($l -eq '---') { break }
    if ($l -match '^(name|description):\s*"?(.*?)"?\s*$') { $meta[$Matches[1]] = $Matches[2] }
  }
  if ($meta.name) { [pscustomobject]@{ name = $meta.name; description = "$($meta.description)" } }
}

$groups = @{}
Get-ChildItem -Path $root -Recurse -Filter SKILL.md -File -ErrorAction SilentlyContinue | ForEach-Object {
  $rel = $_.FullName.Substring($root.Length + 1) -split '[\\/]'
  # group = plugin folder when under plugins\..., else "personal"
  $i = [array]::IndexOf($rel, 'skills')
  $group = if ($rel[0] -eq 'plugins' -and $i -gt 0) { $rel[$i - 1] } else { 'personal' }
  $skill = Read-Frontmatter $_.FullName
  if ($skill) { if (-not $groups[$group]) { $groups[$group] = @() }; $groups[$group] += $skill }
}

$body = @{ groups = @($groups.GetEnumerator() | ForEach-Object { @{ name = $_.Key; skills = @($_.Value) } }) } |
  ConvertTo-Json -Depth 5 -Compress
Invoke-RestMethod -Method Post -Uri "$SiteUrl/api/skill-snapshot" -ContentType 'application/json' `
  -Headers @{ Authorization = "Bearer $Token" } -Body ([Text.Encoding]::UTF8.GetBytes($body))
