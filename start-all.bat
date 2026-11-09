@echo off
echo ========================================================
echo   StaffConnect - Hackathon Launch Script
echo ========================================================
echo Starting Backend Server on port 8080...
start "StaffConnect Backend" cmd /c "%~dp0backend\run-backend.bat"

echo Waiting 5 seconds for backend initialization...
timeout /t 5 /nobreak >nul

echo Opening StaffConnect Portal...
start "" "%~dp0frontend\index.html"

echo.
echo Application successfully launched!
echo Backend API : http://localhost:8080/api
echo H2 Console  : http://localhost:8080/h2-console
echo Frontend UI : Opened in default browser
echo.
pause
