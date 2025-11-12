#!/bin/bash

# Script para configurar o banco de dados do Bolsinho no Linux/Mac
# Este script vai executar o SQL para criar o banco e todas as tabelas

echo "============================================"
echo "Configurando Banco de Dados do Bolsinho"
echo "============================================"
echo ""

# Verificar se MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo "[ERRO] MySQL não encontrado!"
    echo "Por favor, instale o MySQL:"
    echo "  Ubuntu/Debian: sudo apt-get install mysql-server"
    echo "  macOS: brew install mysql"
    exit 1
fi

echo "[INFO] MySQL encontrado!"
echo ""

# Solicitar credenciais do MySQL
read -p "Digite o usuário do MySQL (padrão: root): " MYSQL_USER
MYSQL_USER=${MYSQL_USER:-root}

echo ""
read -s -p "Digite a senha do MySQL: " MYSQL_PASS
echo ""

echo ""
echo "============================================"
echo "Criando banco de dados e tabelas..."
echo "============================================"
echo ""

# Executar o script SQL
mysql -u "$MYSQL_USER" -p"$MYSQL_PASS" < setup-database-completo.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================"
    echo "Banco de dados criado com sucesso!"
    echo "============================================"
    echo ""
    echo "Próximo passo: Configure o DATABASE_URL no arquivo .env"
    echo "Exemplo: DATABASE_URL=mysql://$MYSQL_USER:$MYSQL_PASS@localhost:3306/bolsinho"
    echo ""
else
    echo ""
    echo "============================================"
    echo "Erro ao criar banco de dados!"
    echo "============================================"
    echo ""
    echo "Verifique:"
    echo "1. Credenciais do MySQL estão corretas?"
    echo "2. MySQL está rodando?"
    echo "3. Usuário tem permissões para criar bancos?"
    echo ""
    exit 1
fi

