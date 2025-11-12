# Backend do Bolsinho - Guia de Configuração

## Pré-requisitos

1. **Node.js** (v18 ou superior)
2. **MySQL** (8.0 ou superior)
3. **Python** (3.11 ou superior)
4. **pnpm** (gerenciador de pacotes)

## Configuração do Banco de Dados

### 1. Criar Banco de Dados

```sql
CREATE DATABASE bolsinho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Executar Migrations

Execute o script SQL para adicionar campos de autenticação:

```bash
mysql -u seu_usuario -p bolsinho < setup-database-auth.sql
```

Ou execute manualmente as migrations do Drizzle:

```bash
# Se usar Drizzle Kit
npx drizzle-kit push
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL=mysql://usuario:senha@localhost:3306/bolsinho

# JWT Secret (gere uma chave secreta aleatória)
JWT_SECRET=sua_chave_secreta_aqui_muito_segura

# Groq API (opcional - para usar modelos Groq)
GROQ_API_KEY=sua_chave_groq_aqui

# News API (opcional - para notícias financeiras)
NEWS_API_KEY=sua_chave_news_api_aqui

# Forge API (opcional - fallback para LLM)
BUILT_IN_FORGE_API_URL=https://api.forge.ai
BUILT_IN_FORGE_API_KEY=sua_chave_forge_aqui
```

### 4. Instalar Dependências

```bash
# Instalar dependências Node.js
pnpm install

# Instalar dependências Python
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

## Endpoints da API

### Autenticação

- `POST /api/trpc/auth.register` - Registrar novo usuário
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123",
    "name": "Nome do Usuário"
  }
  ```

- `POST /api/trpc/auth.login` - Fazer login
  ```json
  {
    "email": "usuario@email.com",
    "password": "senha123"
  }
  ```

- `GET /api/trpc/auth.me` - Obter usuário atual
- `POST /api/trpc/auth.logout` - Fazer logout

### Dashboard

- `GET /api/trpc/dashboard.stats` - Obter estatísticas do dashboard
  ```json
  {
    "portfolioTotal": 0,
    "monthlyReturn": 0,
    "monitoredStocks": 6,
    "investmentsCount": 0
  }
  ```

### Investimentos

- `GET /api/trpc/investments.list` - Listar investimentos do usuário
- `POST /api/trpc/investments.create` - Criar novo investimento
- `POST /api/trpc/investments.update` - Atualizar investimento
- `POST /api/trpc/investments.delete` - Deletar investimento

### Ações (Stocks)

- `GET /api/trpc/stocks.info?ticker=PETR4` - Informações da ação
- `GET /api/trpc/stocks.history?ticker=PETR4&period=1mo` - Histórico da ação
- `GET /api/trpc/stocks.variation?ticker=PETR4&period=1mo` - Variação da ação
- `GET /api/trpc/stocks.search?query=petrobras` - Buscar ações

### Chat

- `POST /api/trpc/chat.send` - Enviar mensagem para o bot
  ```json
  {
    "message": "Quais são as notícias financeiras de hoje?",
    "images": [],
    "audio": null,
    "pdfs": [],
    "conversationHistory": []
  }
  ```

### Upload

- `POST /api/trpc/upload.file` - Upload de arquivo (imagem, áudio, PDF)
  ```json
  {
    "file": "base64_encoded_file",
    "filename": "arquivo.pdf",
    "mimeType": "application/pdf"
  }
  ```

## Executar o Servidor

### Desenvolvimento

```bash
# Instalar dependências
pnpm install

# Executar servidor
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

### Produção

```bash
# Build
pnpm build

# Executar
pnpm start
```

## Estrutura do Banco de Dados

### Tabela `users`
- `id` - ID único do usuário
- `openId` - ID OAuth (nullable para email/password)
- `email` - Email único do usuário
- `passwordHash` - Hash da senha (bcrypt)
- `name` - Nome do usuário
- `loginMethod` - Método de login (email, google, etc.)
- `role` - Role do usuário (user, admin)

### Tabela `investments`
- `id` - ID único do investimento
- `userId` - ID do usuário
- `ticker` - Código da ação (ex: PETR4)
- `quantity` - Quantidade de ações
- `averagePrice` - Preço médio (em centavos)
- `totalInvested` - Total investido (em centavos)
- `currentValue` - Valor atual (em centavos)
- `currency` - Moeda (BRL, USD)
- `notes` - Notas adicionais

## Autenticação

O sistema usa **JWT (JSON Web Tokens)** para autenticação:
- Tokens são armazenados em cookies HTTP-only
- Sessões duram 1 ano
- Senhas são hasheadas com bcrypt (10 rounds)

## Segurança

- Senhas são hasheadas com bcrypt antes de serem armazenadas
- Cookies são HTTP-only e seguros em produção
- Validação de entrada com Zod
- Proteção contra SQL injection (usando Drizzle ORM)
- Validação de tipos TypeScript

## Troubleshooting

### Erro: "bcryptjs is not installed"
```bash
npm install bcryptjs @types/bcryptjs
```

### Erro: "Database not available"
Verifique se:
1. MySQL está rodando
2. `DATABASE_URL` está configurada no `.env`
3. As credenciais estão corretas

### Erro: "JWT_SECRET is not configured"
Adicione `JWT_SECRET` no arquivo `.env`:
```env
JWT_SECRET=sua_chave_secreta_aqui
```

### Erro: "Table 'users' doesn't exist"
Execute as migrations:
```bash
mysql -u usuario -p bolsinho < setup-database-auth.sql
```

## Próximos Passos

1. Configurar variáveis de ambiente
2. Executar migrations do banco
3. Instalar dependências (Node.js e Python)
4. Executar servidor de desenvolvimento
5. Testar endpoints com o frontend

