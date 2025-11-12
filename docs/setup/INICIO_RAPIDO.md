# 🚀 Início Rápido - Bolsinho

## ✅ Banco de Dados Configurado!

O banco MySQL está rodando no Docker e pronto para uso!

**Status**: ✅ Container `bolsinho-db` rodando (porta 3307)
**Tabelas**: ✅ 9 tabelas criadas automaticamente
**Usuário**: ✅ `bolsinho` / `bolsinho_password`

## 📝 Próximo Passo: Configurar .env

### 1. Criar arquivo .env

Na raiz do projeto, crie um arquivo `.env` com o seguinte conteúdo:

```env
# Database (Docker MySQL - porta 3307)
DATABASE_URL=mysql://bolsinho:bolsinho_password@localhost:3307/bolsinho

# JWT Secret (OBRIGATÓRIO - gere uma chave aleatória)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# Groq API (opcional - para chat com IA)
GROQ_API_KEY=sua_chave_groq_aqui

# News API (opcional - para notícias financeiras)
NEWS_API_KEY=sua_chave_news_api_aqui
```

### 2. Gerar JWT_SECRET

**Windows (PowerShell)**:
```powershell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([System.Guid]::NewGuid().ToString() + [System.Guid]::NewGuid().ToString()))
```

**Linux/Mac**:
```bash
openssl rand -base64 32
```

Cole o resultado no `.env` como `JWT_SECRET`.

### 3. Executar o servidor

```bash
pnpm dev
```

### 4. Acessar a aplicação

Abra o navegador em: `http://localhost:3000`

## 🎯 Checklist

- [x] Banco MySQL rodando no Docker
- [x] Tabelas criadas
- [ ] Arquivo `.env` criado
- [ ] `DATABASE_URL` configurado
- [ ] `JWT_SECRET` configurado
- [ ] Servidor executando: `pnpm dev`
- [ ] Primeiro usuário criado (registro no frontend)

## 🛠️ Comandos Úteis

### Banco de Dados

```bash
# Iniciar banco
docker-compose up -d db

# Parar banco
docker-compose stop db

# Ver logs
docker-compose logs -f db

# Conectar ao banco
docker exec -it bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho
```

### Servidor

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Produção
pnpm start
```

## 📊 Credenciais do Banco

- **Host**: `localhost`
- **Port**: `3307`
- **Database**: `bolsinho`
- **User**: `bolsinho`
- **Password**: `bolsinho_password`

## 🔍 Verificar se está funcionando

```bash
# Ver containers
docker ps

# Ver tabelas
docker exec bolsinho-db mysql -u bolsinho -pbolsinho_password bolsinho -e "SHOW TABLES;"

# Testar conexão
pnpm dev
```

Se tudo estiver correto, você verá:
- ✅ Servidor rodando em `http://localhost:3000`
- ✅ Sem erros de conexão
- ✅ Frontend carregando normalmente

## 🎉 Pronto!

Agora você pode:
1. Acessar `http://localhost:3000`
2. Criar sua primeira conta
3. Começar a usar o Bolsinho!

---

**Dúvidas?** Consulte:
- [Setup do Docker MySQL](SETUP_DOCKER_MYSQL.md) - Guia completo do banco
- [Configuração do Ambiente](CONFIGURAR_ENV.md) - Guia de configuração do .env
- [Resumo do Setup do Banco](RESUMO_SETUP_BANCO.md) - Resumo do setup

