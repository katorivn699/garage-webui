@echo off
REM Build script for Windows - Single binary with embedded frontend

echo Building Garage WebUI...

REM Build frontend
echo.
echo [36mBuilding frontend...[0m
call pnpm install --frozen-lockfile
if %errorlevel% neq 0 exit /b %errorlevel%

call pnpm run build
if %errorlevel% neq 0 exit /b %errorlevel%

REM Copy frontend to backend for embedding
echo.
echo [36mCopying frontend to backend...[0m
if exist backend\ui\dist rmdir /s /q backend\ui\dist
xcopy /e /i /y dist backend\ui\dist
if %errorlevel% neq 0 exit /b %errorlevel%

REM Build backend with embedded frontend
echo.
echo [36mBuilding backend with embedded frontend...[0m
cd backend

REM Build with prod tag
go build -tags prod -ldflags="-s -w" -o ..\garage-webui.exe .
if %errorlevel% neq 0 (
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo [32mBuild complete![0m
echo.
echo Binary: garage-webui.exe (with embedded frontend)
echo.
echo To run:
echo   1. Copy backend\.env.example to backend\.env and configure
echo   2. garage-webui.exe
