@echo off
chcp 65001 >nul
title Ponte de Video - instalar
cd /d "%~dp0"
set PY=
py -3.13 --version >nul 2>nul && set "PY=py -3.13"
if not defined PY py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set PY=python
if not defined PY (echo O Python nao foi encontrado. Instale em https://www.python.org/downloads/ marcando "Add python.exe to PATH" e rode este arquivo de novo.& start https://www.python.org/downloads/ & pause & exit /b)
echo Instalando os componentes (alguns minutos)...
%PY% -m pip install --upgrade pip
%PY% -m pip install -r requirements.txt || (echo Falhou a instalacao. Tire um print e mande no chat.& pause & exit /b)
%PY% -m playwright install chromium || (echo Falhou o navegador. Tire um print e mande no chat.& pause & exit /b)
echo.
echo Tudo pronto. Agora de dois cliques em "GERAR VIDEO.bat".
pause
