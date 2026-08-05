@echo off
echo Starting Smart Meter IoT Dashboard...
echo.

echo Starting Backend Server...
start "Smart Meter Backend" cmd /k "cd /d "%~dp0backend" && npm run dev"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Smart Meter Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Both servers are starting!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Close the command windows to stop the servers.
pause
