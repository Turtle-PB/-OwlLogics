@echo off
REM ============================================================
REM  OwlLogics - Remove from Windows Startup
REM ============================================================
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

if exist "%STARTUP_DIR%\OwlLogics.lnk" (
    del "%STARTUP_DIR%\OwlLogics.lnk"
    echo [OK] Removed OwlLogics from Windows Startup
) else (
    echo [INFO] OwlLogics was not in the Startup folder
)

echo.
echo   OwlLogics will no longer auto-launch on boot.
echo.
pause
