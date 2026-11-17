@echo off
setlocal
title OptiExam ADA - Frontend Server
cd /d "%~dp0\frontend"

if not exist node_modules (
    echo Installing frontend dependencies...
    call npm.cmd install
    if errorlevel 1 goto :error
)

echo Starting Vite React Frontend on http://localhost:5173...
call npm.cmd run dev
goto :end

:error
echo Frontend setup failed. Check that Node.js and npm are installed and on PATH.
pause

:end
