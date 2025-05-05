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
    echo Error: Frontend directory not found!
    echo Please run this script from the root of your Trading Journal project.
    pause
    exit /b 1
)

if not exist "%BACKEND_DIR%" (
    echo Error: Backend directory not found!
    echo Please run this script from the root of your Trading Journal project.
    pause
    exit /b 1
)

:: Start backend server in a new window
echo Starting backend server...
start "Trading Journal Backend" cmd /c "cd %BACKEND_DIR% && python api_only.py"

:: Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

:: Start frontend server in a new window
echo Starting frontend server...
start "Trading Journal Frontend" cmd /c "cd %FRONTEND_DIR% && npm start"

:: Wait for frontend to start
echo Waiting for frontend to initialize...
timeout /t 5 /nobreak > nul

:: Open browser
echo Opening browser to Trading Journal...
start "" "http://localhost:3000"

echo.
echo Trading Journal is now running!
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
echo Note: Close the terminal windows to stop the servers.
echo.

pause