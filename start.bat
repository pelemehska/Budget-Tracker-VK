@echo off
chcp 65001 >nul
title Budget Tracker

cd /d "%~dp0"

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js not installed. Download from https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do set LOCAL_IP=%%b

echo.
echo  Budget Tracker
echo  ==============
echo.
echo  Local:  http://localhost:5173
echo  LAN:    http://%LOCAL_IP%:5173
echo  Online: https://pelemehska.github.io/Budget-Tracker-VK
echo.
echo  Ctrl+C to stop
echo.

call npm run dev
