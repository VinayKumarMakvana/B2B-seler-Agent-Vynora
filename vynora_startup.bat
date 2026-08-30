@echo off
title Vynora AI Agent - Background Service
color 0b
echo ===================================================
echo        VYNORA AI AGENT - BOOT SEQUENCE
echo ===================================================
echo.
echo [1/3] Waiting for Docker Desktop to initialize...
echo (Please ensure Docker Desktop is running)
echo.

:DOCKER_WAIT
docker info >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 3 >nul
    goto DOCKER_WAIT
)

echo [2/3] Docker is ready! Starting Database...
cd /d "C:\Users\VINAY\OneDrive\Desktop\Vynora"
docker-compose up -d

echo.
echo [3/3] Starting Vynora Backend (AI Engine)...
cd backend
npm run start:dev
