# ✅ Banco de Dados Configurado com Sucesso!

## 🎉 Status

✅ **Banco MySQL rodando no Docker**
- Container: `bolsinho-db`
- Status: Rodando e saudável
- Porta: `3307` (externa) → `3306` (interna)

✅ **Banco de dados criado**: `bolsinho`

✅ **Tabelas criadas automaticamente**:
- users (com campo `passwordHash`)
- categories
- transactions
- budgets
- goals
- chatMessages
- alerts
- documents
- investments

✅ **Usuário criado**: `bolsinho` / `bolsinho_password`

## 🔧 Configuração do .env

Crie ou edite o arquivo `.env` na raiz do projeto:

```env
# Database (Docker - porta 3307)
DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3307/bolsinho

# JWT Secret (OBRIGATÓRIO - gere uma chave segura)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui_mude_em_producao

# Groq API (opcional - para chat com IA)
GROQ_API_KEY=sua_chave_groq

# News API (opcional - para notícias financeiras)
NEWS_API_KEY=sua_chave_news_api

# Forge API (opcional - fallback para LLM)
BUILT_IN_FORGE_API_URL=https://api.forge.ai
BUILT_IN_FORGE_API_KEY=sua_chave_forge
```

## 🚀 Próximos Passos

1. ✅ Banco MySQL configurado
2. ⏭️ **Configurar `.env`** com `DATABASE_URL` e `JWT_SECRET`
3. ⏭️ **Executar servidor**: `pnpm dev`
4. ⏭️ **Criar primeiro usuário** através do frontend (página de registro)

## 📊 Credenciais do Banco

- **Host**: `localhost`
- **Port**: `3307`
- **Database**: `bolsinho`
- **User**: `bolsinho`
- **Password**: `bolsinho_password`
- **Root Password**: `bolsinho_root_password`

## 🛠️ Comandos Úteis

### Ver logs do banco
```bash
docker-compose logs -f db
```

### Conectar ao banco
```bash
docker exec -it bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho
```

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

### Recriar do zero (CUIDADO - perde dados)
```bash
docker-compose down -v db
docker-compose up -d db
```

## ✅ Verificação

Para verificar se tudo está funcionando:

```bash
# Ver containers rodando
docker ps

# Ver tabelas criadas
docker exec bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho -e "SHOW TABLES;"

# Ver estrutura da tabela users
docker exec bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho -e "DESCRIBE users;"
```

## 🎯 Pronto para Usar!

O banco de dados está configurado e pronto para uso. Agora você pode:

1. Configurar o `.env` com as credenciais
2. Executar `pnpm dev` para iniciar o servidor
3. Acessar `http://localhost:3000` no navegador
4. Criar sua primeira conta através da página de registro

---

**Nota**: Os dados persistem mesmo após parar o container (volume Docker). Para recriar do zero, use `docker-compose down -v db`.

