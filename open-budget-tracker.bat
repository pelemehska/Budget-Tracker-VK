@echo off
setlocal enabledelayedexpansion
title Budget Tracker - Запуск
color 0D

echo.
echo  ==========================================
echo     Budget Tracker  -  Запуск сервера
echo  ==========================================
echo.

:: --- 1. Node.js ---
echo  [1/5] Проверяю Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  Node.js не найден! Открываю страницу загрузки...
    echo  Установи Node.js и запусти этот файл снова.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)
echo         OK - Node.js найден

:: --- 2. pnpm ---
echo  [2/5] Проверяю pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo         Устанавливаю pnpm...
    npm install -g pnpm >nul 2>&1
)
echo         OK - pnpm готов

:: --- 3. Зависимости ---
echo  [3/5] Устанавливаю зависимости...
pnpm install >nul 2>&1
echo         OK - Зависимости установлены

:: --- 4. Сборка ---
echo  [4/5] Собираю сайт...
pnpm --filter @workspace/budget-tracker run build >nul 2>&1
if errorlevel 1 (
    echo  ОШИБКА при сборке! Попробуй запустить снова.
    pause
    exit /b 1
)
echo         OK - Сайт собран

:: --- 5. Запуск сервера ---
echo  [5/5] Запускаю локальный сервер...
start "Budget Tracker Server" /min cmd /c "pnpm --filter @workspace/budget-tracker run preview --host --port 4173"
timeout /t 4 /nobreak >nul
echo         OK - Сервер запущен на порту 4173

:: --- Cloudflare Tunnel ---
echo.
echo  ==========================================
echo   Настраиваю публичный доступ (Cloudflare)
echo  ==========================================

if not exist "%~dp0cloudflared.exe" (
    echo  Скачиваю cloudflared (только первый раз)...
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%~dp0cloudflared.exe'}"
    if errorlevel 1 (
        echo  Не удалось скачать cloudflared.
        echo  Открываю сайт только локально: http://localhost:4173
        start http://localhost:4173
        pause
        exit /b 1
    )
    echo  OK - cloudflared скачан
)

echo.
echo  ==========================================
echo  Сейчас появится публичная ссылка.
echo  Отправь её кому угодно - они смогут зайти!
echo  Чтобы выключить сервер - закрой это окно.
echo  ==========================================
echo.

"%~dp0cloudflared.exe" tunnel --url http://localhost:4173
