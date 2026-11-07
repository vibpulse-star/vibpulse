@echo off
rem Double-click to install Launch Engine (no admin needed).
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-LaunchEngine.ps1" %*
pause
