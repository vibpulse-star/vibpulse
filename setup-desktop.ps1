# Installs claude-mem (persistent memory for Claude Code) on a Windows PC.
# Run in PowerShell:  powershell -ExecutionPolicy Bypass -File .\setup-desktop.ps1
$ErrorActionPreference = 'Stop'

function Assert-Step($ok, $msg) { if (-not $ok) { Write-Error "FAILED: $msg"; exit 1 } }

# 1. Node.js 18+ (claude-mem runs via npx; Bun is fetched by its installer)
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node -or [int]((node -v).TrimStart('v').Split('.')[0]) -lt 18) {
    Write-Host 'Installing Node.js LTS via winget...'
    winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
}
Assert-Step (Get-Command node -ErrorAction SilentlyContinue) 'Node.js not on PATH - reopen PowerShell and rerun.'

# 2. Claude Code must already be installed - claude-mem hooks into it
Assert-Step (Test-Path "$HOME\.claude") 'Claude Code not found (~\.claude missing). Install Claude Code first.'

# 3. Install claude-mem (registers plugin, hooks and worker)
npx -y claude-mem@latest install
Assert-Step ($LASTEXITCODE -eq 0) 'claude-mem install'

# 4. Start the worker and verify
npx -y claude-mem start
npx -y claude-mem status
Assert-Step ($LASTEXITCODE -eq 0) 'claude-mem worker not healthy'

Write-Host ''
Write-Host 'Done. Restart Claude Code. Memory data lives in ~\.claude-mem - back that folder up.'
Write-Host 'Web viewer: http://localhost:37777 (default port on Windows).'
