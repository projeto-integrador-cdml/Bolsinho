# Backend do Bolsinho - Configuração Completa

## ✅ O que foi implementado

### 1. Autenticação por Email/Senha
- ✅ Sistema de registro de usuários
- ✅ Sistema de login com validação
- ✅ Hash de senhas com bcrypt
- ✅ Sessões JWT com cookies HTTP-only
- ✅ Endpoint `auth.me` para verificar autenticação
- ✅ Endpoint `auth.logout` para fazer logout

### 2. Endpoints de Dashboard
- ✅ `dashboard.stats` - Estatísticas do portfólio
  - Portfólio total
  - Rendimento mensal
  - Ações monitoradas
  - Contagem de investimentos

### 3. Endpoints de Investimentos
- ✅ `investments.list` - Listar investimentos do usuário
- ✅ `investments.create` - Criar novo investimento
- ✅ `investments.update` - Atualizar investimento
- ✅ `investments.delete` - Deletar investimento

### 4. Endpoints de Ações (Stocks)
- ✅ `stocks.info` - Informações da ação
- ✅ `stocks.history` - Histórico de preços
- ✅ `stocks.variation` - Variação no período
- ✅ `stocks.search` - Buscar ações

### 5. Banco de Dados
- ✅ Schema atualizado com campo `passwordHash`
- ✅ Tabela `investments` criada
- ✅ Campo `openId` tornando nullable (para email/password)
- ✅ Campo `email` único
- ✅ Migration SQL criada (`setup-database-auth.sql`)

### 6. Integração Frontend
- ✅ Página de login integrada com backend
- ✅ Página de registro integrada
- ✅ Dashboard protegido (redireciona para login se não autenticado)
- ✅ Estatísticas do dashboard carregadas do backend
- ✅ Logout funcional

## 📋 Configuração Necessária

### 1. Variáveis de Ambiente (.env)

```env
# Database
DATABASE_URL=mysql://usuario:senha@localhost:3306/bolsinho

# JWT Secret (OBRIGATÓRIO)
JWT_SECRET=sua_chave_secreta_muito_segura_aqui

# Groq API (opcional)
GROQ_API_KEY=sua_chave_groq

# News API (opcional)
NEWS_API_KEY=sua_chave_news_api

# Forge API (opcional - fallback)
BUILT_IN_FORGE_API_URL=https://api.forge.ai
BUILT_IN_FORGE_API_KEY=sua_chave_forge
```

### 2. Instalar Dependências

```bash
# Node.js
pnpm install

# Python
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Configurar Banco de Dados

```bash
# Criar banco de dados
mysql -u root -p
CREATE DATABASE bolsinho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Executar migration
mysql -u root -p bolsinho < setup-database-auth.sql
```

### 4. Executar Servidor

```bash
# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start
```

## 🔐 Segurança

- ✅ Senhas hasheadas com bcrypt (10 rounds)
- ✅ Cookies HTTP-only
- ✅ JWT com expiração de 1 ano
- ✅ Validação de entrada com Zod
- ✅ Proteção contra SQL injection (Drizzle ORM)
- ✅ SameSite cookie configurado para desenvolvimento e produção

## 📊 Estrutura da API

### Autenticação
- `POST /api/trpc/auth.register` - Registrar usuário
- `POST /api/trpc/auth.login` - Fazer login
- `GET /api/trpc/auth.me` - Obter usuário atual
- `POST /api/trpc/auth.logout` - Fazer logout

### Dashboard
- `GET /api/trpc/dashboard.stats` - Estatísticas

### Investimentos
- `GET /api/trpc/investments.list` - Listar
- `POST /api/trpc/investments.create` - Criar
- `POST /api/trpc/investments.update` - Atualizar
- `POST /api/trpc/investments.delete` - Deletar

### Ações
- `GET /api/trpc/stocks.info?ticker=PETR4` - Info
- `GET /api/trpc/stocks.history?ticker=PETR4&period=1mo` - Histórico
- `GET /api/trpc/stocks.variation?ticker=PETR4&period=1mo` - Variação
- `GET /api/trpc/stocks.search?query=petrobras` - Buscar

## 🚀 Próximos Passos

1. **Configurar JWT_SECRET** no `.env`
2. **Executar migration** do banco de dados
3. **Instalar bcryptjs**: `pnpm install bcryptjs @types/bcryptjs`
4. **Testar login/registro** no frontend
5. **Adicionar investimentos** através da API
6. **Verificar gráficos de ações** carregando dados

## 🐛 Troubleshooting

### Erro: "bcryptjs is not installed"
```bash
pnpm install bcryptjs @types/bcryptjs
```

### Erro: "JWT_SECRET is not configured"
Adicione `JWT_SECRET` no arquivo `.env`

### Erro: "Database not available"
Verifique se:
1. MySQL está rodando
2. `DATABASE_URL` está configurada
3. Credenciais estão corretas

### Erro: "Table 'users' doesn't exist"
Execute a migration:
```bash
mysql -u usuario -p bolsinho < setup-database-auth.sql
```

## 📝 Notas

- O sistema suporta tanto OAuth quanto email/password
- Para email/password, o `openId` é gerado como `email_<email>`
- Senhas são armazenadas como hash (nunca em texto plano)
- Cookies são configurados automaticamente para desenvolvimento e produção
- O frontend redireciona automaticamente para login se não autenticado

