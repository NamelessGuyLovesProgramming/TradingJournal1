@echo off
TITLE Trading Journal Starter

:: Display header
echo ================================================
echo              Trading Journal Starter
echo ================================================
echo.

:: Set directories
set FRONTEND_DIR=frontend
set BACKEND_DIR=backend

:: Check if directories exist
if not exist "%FRONTEND_DIR%" (
    echo Fehler: Frontend-Verzeichnis nicht gefunden!
    echo Bitte führe dieses Skript vom Stammverzeichnis deines Trading Journal-Projekts aus.
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%" (
    echo Fehler: Backend-Verzeichnis nicht gefunden!
    echo Bitte führe dieses Skript vom Stammverzeichnis deines Trading Journal-Projekts aus.
    pause
    exit /b 1
)

:: Check if backend is already running
tasklist /FI "WINDOWTITLE eq Trading Journal Backend" 2>NUL | find "cmd.exe" >NUL
if not errorlevel 1 (
    echo Backend läuft bereits!
) else (
    :: Start backend server in a new window
    echo Starte Backend-Server...
    start "Trading Journal Backend" cmd /c "cd %BACKEND_DIR% && python api_only.py"
)

:: Wait for backend to start
echo Warte auf Initialisierung des Backends...
timeout /t 3 /nobreak > nul

:: Check if frontend is already running
tasklist /FI "WINDOWTITLE eq Trading Journal Frontend" 2>NUL | find "cmd.exe" >NUL
if not errorlevel 1 (
    echo Frontend läuft bereits!
) else (
    :: Start frontend server in a new window without opening a browser
    echo Starte Frontend-Server...
    start "Trading Journal Frontend" cmd /c "cd %FRONTEND_DIR% && set BROWSER=none&& npm start"
)

:: Wait for frontend to start
echo Warte auf Initialisierung des Frontends...
timeout /t 8 /nobreak > nul

:: Create a flag file to track browser launch
set FLAG_FILE=%TEMP%\trading_journal_browser_opened.flag

:: Check if browser has been opened in this session
if exist "%FLAG_FILE%" (
    echo Browser wurde bereits geöffnet.
) else (
    :: Open browser and create flag file
    echo Öffne Browser für das Trading Journal...
    start "" "http://localhost:3000"
    echo. > "%FLAG_FILE%"
)

:: Exit this window after launching everything
timeout /t 2 /nobreak > nul
exit