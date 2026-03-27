@echo off
chcp 65001 >nul
title Budget Tracker - Update

cd /d "%~dp0"

echo.
echo  Updating website...
echo.

git add -A
git commit -m "Update"
git push origin master

if %errorlevel% equ 0 (
    echo.
    echo  Done! Site updated.
    echo  https://pelemehska.github.io/Budget-Tracker-VK
    echo  Changes will appear in 1-2 minutes.
) else (
    echo.
    echo  ERROR: Failed to update.
    echo  Check your internet connection.
)

pause
