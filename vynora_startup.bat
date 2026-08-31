@echo off
title Vynora AI Agent - Background Service
color 0b
echo ===================================================
echo        VYNORA AI AGENT - BOOT SEQUENCE
echo ===================================================
echo.
echo [1/2] Connecting to Cloud Database...
echo (Database is hosted on Render)
echo.

echo [2/2] Starting Vynora Backend (AI Engine) with Ollama...
cd /d "C:\Users\VINAY\OneDrive\Desktop\Vynora\backend"
npm run start:dev
