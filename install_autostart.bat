@echo off
REM ============================================================
REM  OwlLogics - Auto-Launch Setup (No Server Needed)
REM  Creates shortcuts for auto-launch with Windows boot.
REM  Data is embedded — just open index.html directly.
REM ============================================================
cd /d "%~dp0"

echo ================================================================
echo   OwlLogics - Auto-Launch Setup
echo ================================================================
echo.

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$sc = $ws.CreateShortcut('%STARTUP_DIR%\OwlLogics.lnk'); " ^
  "$sc.TargetPath = '%~dp0launch_silent.vbs'; " ^
  "$sc.WorkingDirectory = '%~dp0'; " ^
  "$sc.Description = 'OwlLogics - Automotive Parts Sequencing System'; " ^
  "$sc.Save()"

echo [OK] OwlLogics shortcut created in Windows Startup folder
echo       %STARTUP_DIR%\OwlLogics.lnk
echo       OwlLogics will launch on every Windows boot (silent, no console).
echo.

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$sc = $ws.CreateShortcut('%USERPROFILE%\Desktop\OwlLogics.lnk'); " ^
  "$sc.TargetPath = '%~dp0open.bat'; " ^
  "$sc.WorkingDirectory = '%~dp0'; " ^
  "$sc.Description = 'OwlLogics - Automotive Parts Sequencing System'; " ^
  "$sc.Save()"

echo [OK] Desktop shortcut created: %USERPROFILE%\Desktop\OwlLogics.lnk
echo.
echo   To launch manually: double-click the OwlLogics desktop shortcut
echo   To stop auto-launch: run uninstall_autostart.bat
echo.
pause
