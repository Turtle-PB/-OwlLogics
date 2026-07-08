@echo off
REM ============================================================
REM  OwlLogics v1.0 - Console Launcher
REM  Starts local web server (optional) and opens browser.
REM  Data is embedded — server is NOT required.
REM ============================================================
title OwlLogics v1.0 - Automotive Parts Sequencing & Kitting System
cd /d "%~dp0"

echo.
echo   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
echo   @                                                   @@
echo   @   OwlLogics v1.0                                  @@
echo   @   Automotive Parts Sequencing ^& Kitting System    @@
echo   @                                                   @@
echo   @   Chicago AV Tech                                 @@
echo   @                                                   @@
echo   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
echo.
echo   Opening OwlLogics in browser...
echo.
echo   NOTE: No server required. Data is embedded.
echo   This window will close in 3 seconds.
echo.
start "" "index.html"
timeout /t 3 >nul
exit /b 0
