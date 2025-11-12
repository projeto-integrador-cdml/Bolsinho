# 🐳 Configuração do Banco MySQL com Docker

## ⚡ Início Rápido

### 1. Iniciar o Banco MySQL

```bash
# Windows
.\start-database.bat

# Linux/Mac
chmod +x start-database.sh
./start-database.sh

# Ou diretamente com Docker Compose
docker-compose up -d db
```

### 2. Configurar o arquivo `.env`

Crie o arquivo `.env` na raiz do projeto:

```env
# Database (Docker - porta 3307)
DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3307/bolsinho

# JWT Secret (OBRIGATÓRIO)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# Groq API (opcional)
GROQ_API_KEY=sua_chave_groq

# News API (opcional)
NEWS_API_KEY=sua_chave_news_api
```

### 3. Pronto! 🎉

Agora você pode executar o servidor:

```bash
pnpm dev
```

---

## 📋 Informações do Banco

- **Host**: `localhost`
- **Port**: `3307` (porta externa do Docker)
- **Database**: `bolsinho`
- **User**: `bolsinho`
- **Password**: `bolsinho_password`
- **Root Password**: `bolsinho_root_password`

> **Nota**: A porta 3307 é usada porque você provavelmente tem um MySQL local na porta 3306. Se não tiver, pode alterar para 3306 no `docker-compose.yml`.

---

## 🔍 Verificar se está funcionando

### Ver logs do container

```bash
docker-compose logs -f db
```

### Conectar ao banco via Docker

```bash
docker exec -it bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho
```

Dentro do MySQL:

```sql
SHOW TABLES;
DESCRIBE users;
EXIT;
```

### Verificar tabelas criadas

Deve mostrar:
- ✅ users
- ✅ categories
- ✅ transactions
- ✅ budgets
- ✅ goals
- ✅ chatMessages
- ✅ alerts
- ✅ documents
- ✅ investments

---

## 🛠️ Comandos Úteis

### Parar o banco

```bash
docker-compose stop db
```

### Iniciar o banco

```bash
docker-compose start db
```

### Reiniciar o banco

```bash
docker-compose restart db
```

### Ver status

```bash
docker ps
```

### Parar e remover (CUIDADO - perde dados)

```bash
docker-compose down db
```

### Recriar do zero (CUIDADO - perde todos os dados)

```bash
# Parar e remover volumes
docker-compose down -v db

# Recriar
docker-compose up -d db
```

---

## 🔧 Troubleshooting

### Erro: "Port 3306 is already in use"

**Solução**: O Docker está configurado para usar a porta **3307** para evitar conflito. Use:

```env
DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3307/bolsinho
```

Se quiser usar 3306, pare o MySQL local primeiro ou altere a porta no `docker-compose.yml`.

### Erro: "Cannot connect to MySQL"

**Solução**: 
1. Verifique se o container está rodando: `docker ps`
2. Verifique os logs: `docker-compose logs db`
3. Aguarde alguns segundos (o MySQL demora ~30s para inicializar)

### Erro: "Access denied"

**Solução**: Verifique as credenciais no `.env`:
- User: `bolsinho`
- Password: `bolsinho_password`
- Database: `bolsinho`

### Resetar o banco

Se precisar recriar tudo:

```bash
docker-compose down -v db
docker-compose up -d db
```

---

## 📊 Estrutura do Banco

O script `docker/mysql/init.sql` cria automaticamente:

1. **users** - Usuários (com campo `passwordHash` para autenticação)
2. **categories** - Categorias de gastos
3. **transactions** - Transações financeiras
4. **budgets** - Orçamentos
5. **goals** - Metas financeiras
6. **chatMessages** - Mensagens do chat
7. **alerts** - Alertas e notificações
8. **documents** - Documentos processados
9. **investments** - Investimentos/portfólio

Todas as tabelas incluem:
- ✅ Foreign keys configuradas
- ✅ Índices para performance
- ✅ Charset UTF8MB4 (suporte a emojis)
- ✅ Timestamps automáticos

---

## 🚀 Próximos Passos

1. ✅ Banco MySQL rodando no Docker (porta 3307)
2. ✅ Tabelas criadas automaticamente
3. ⏭️ Configurar `.env` com `DATABASE_URL` e `JWT_SECRET`
4. ⏭️ Executar `pnpm dev` para iniciar o servidor
5. ⏭️ Criar primeiro usuário através do frontend

---

## 💡 Dicas

- Os dados persistem mesmo após parar o container (volume Docker)
- O script de inicialização só executa na primeira vez
- Para recriar, use `docker-compose down -v` para remover volumes
- Você pode conectar com qualquer cliente MySQL (DBeaver, Workbench, etc.)
- Use a porta **3307** para conectar do host (não 3306)
