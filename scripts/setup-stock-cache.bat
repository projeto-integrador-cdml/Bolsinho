@echo off
echo ========================================
echo Setup: Cache de Acoes
echo ========================================
echo.

echo [1/3] Criando tabela stockCache...
docker exec -i bolsinho-db mysql -ubolsinho -pbolsinho_password bolsinho < scripts\create-stock-cache-table.sql

if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Nao foi possivel criar a tabela
    echo Verifique se o container MySQL esta rodando
    pause
    exit /b 1
)

echo.
echo [2/3] Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo [3/3] Populando cache com dados iniciais...
echo Isso pode levar alguns segundos...
pnpm populate-stocks

if %ERRORLEVEL% NEQ 0 (
    echo ERRO: Nao foi possivel popular o cache
    echo Verifique se o servidor esta configurado corretamente
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup concluido com sucesso!
echo ========================================
echo.
echo Os dados das acoes estao agora em cache.
echo Acesse a aba "Acoes" no dashboard para ver os dados.
echo.
pause

