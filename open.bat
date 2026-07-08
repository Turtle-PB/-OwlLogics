@echo off
REM ============================================================
REM  OwlLogics NexGen - One-Click Launcher
REM  Opens index.html directly in default browser.
REM  No server needed — data is embedded inline.
REM ============================================================
cd /d "%~dp0"
start "" "index.html"
exit /b 0
