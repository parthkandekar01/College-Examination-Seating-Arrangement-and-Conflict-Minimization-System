@echo off
setlocal
title OptiExam ADA - Backend Server
cd /d "%~dp0"
set "PYTHON_EXE=backend\venv\Scripts\python.exe"

if not exist "%PYTHON_EXE%" (
    echo Creating backend virtual environment...
    python -m venv backend\venv
    if errorlevel 1 goto :error
)

"%PYTHON_EXE%" -c "import fastapi, uvicorn, sqlalchemy, pydantic, multipart, pytest, httpx" >nul 2>nul
if errorlevel 1 (
    echo Installing backend dependencies...
    "%PYTHON_EXE%" -m pip install -r backend\requirements.txt
    if errorlevel 1 goto :error
)

set PYTHONPATH=backend
echo Starting FastAPI Backend Server on http://localhost:8000...
"%PYTHON_EXE%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
goto :end

:error
echo Backend setup failed. Check that Python is installed and available as "python".
pause

:end
