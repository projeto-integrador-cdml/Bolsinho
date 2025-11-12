@echo off
REM Script para configurar o banco de dados do Bolsinho no Windows
REM Este script vai executar o SQL para criar o banco e todas as tabelas

echo ============================================
echo Configurando Banco de Dados do Bolsinho
echo ============================================
echo.

REM Verificar se MySQL está instalado
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] MySQL nao encontrado no PATH!
    echo Por favor, instale o MySQL ou adicione ao PATH.
    echo.
    pause
    exit /b 1
)

echo [INFO] MySQL encontrado!
echo.

REM Solicitar credenciais do MySQL
set /p MYSQL_USER="Digite o usuario do MySQL (padrao: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

echo.
set /p MYSQL_PASS="Digite a senha do MySQL: "

echo.
echo ============================================
echo Criando banco de dados e tabelas...
echo ============================================
echo.

REM Executar o script SQL
mysql -u %MYSQL_USER% -p%MYSQL_PASS% < setup-database-completo.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Banco de dados criado com sucesso!
    echo ============================================
    echo.
    echo Proximo passo: Configure o DATABASE_URL no arquivo .env
    echo Exemplo: DATABASE_URL=mysql://%MYSQL_USER%:%MYSQL_PASS%@localhost:3306/bolsinho
    echo.
) else (
    echo.
    echo ============================================
    echo Erro ao criar banco de dados!
    echo ============================================
    echo.
    echo Verifique:
    echo 1. Credenciais do MySQL estao corretas?
    echo 2. MySQL esta rodando?
    echo 3. Usuario tem permissoes para criar bancos?
    echo.
)

pause
