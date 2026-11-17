@echo off
title OptiExam ADA - System Launcher
echo ========================================================
echo OptiExam ADA - Examination Seating & Conflict Minimizer
echo Analysis & Design of Algorithms (ADA) Academic Project
echo ========================================================
echo.
echo 1. Launching Backend Server on port 8000...
start "OptiExam Backend" /D "%~dp0" cmd /k start-backend.bat

echo 2. Waiting for the backend to become ready...
powershell -NoProfile -Command "$deadline = (Get-Date).AddSeconds(120); while ((Get-Date) -lt $deadline) { try { $null = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/' -TimeoutSec 2; exit 0 } catch { Start-Sleep -Seconds 1 } }; exit 1"
if errorlevel 1 (
    echo Backend did not become ready. Check the backend window for errors.
    pause
    exit /b 1
)

echo 3. Launching Frontend Server on port 5173...
start "OptiExam Frontend" /D "%~dp0" cmd /k start-frontend.bat

echo.
echo Application launched!
echo Open your browser at: http://localhost:5173
echo.
pause
