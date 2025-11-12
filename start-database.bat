@echo off
REM Script simples para iniciar o banco MySQL com Docker
REM Windows

echo ============================================
echo Iniciando Banco MySQL com Docker
echo ============================================
echo.

REM Verificar se Docker está instalado
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Docker nao encontrado!
    echo Por favor, instale o Docker Desktop: https://www.docker.com/products/docker-desktop
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker encontrado!
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop.
    echo.
    pause
    exit /b 1
)

echo [INFO] Docker esta rodando!
echo.

echo [INFO] Iniciando banco MySQL...
echo.

REM Iniciar apenas o serviço db
docker-compose up -d db

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Banco MySQL iniciado com sucesso!
    echo ============================================
    echo.
    echo Aguardando banco ficar pronto (30 segundos)...
    timeout /t 30 /nobreak >nul
    
    echo.
    echo ============================================
    echo Banco pronto para uso!
    echo ============================================
    echo.
    echo Credenciais:
    echo   Host: localhost
    echo   Port: 3307
    echo   Database: bolsinho
    echo   User: bolsinho
    echo   Password: bolsinho_password
    echo.
    echo Proximo passo: Configure o arquivo .env
    echo   DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3307/bolsinho
    echo   JWT_SECRET=sua_chave_secreta_aqui
    echo.
    echo Para ver os logs: docker-compose logs -f db
    echo Para parar: docker-compose stop db
    echo.
) else (
    echo.
    echo ============================================
    echo Erro ao iniciar banco MySQL!
    echo ============================================
    echo.
    echo Verifique os logs: docker-compose logs db
    echo.
)

pause

