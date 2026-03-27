@echo off
chcp 65001 >nul
title Budget Tracker - Обновление

cd /d "%~dp0"

echo.
echo  ═══════════════════════════════════
echo   Обновление сайта
echo  ═══════════════════════════════════
echo.

:: Проверяем есть ли изменения
git status --porcelain >nul 2>&1
if %errorlevel% neq 0 (
    echo  Нет изменений для обновления
    pause
    exit /b 0
)

:: Добавляем все изменения
git add -A

:: Коммитим с текущей датой
for /f "tokens=1-3 delims=. " %%a in ('date /t') do set DATE=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a:%%b
git commit -m "Обновление %DATE% %TIME%"

:: Пушим на GitHub
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo  ═══════════════════════════════════
    echo   Сайт обновлён!
    echo  ═══════════════════════════════════
    echo.
    echo   Онлайн: https://pelemehska.github.io/Budget-Tracker-VK
    echo.
    echo   Изменения появятся через 1-2 минуты
) else (
    echo.
    echo  ОШИБКА: Не удалось обновить сайт
    echo  Проверь подключение к интернету
)

pause
