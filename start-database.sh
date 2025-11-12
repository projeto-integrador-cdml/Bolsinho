#!/bin/bash

# Script simples para iniciar o banco MySQL com Docker
# Linux/Mac

echo "============================================"
echo "Iniciando Banco MySQL com Docker"
echo "============================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "[ERRO] Docker não encontrado!"
    echo "Por favor, instale o Docker: https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "[INFO] Docker encontrado!"
echo ""

# Verificar se Docker está rodando
if ! docker info &> /dev/null; then
    echo "[ERRO] Docker não está rodando!"
    echo "Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "[INFO] Docker está rodando!"
echo ""

echo "[INFO] Iniciando banco MySQL..."
echo ""

# Iniciar apenas o serviço db
docker-compose up -d db

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "Banco MySQL iniciado com sucesso!"
    echo "============================================"
    echo ""
    echo "Aguardando banco ficar pronto (30 segundos)..."
    sleep 30
    
    echo ""
    echo "============================================"
    echo "Banco pronto para uso!"
    echo "============================================"
    echo ""
    echo "Credenciais:"
    echo "  Host: localhost"
    echo "  Port: 3306"
    echo "  Database: bolsinho"
    echo "  User: bolsinho"
    echo "  Password: bolsinho_password"
    echo ""
    echo "Próximo passo: Configure o arquivo .env"
    echo "  DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3306/bolsinho"
    echo ""
    echo "Para ver os logs: docker-compose logs -f db"
    echo "Para parar: docker-compose stop db"
    echo ""
else
    echo ""
    echo "============================================"
    echo "Erro ao iniciar banco MySQL!"
    echo "============================================"
    echo ""
    echo "Verifique os logs: docker-compose logs db"
    echo ""
    exit 1
fi

