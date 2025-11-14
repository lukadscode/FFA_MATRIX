@echo off
echo Recherche du serveur erg-race...

REM Trouver le PID du processus node server.js
for /f "tokens=2" %%i in ('netstat -ano ^| findstr :8081') do set PID=%%i

if "%PID%"=="" (
    echo Aucun serveur trouve sur le port 8081
    exit /b 1
)

echo Serveur trouve (PID: %PID%)
echo Arret du serveur...

REM Tuer le processus
taskkill /PID %PID% /F

if %ERRORLEVEL% EQU 0 (
    echo Serveur arrete avec succes
) else (
    echo Erreur lors de l'arret du serveur
    exit /b 1
)
