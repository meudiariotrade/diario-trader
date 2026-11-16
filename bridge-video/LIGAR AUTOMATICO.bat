@echo off
chcp 65001 >nul
title Ponte de Video - ligar automatico
cd /d "%~dp0"
set PY=
py -3.13 --version >nul 2>nul && set "PY=py -3.13"
if not defined PY py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set PY=python
%PY% ponte_video.py --config-auto || (pause & exit /b)
set INI=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\Ponte de Video (Diario de Trader).bat
(echo @echo off& echo cd /d "%~dp0"& echo start "Ponte de Video" /min %PY% ponte_video.py --vigiar)> "%INI%"
echo.
echo Pronto: a ponte vai abrir sozinha (minimizada) sempre que o Windows ligar.
echo Abrindo agora...
start "Ponte de Video" /min %PY% ponte_video.py --vigiar
pause
