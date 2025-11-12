# 🏗️ Arquitetura do Bolsinho

Este documento descreve a arquitetura completa do **Bolsinho**, seu assistente financeiro pessoal inteligente.

## 📐 Visão Geral da Arquitetura

O Bolsinho é uma aplicação **full-stack** moderna que combina:
- **Frontend React** com TypeScript para interface do usuário
- **Backend Node.js** com Express e tRPC para API type-safe
- **Serviços Python** para IA, OCR e processamento de dados
- **MySQL** para armazenamento de dados
- **Cache** no banco de dados para otimização
- **Docker** para containerização e deploy

## 🎨 Diagrama da Arquitetura

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  React + TypeScript + Tailwind CSS + shadcn/ui          │  │
│  │  - Dashboard                                             │  │
│  │  - Chat Interface (AIChatBox)                            │  │
│  │  - Stock Charts (StockChart, StockCard)                  │  │
│  │  - Login/Authentication                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/HTTPS
                             │ tRPC (type-safe)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express Server + tRPC                                   │  │
│  │  - API Routes (routers.ts)                               │  │
│  │  - Context & Authentication                              │  │
│  │  - Session Management (JWT + Cookies)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│  ┌──────────────────────────┼──────────────────────────────┐  │
│  │  Python Bridge           │  Database Layer              │  │
│  │  - executePythonService  │  - Drizzle ORM               │  │
│  │  - Rate Limiting         │  - MySQL Connection          │  │
│  │  - Error Handling        │  - Cache Management          │  │
│  └──────────────────────────┼──────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│   Serviços Python         │  │   MySQL Database          │
│  ┌─────────────────────┐  │  │  ┌─────────────────────┐  │
│  │  Groq Service       │  │  │  │  users              │  │
│  │  - LLM (Llama 3.3)  │  │  │  │  investments        │  │
│  │  - Vision (Llama)   │  │  │  │  stockCache         │  │
│  └─────────────────────┘  │  │  │  transactions       │  │
│  ┌─────────────────────┐  │  │  │  categories         │  │
│  │  OCR Service        │  │  │  │  budgets            │  │
│  │  - Tesseract        │  │  │  │  goals              │  │
│  │  - PDF Processing   │  │  │  │  chatMessages       │  │
│  └─────────────────────┘  │  │  │  alerts             │  │
│  ┌─────────────────────┐  │  │  │  documents          │  │
│  │  News Service       │  │  │  └─────────────────────┘  │
│  │  - NewsAPI          │  │  └───────────────────────────┘
│  └─────────────────────┘  │
│  ┌─────────────────────┐  │
│  │  Stock Service      │  │
│  │  - yfinance         │  │
│  └─────────────────────┘  │
│  ┌─────────────────────┐  │
│  │  Calculator Service │  │
│  │  - Decimal Math     │  │
│  └─────────────────────┘  │
└───────────────────────────┘
                │
                ▼
┌───────────────────────────┐
│   APIs Externas           │
│  - Groq API (LLM)         │
│  - NewsAPI (Notícias)     │
│  - Yahoo Finance (Ações)  │
│  - Forge API (Storage)    │
└───────────────────────────┘
```

### Diagrama de Fluxo de Dados

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ 1. Envia mensagem (texto/imagem/áudio)
       ▼
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌───────────────────────────────────────────────────┐  │
│  │  AIChatBox Component                              │  │
│  │  - Valida input                                   │  │
│  │  - Upload de arquivos (se houver)                 │  │
│  │  - Envia para tRPC                                │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ 2. tRPC Request
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (Node.js)                       │
│  ┌───────────────────────────────────────────────────┐  │
│  │  routers.ts: chat.send                            │  │
│  │  - Recebe mensagem                                │  │
│  │  - Detecta tipo de requisição                     │  │
│  │    • Notícias? → News Service                     │  │
│  │    • Ações? → Stock Service                       │  │
│  │    • Cálculo? → Calculator Service                │  │
│  │    • Imagem? → OCR Service                        │  │
│  │    • Multimodal? → Groq Service                   │  │
│  └───────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     │ 3. Processa requisição
                     ▼
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌───────────────┐
│ Python Bridge │       │   Database    │
│ - Executa     │       │ - Cache       │
│   serviço     │       │ - Dados       │
│   Python      │       │   do usuário  │
└───────┬───────┘       └───────┬───────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌───────────────┐
│   Serviços    │       │   MySQL       │
│   Python      │       │   Database    │
│ - Groq        │       │               │
│ - OCR         │       │               │
│ - News        │       │               │
│ - Stock       │       │               │
│ - Calculator  │       │               │
└───────┬───────┘       └───────────────┘
        │
        ▼
┌───────────────┐
│  APIs Externas│
│ - Groq API    │
│ - NewsAPI     │
│ - Yahoo Finance│
└───────────────┘
```

## 🧩 Componentes Principais

### 1. Frontend (React + TypeScript)

**Localização:** `client/src/`

**Tecnologias:**
- React 19 com TypeScript
- Tailwind CSS 4 para estilização
- shadcn/ui para componentes
- Recharts para gráficos
- wouter para roteamento
- tRPC React Query para comunicação com backend

**Componentes Principais:**
- `App.tsx` - Componente raiz e roteamento
- `pages/Dashboard.tsx` - Dashboard principal
- `pages/Login.tsx` - Página de login
- `components/AIChatBox.tsx` - Interface de chat
- `components/StockChart.tsx` - Gráficos de ações
- `components/StockCard.tsx` - Cards de ações
- `components/StockGrid.tsx` - Grid de ações

**Fluxo de Dados:**
1. Usuário interage com componentes React
2. Componentes fazem chamadas tRPC para backend
3. tRPC garante type-safety end-to-end
4. Respostas são renderizadas nos componentes

### 2. Backend (Node.js + Express + tRPC)

**Localização:** `server/`

**Tecnologias:**
- Node.js com Express
- tRPC para API type-safe
- Drizzle ORM para banco de dados
- JWT para autenticação
- bcryptjs para hash de senhas

**Estrutura:**
```
server/
├── _core/
│   ├── index.ts          # Servidor Express principal
│   ├── trpc.ts           # Configuração do tRPC
│   ├── context.ts        # Context do tRPC (autenticação)
│   ├── auth.ts           # Autenticação (login/register)
│   ├── llm.ts            # Integração com LLM
│   ├── cookies.ts        # Gerenciamento de cookies
│   └── ...
├── routers.ts            # Rotas tRPC (API endpoints)
├── db.ts                 # Funções de banco de dados
├── python-bridge.ts      # Bridge para serviços Python
└── services/             # Serviços Python
```

**Rotas Principais:**
- `chat.send` - Envia mensagem para o chatbot
- `upload.file` - Upload de arquivos
- `stocks.*` - Endpoints de ações (info, history, variation)
- `auth.*` - Autenticação (login, register, logout, me)
- `dashboard.stats` - Estatísticas do dashboard
- `investments.*` - CRUD de investimentos

### 3. Python Bridge

**Localização:** `server/python-bridge.ts`

**Função:**
- Executa serviços Python a partir do Node.js
- Gerencia comunicação entre Node.js e Python
- Implementa rate limiting para APIs externas
- Trata erros e timeouts

**Serviços Python:**
- `groqService` - Integração com Groq API (LLM)
- `ocrService` - Processamento OCR (Tesseract)
- `newsService` - Busca de notícias (NewsAPI)
- `stockService` - Dados de ações (yfinance)
- `calculatorService` - Cálculos financeiros (Decimal)

**Fluxo:**
1. Node.js chama `executePythonService(serviceName, method, args)`
2. Python Bridge executa script Python via `spawn`
3. Python processa e retorna JSON
4. Node.js parseia resposta e retorna para o router

### 4. Serviços Python

**Localização:** `server/services/`

**Serviços Disponíveis:**

#### Groq Service (`groq_service.py`)
- **Função:** Integração com Groq API para LLM
- **Modelos:**
  - Llama 3.3 70B Versatile (texto)
  - Llama 3.2 90B Vision Preview (multimodal)
- **Métodos:**
  - `chat_completion` - Chat com texto
  - `financial_assistant_multimodal` - Chat multimodal
  - `analyze_image` - Análise de imagens
  - `extract_financial_data` - Extração de dados financeiros

#### OCR Service (`ocr_service.py`)
- **Função:** Extração de texto de imagens e PDFs
- **Tecnologias:**
  - Tesseract OCR para imagens
  - PyPDF2 e pdf2image para PDFs
- **Métodos:**
  - `extract_text` - Extração de texto de imagens
  - `extract_text_from_pdf` - Extração de texto de PDFs
  - `extract_boleto_data` - Extração de dados de boletos
  - `extract_receipt_data` - Extração de dados de recibos

#### News Service (`news_service.py`)
- **Função:** Busca de notícias financeiras
- **API:** NewsAPI
- **Métodos:**
  - `get_top_headlines` - Manchetes principais
  - `search_news` - Busca de notícias
  - `get_investment_news` - Notícias de investimento
  - `get_sector_news` - Notícias por setor
  - `get_market_indicators_news` - Notícias de indicadores

#### Stock Service (`stock_service.py`)
- **Função:** Busca de dados de ações
- **API:** Yahoo Finance (via yfinance)
- **Métodos:**
  - `get_stock_info` - Informações básicas da ação
  - `get_stock_history` - Histórico de preços
  - `get_stock_variation` - Variação de preços
  - `search_stocks` - Busca de ações

#### Calculator Service (`calculator_service.py`)
- **Função:** Cálculos financeiros precisos
- **Tecnologias:** Decimal para precisão
- **Métodos:**
  - `calculate_investment_distribution` - Distribuição de investimentos
  - `calculate_percentage` - Cálculo de percentuais
  - `calculate_compound_interest` - Juros compostos
  - `process_financial_question` - Processamento de questões financeiras

### 5. Banco de Dados (MySQL)

**Localização:** `drizzle/schema.ts`, `server/db.ts`

**Tecnologias:**
- MySQL 8.0
- Drizzle ORM para type-safe queries

**Tabelas Principais:**

#### `users`
- Armazena informações dos usuários
- Suporta autenticação por email/senha
- Campos: `id`, `email`, `passwordHash`, `name`, `role`, etc.

#### `investments`
- Armazena investimentos dos usuários
- Campos: `id`, `userId`, `ticker`, `quantity`, `averagePrice`, `totalInvested`, `currentValue`, etc.

#### `stockCache`
- Cache de dados de ações
- Campos: `id`, `ticker`, `currentPrice`, `change`, `changePercent`, `historyData`, `lastUpdated`, etc.
- **Vantagem:** Evita rate limiting e melhora performance

#### `transactions`
- Transações financeiras
- Campos: `id`, `userId`, `amount`, `description`, `type`, `date`, etc.

#### `categories`
- Categorias de gastos
- Campos: `id`, `name`, `type`, `icon`, `color`, etc.

#### Outras Tabelas
- `budgets` - Orçamentos
- `goals` - Metas financeiras
- `chatMessages` - Histórico de conversas
- `alerts` - Alertas e notificações
- `documents` - Documentos processados

### 6. Cache de Ações

**Localização:** `server/db.ts`, `drizzle/schema.ts`

**Função:**
- Armazena dados de ações no banco de dados
- Evita rate limiting do Yahoo Finance
- Melhora performance (dados do banco são mais rápidos)
- Funciona mesmo se API externa estiver indisponível

**Fluxo:**
1. Frontend solicita dados de ação
2. Backend verifica cache no banco
3. Se cache válido (< 15 min), retorna do cache
4. Se cache antigo ou não existe, busca da API
5. Salva no cache e retorna para frontend

## 🔄 Fluxo de Dados Detalhado

### Fluxo de Chat com Multimodal

```
1. Usuário envia mensagem com imagem
   │
   ▼
2. Frontend (AIChatBox)
   - Valida arquivo
   - Converte para base64
   - Chama upload.file mutation
   │
   ▼
3. Backend (upload.file)
   - Recebe base64
   - Faz upload para storage (ou usa data URL)
   - Retorna URL do arquivo
   │
   ▼
4. Frontend (AIChatBox)
   - Recebe URL
   - Chama chat.send com URL
   │
   ▼
5. Backend (chat.send)
   - Detecta tipo de conteúdo
   - Se for imagem, chama OCR Service
   - Se for PDF, extrai texto
   - Chama Groq Service (multimodal)
   │
   ▼
6. Python Bridge
   - Executa groq_service.py
   - Passa imagem e prompt
   │
   ▼
7. Groq Service
   - Chama Groq API
   - Processa imagem e texto
   - Retorna resposta
   │
   ▼
8. Backend (chat.send)
   - Recebe resposta
   - Salva no banco (opcional)
   - Retorna para frontend
   │
   ▼
9. Frontend (AIChatBox)
   - Exibe resposta no chat
```

### Fluxo de Dados de Ações

```
1. Frontend solicita dados de ação (PETR4)
   │
   ▼
2. Backend (stocks.info)
   - Verifica cache no banco
   - Se cache válido, retorna do cache
   - Se cache antigo, busca da API
   │
   ▼
3. Python Bridge
   - Executa stock_service.py
   - Com rate limiting (200ms entre requisições)
   │
   ▼
4. Stock Service
   - Chama yfinance
   - Normaliza ticker (PETR4 → PETR4.SA)
   - Busca dados históricos
   - Retorna JSON
   │
   ▼
5. Backend (stocks.info)
   - Recebe dados
   - Salva no cache (stockCache)
   - Retorna para frontend
   │
   ▼
6. Frontend (StockCard/StockChart)
   - Exibe dados no componente
```

### Fluxo de Autenticação

```
1. Usuário faz login
   │
   ▼
2. Frontend (Login.tsx)
   - Valida email/senha
   - Chama auth.login mutation
   │
   ▼
3. Backend (auth.login)
   - Busca usuário no banco
   - Verifica senha (bcrypt)
   - Cria sessão JWT
   - Define cookie HTTP-only
   │
   ▼
4. Frontend (Login.tsx)
   - Recebe resposta
   - Redireciona para /dashboard
   │
   ▼
5. Frontend (Dashboard.tsx)
   - Verifica autenticação (auth.me)
   - Se autenticado, exibe dashboard
   - Se não, redireciona para /login
```

## 🔐 Autenticação e Autorização

### Autenticação

- **Método:** Email/Senha com JWT
- **Hash:** bcryptjs (10 rounds)
- **Sessão:** JWT armazenado em cookie HTTP-only
- **Validade:** 1 ano

### Autorização

- **Middleware:** `requireUser` no tRPC
- **Procedures:**
  - `publicProcedure` - Acesso público
  - `protectedProcedure` - Requer autenticação
  - `adminProcedure` - Requer role admin

## 📊 Estrutura de Dados

### Mensagens do Chat

```typescript
type Message = {
  role: "user" | "assistant" | "system";
  content: string | Array<{
    type: "text" | "image_url" | "file_url";
    text?: string;
    image_url?: { url: string };
    file_url?: { url: string; mime_type: string };
  }>;
};
```

### Dados de Ações

```typescript
type StockInfo = {
  success: boolean;
  ticker: string;
  name: string;
  current_price: number;
  change: number;
  change_percent: number;
  volume: number;
  currency: string;
  market: string;
  sector?: string;
  industry?: string;
};
```

### Cache de Ações

```typescript
type StockCache = {
  id: number;
  ticker: string;
  normalizedTicker: string;
  name: string;
  currentPrice: number; // em centavos
  changePercent: number; // em centésimos (250 = 2.50%)
  historyData: string; // JSON
  lastUpdated: Date;
};
```

## 🚀 Deploy e Infraestrutura

### Docker

**Arquivos:**
- `Dockerfile` - Imagem da aplicação
- `docker-compose.yml` - Orquestração de serviços

**Serviços:**
- `app` - Aplicação Node.js
- `db` - MySQL 8.0
- `redis` - Cache (opcional)
- `nginx` - Reverse proxy (opcional)

### Variáveis de Ambiente

```env
# Banco de Dados
DATABASE_URL=mysql://user:password@localhost:3306/bolsinho

# APIs
GROQ_API_KEY=...
NEWS_API_KEY=...
JWT_SECRET=...

# Storage (opcional)
BUILT_IN_FORGE_API_URL=...
BUILT_IN_FORGE_API_KEY=...
```

## 🔧 Tecnologias Utilizadas

### Frontend
- **React** 19 - Framework UI
- **TypeScript** - Type safety
- **Tailwind CSS** 4 - Estilização
- **shadcn/ui** - Componentes
- **Recharts** - Gráficos
- **wouter** - Roteamento
- **tRPC** - API type-safe
- **React Query** - Cache e estado

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **tRPC** - API type-safe
- **Drizzle ORM** - ORM type-safe
- **bcryptjs** - Hash de senhas
- **JWT** - Autenticação
- **superjson** - Serialização

### Python
- **Python** 3.11 - Runtime
- **yfinance** - Dados de ações
- **Tesseract OCR** - OCR
- **PyPDF2** - Processamento de PDFs
- **pdf2image** - Conversão de PDFs
- **pandas** - Manipulação de dados
- **groq** - Cliente Groq API
- **newsapi-python** - Cliente NewsAPI
- **decimal** - Cálculos precisos

### Banco de Dados
- **MySQL** 8.0 - Banco de dados
- **Drizzle ORM** - ORM type-safe

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Reverse proxy (opcional)
- **Redis** - Cache (opcional)

## 📈 Escalabilidade

### Otimizações Implementadas

1. **Cache de Ações**
   - Dados em cache no banco
   - Reduz chamadas à API externa
   - Melhora performance

2. **Rate Limiting**
   - Delays entre requisições (200ms)
   - Evita bloqueios de API
   - Retry automático

3. **Lazy Loading**
   - Banco de dados inicializado sob demanda
   - Serviços Python executados apenas quando necessário

4. **Type Safety**
   - tRPC garante type-safety end-to-end
   - Reduz erros em runtime
   - Melhora experiência de desenvolvimento

### Possíveis Melhorias

1. **Redis Cache**
   - Cache em memória para dados frequentes
   - Reduz carga no banco de dados

2. **CDN**
   - Serve assets estáticos
   - Reduz latência

3. **Load Balancer**
   - Distribui carga entre instâncias
   - Melhora disponibilidade

4. **Queue System**
   - Processa tarefas assíncronas
   - Melhora responsividade

## 🔒 Segurança

### Medidas Implementadas

1. **Autenticação**
   - JWT em cookie HTTP-only
   - Senhas hasheadas com bcrypt
   - Validação de entrada

2. **Autorização**
   - Middleware de autenticação
   - Verificação de permissões
   - Proteção de rotas

3. **Validação**
   - Validação de entrada com Zod
   - Sanitização de dados
   - Prevenção de SQL injection (Drizzle ORM)

4. **Segurança de Arquivos**
   - Validação de tipo de arquivo
   - Limite de tamanho (50MB)
   - Upload seguro

## 📝 Conclusão

O Bolsinho é uma aplicação moderna e escalável que combina:
- **Frontend React** para interface rica e interativa
- **Backend Node.js** para API type-safe e performática
- **Serviços Python** para IA e processamento de dados
- **MySQL** para armazenamento confiável
- **Cache** para otimização e performance

A arquitetura é modular, permitindo fácil manutenção e extensão.

## 🔗 Links Relacionados

- [Documentação da API](API.md)
- [Guia de Setup](setup/INICIO_RAPIDO.md)
- [Guia de Deploy](deployment/DEPLOY.md)
- [README Principal](../README.md)

