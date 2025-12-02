@echo off
title CRM Sentiment Analysis - Stopping...
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "stop-all.ps1"
pause
