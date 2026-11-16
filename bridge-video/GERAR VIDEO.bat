@echo off
chcp 65001 >nul
title Ponte de Video - Diario de Trader
cd /d "%~dp0"
set PY=
py -3.13 --version >nul 2>nul && set "PY=py -3.13"
if not defined PY py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set PY=python
%PY% ponte_video.py %*
