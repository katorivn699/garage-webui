@echo off
REM Build script for Windows

echo Building Garage WebUI...

REM Build frontend
echo.
echo [36mBuilding frontend...[0m
call pnpm install --frozen-lockfile
if %errorlevel% neq 0 exit /b %errorlevel%

call pnpm run build
if %errorlevel% neq 0 exit /b %errorlevel%

REM Build backend
echo.
echo [36mBuilding backend...[0m
cd backend

REM Build
go build -ldflags="-s -w" -o ..\garage-webui.exe .
if %errorlevel% neq 0 (
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo [32mBuild complete![0m
echo.
echo Binary: garage-webui.exe
echo Frontend dist: dist\
echo.
echo To run:
echo   1. Copy backend\.env.example to backend\.env and configure
echo   2. garage-webui.exe
