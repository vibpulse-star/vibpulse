LAUNCH ENGINE FOR WINDOWS

Install or update
1. Extract this zip.
2. Double-click Install.cmd. If SmartScreen appears, choose "More info", then "Run anyway".
3. Open "Launch Engine" from the Desktop or Start menu. Right-click it, then "Pin to taskbar".

To update, extract the new zip and double-click Install.cmd again. Your data stays.
To uninstall, run: powershell -ExecutionPolicy Bypass -File Install-LaunchEngine.ps1 -Uninstall

Your data
- Data is kept in %LOCALAPPDATA%\LaunchEngine\profile. It is separate from your normal browser,
  so clearing browser history won't erase it.
- To move data to or from your phone, use the menu (...) and then Export backup / Import backup.
