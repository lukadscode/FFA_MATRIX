@echo off
echo Recherche du serveur erg-race...

REM Trouver le PID du processus node server.js sur le port 8081
for /f "tokens=5" %%i in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do set PID=%%i

if "%PID%"=="" (
    echo Aucun serveur trouve sur le port 8081
    echo Le serveur n'est peut-etre pas lance
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
