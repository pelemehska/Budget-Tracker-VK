@echo off
setlocal
rem Dvoynoy klik: okno ne zakryvaetsya
if /i not "%~1"=="RUN" (
  start "Budget Tracker" cmd /k call "%~f0" RUN
  exit /b 0
)

cd /d "%~dp0"
chcp 65001 >nul
color 0D
title Budget Tracker

echo.
echo  === Budget Tracker: start ===
echo.

echo  [1/4] Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo  [ERR] Node.js not found. Install from nodejs.org
    start https://nodejs.org/en/download
    goto :end
)
node --version

echo.
echo  [2/4] pnpm
call :find_pnpm
if not defined PNPM_EXE (
    echo  Trying corepack...
    call corepack enable 2>nul
    call corepack prepare pnpm@latest --activate 2>nul
    call :find_pnpm
)
if not defined PNPM_EXE (
    echo  Installing pnpm globally (may need Admin)...
    call npm install -g pnpm
    call :find_pnpm
)
if not defined PNPM_EXE (
    echo.
    echo  [ERR] pnpm not found. Open CMD as Administrator and run:  npm install -g pnpm
    goto :end
)
call "%PNPM_EXE%" --version

echo.
echo  [3/4] pnpm install
call "%PNPM_EXE%" install
if errorlevel 1 (
    echo  [ERR] pnpm install failed.
    goto :end
)

echo.
echo  [4/4] Starting Vite in second window
start "Budget Tracker Vite" cmd /k call "%~dp0run-vite.bat"

echo  Waiting 5 sec...
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173/"

echo.
echo  Browser opened. Close the Vite window to stop server.
echo.

:end
pause
endlocal
goto :eof

:find_pnpm
set "PNPM_EXE="
if exist "%APPDATA%\npm\pnpm.cmd" set "PNPM_EXE=%APPDATA%\npm\pnpm.cmd"
if not defined PNPM_EXE if exist "%USERPROFILE%\AppData\Local\pnpm\pnpm.cmd" set "PNPM_EXE=%USERPROFILE%\AppData\Local\pnpm\pnpm.cmd"
if defined PNPM_EXE goto :eof
where pnpm >nul 2>&1
if errorlevel 1 goto :eof
for /f "delims=" %%i in ('where pnpm 2^>nul') do (
    set "PNPM_EXE=%%i"
    goto :eof
)
goto :eof
