@echo off
title Cannabis Grow Tracker Bot
color 0A

echo ========================================
echo   Cannabis Grow Tracker Discord Bot
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [SUCCESS] Dependencies installed!
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

REM Check if dist folder exists (for production)
if exist "dist\" (
    echo [INFO] Production build detected. Starting bot...
    echo.
    call npm start
) else (
    echo [INFO] Development mode. Building and starting bot...
    echo.
    call npm run dev
)

REM If the bot crashes, keep window open
if errorlevel 1 (
    echo.
    echo [ERROR] Bot crashed or failed to start!
    echo.
    pause
)
