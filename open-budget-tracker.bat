@echo off
setlocal enabledelayedexpansion
title Budget Tracker - Запуск
color 0D

echo.
echo  ==========================================
echo     Budget Tracker  -  Запуск сервера
echo  ==========================================
echo.

:: Переходим в папку где лежит этот bat файл
cd /d "%~dp0"

:: --- 1. Node.js ---
echo  [1/5] Проверяю Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo  [!] Node.js не найден!
    echo      Установи Node.js с сайта: https://nodejs.org
    echo      После установки запусти этот файл снова.
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo      OK - Node.js %NODE_VER%

:: --- 2. pnpm ---
echo  [2/5] Проверяю pnpm...
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo      Устанавливаю pnpm...
    call npm install -g pnpm
    if errorlevel 1 (
        echo  [!] Не удалось установить pnpm. Запусти cmd от администратора.
        pause
        exit /b 1
    )
)
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VER=%%i
echo      OK - pnpm %PNPM_VER%

:: --- 3. Зависимости ---
echo  [3/5] Устанавливаю зависимости (может занять минуту)...
call pnpm install
if errorlevel 1 (
    echo.
    echo  [!] Ошибка при установке зависимостей!
    pause
    exit /b 1
)
echo      OK

:: --- 4. Сборка ---
echo  [4/5] Собираю сайт...
call pnpm --filter @workspace/budget-tracker run build
if errorlevel 1 (
    echo.
    echo  [!] Ошибка при сборке сайта!
    pause
    exit /b 1
)
echo      OK - Сайт собран

:: --- 5. Запуск сервера ---
echo  [5/5] Запускаю сервер...
start "Budget Tracker" cmd /k "pnpm --filter @workspace/budget-tracker run preview --host 0.0.0.0 --port 4173"
timeout /t 5 /nobreak >nul

:: --- Cloudflare Tunnel ---
echo.
echo  ==========================================
echo   Настраиваю публичный доступ...
echo  ==========================================
echo.

set CFPATH=%~dp0cloudflared.exe

if not exist "%CFPATH%" (
    echo  Скачиваю cloudflared (один раз ~30 МБ)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
        "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CFPATH%'"
    if errorlevel 1 (
        echo.
        echo  [!] Не удалось скачать cloudflared.
        echo      Проверь интернет или скачай вручную:
        echo      https://github.com/cloudflare/cloudflared/releases/latest
        echo      и положи cloudflared.exe рядом с этим файлом.
        echo.
        echo  Сайт доступен локально: http://localhost:4173
        start http://localhost:4173
        pause
        exit /b 1
    )
    echo      OK - cloudflared скачан
)

echo.
echo  ==========================================
echo   Сейчас появится ссылка для подключения.
echo   Отправь её другу - он сможет зайти!
echo.
echo   Чтобы выключить - закрой ОБА окна.
echo  ==========================================
echo.

"%CFPATH%" tunnel --url http://localhost:4173
pause
