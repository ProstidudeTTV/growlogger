@echo off
title Cannabis Grow Tracker Bot (Production)
color 0C

echo ========================================
echo   Cannabis Grow Tracker Bot - PRODUCTION
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing...
    echo.
    call npm install --production
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed!
    echo.
)

REM Check if dist folder exists
if not exist "dist\" (
    echo [INFO] Building bot for production...
    echo.
    call npm run build
    if errorlevel 1 (
        echo [ERROR] Build failed!
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Build completed!
    echo.
)

REM Check if .env file exists
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo [INFO] Please create a .env file with your configuration.
    echo [INFO] You can copy env.example to .env and fill in your values.
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting bot in production mode...
echo.
call npm start

REM If the bot crashes, keep window open
if errorlevel 1 (
    echo.
    echo [ERROR] Bot crashed or failed to start!
    echo.
    pause
)
