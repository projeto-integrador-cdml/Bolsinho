# Script PowerShell para testar o banco MySQL no Docker

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Testando Banco MySQL" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Aguardar MySQL inicializar
Write-Host "Aguardando MySQL inicializar (40 segundos)..." -ForegroundColor Yellow
Start-Sleep -Seconds 40

Write-Host ""
Write-Host "Verificando container..." -ForegroundColor Yellow
docker ps | Select-String "bolsinho-db"

Write-Host ""
Write-Host "Verificando logs..." -ForegroundColor Yellow
docker-compose logs db --tail 10

Write-Host ""
Write-Host "Testando conexão como root..." -ForegroundColor Yellow
docker exec bolsinho-db mysql -u root -pbolsinho_root_password -e "SHOW DATABASES;" 2>&1

Write-Host ""
Write-Host "Testando conexão como bolsinho..." -ForegroundColor Yellow
docker exec bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho -e "SHOW TABLES;" 2>&1

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Teste concluído!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

