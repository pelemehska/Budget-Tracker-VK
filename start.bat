@echo off
chcp 65001 >nul
title Budget Tracker

cd /d "%~dp0"

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js не установлен. Скачай с https://nodejs.org
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Установка зависимостей...
    call npm install
)

:: Получаем IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do set LOCAL_IP=%%b

echo.
echo  ═══════════════════════════════════
echo   Budget Tracker
echo  ═══════════════════════════════════
echo.
echo   Локально: http://localhost:5173
echo   В сети:   http://%LOCAL_IP%:5173
echo   Онлайн:   https://pelemehska.github.io/Budget-Tracker-VK
echo.
echo   Ctrl+C для остановки
echo.

call npm run dev
