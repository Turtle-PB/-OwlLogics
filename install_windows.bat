@echo off
REM ============================================================
REM  OwlLogics NexGen Owl Mode - Windows Installer
REM  (c) 2024 OwlLogics Contributors - MIT License
REM ============================================================
title OwlLogics Installer
echo.
echo  ==========================================
echo       OwlLogics NexGen Owl Mode v1.0
echo       Automotive Parts Sequencing System
echo  ==========================================
echo.
echo  Installing to: %USERPROFILE%\OwlLogics
echo.

REM Create install directory
mkdir "%USERPROFILE%\OwlLogics" 2>nul

REM Copy all files
echo  Copying files...
xcopy /E /I /Y /Q "%~dp0*.*" "%USERPROFILE%\OwlLogics\" >nul 2>&1

REM Create desktop shortcut
echo  Creating desktop shortcut...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('$env:USERPROFILE\Desktop\OwlLogics.lnk'); $sc.TargetPath = '$env:USERPROFILE\OwlLogics\launch_silent.vbs'; $sc.WorkingDirectory = '$env:USERPROFILE\OwlLogics'; $sc.IconLocation = '$env:USERPROFILE\OwlLogics\owllogics.ico'; $sc.Description = 'OwlLogics NexGen - Automotive Parts Sequencing'; $sc.Save()"

REM Create startup shortcut (auto-launch on boot)
echo  Adding to Windows Startup...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $sc = $ws.CreateShortcut('$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\OwlLogics.lnk'); $sc.TargetPath = '$env:USERPROFILE\OwlLogics\launch_silent.vbs'; $sc.WorkingDirectory = '$env:USERPROFILE\OwlLogics'; $sc.IconLocation = '$env:USERPROFILE\OwlLogics\owllogics.ico'; $sc.Description = 'OwlLogics NexGen Auto-Launch'; $sc.Save()"

echo.
echo  ==========================================
echo   Installation Complete!
echo  ==========================================
echo.
echo  Desktop shortcut created.
echo  Auto-launch on Windows boot enabled.
echo.
echo  Double-click the OwlLogics icon on your
echo  desktop to start the application.
echo.
pause
