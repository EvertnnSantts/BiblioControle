@echo off
title BiblioControle - Inicializando Sistema
color 0A

echo ========================================
echo   BiblioControle - Sistema de Biblioteca
echo ========================================
echo.

REM Obter o diretório onde o script está localizado
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"

echo Pasta do projeto: %PROJECT_DIR%
echo.

REM Iniciar o servidor backend em uma nova janela
echo [1/2] Iniciando servidor backend...
start "BiblioControle - Servidor" cmd /k "cd /d "%PROJECT_DIR%" && node server/src/index.js"

REM Aguardar um momento para o servidor iniciar
timeout /t 3 /nobreak >nul

REM Iniciar o frontend em uma nova janela
echo [2/2] Iniciando frontend...
start "BiblioControle - Frontend" cmd /k "cd /d "%PROJECT_DIR%\client" && npm run dev"

echo.
echo ========================================
echo   Sistema iniciado com sucesso!
echo.
echo   - Servidor: http://localhost:5000
echo   - Frontend: http://localhost:5173
echo ========================================
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul