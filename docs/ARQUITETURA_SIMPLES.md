# 🏗️ Arquitetura do Bolsinho - Visão Simplificada

Este documento apresenta uma visão simplificada da arquitetura do Bolsinho.

## 🎯 Visão Geral

O Bolsinho é uma aplicação **full-stack** que combina:
- **Frontend React** para interface do usuário
- **Backend Node.js** para API e lógica de negócio
- **Serviços Python** para IA e processamento de dados
- **MySQL** para armazenamento de dados
- **Cache** para otimização

## 📐 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE APRESENTAÇÃO                │
│  React + TypeScript + Tailwind CSS + shadcn/ui          │
│  - Dashboard, Chat, Gráficos, Login                     │
└────────────────────┬────────────────────────────────────┘
                     │ tRPC (type-safe)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                    CAMADA DE APLICAÇÃO                   │
│  Node.js + Express + tRPC                               │
│  - Rotas, Autenticação, Validação, Lógica de Negócio   │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐       ┌───────────────┐
│ Python Bridge │       │   Database    │
│ - Executa     │       │ - MySQL       │
│   serviços    │       │ - Cache       │
│   Python      │       │ - Dados       │
└───────┬───────┘       └───────────────┘
        │
        ▼
┌───────────────┐
│   Serviços    │
│   Python      │
│ - Groq (IA)   │
│ - OCR         │
│ - News        │
│ - Stock       │
│ - Calculator  │
└───────┬───────┘
        │
        ▼
┌───────────────┐
│  APIs Externas│
│ - Groq API    │
│ - NewsAPI     │
│ - Yahoo Finance│
└───────────────┘
```

## 🔄 Fluxo de Dados Simples

### 1. Usuário envia mensagem
```
Usuário → Frontend → Backend → Python Bridge → Groq Service → Groq API
                                                                   ↓
Usuário ← Frontend ← Backend ← Python Bridge ← Groq Service ← Resposta
```

### 2. Usuário solicita dados de ação
```
Usuário → Frontend → Backend → Database (Cache)
                              ↓ (se necessário)
                          Python Bridge → Stock Service → Yahoo Finance
                                                                   ↓
Usuário ← Frontend ← Backend ← Database (Cache) ← Python Bridge ← Resposta
```

### 3. Usuário faz login
```
Usuário → Frontend → Backend → Database → Verifica senha → Cria sessão → Frontend
```

## 🧩 Componentes Principais

### Frontend
- **React** - Interface do usuário
- **tRPC** - Comunicação type-safe com backend
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes

### Backend
- **Express** - Servidor web
- **tRPC** - API type-safe
- **Drizzle ORM** - Acesso ao banco de dados
- **Python Bridge** - Comunicação com serviços Python

### Serviços Python
- **Groq Service** - IA e chat
- **OCR Service** - Extração de texto
- **News Service** - Notícias financeiras
- **Stock Service** - Dados de ações
- **Calculator Service** - Cálculos financeiros

### Banco de Dados
- **MySQL** - Armazenamento de dados
- **Cache** - Dados de ações em cache

## 🔐 Segurança

1. **Autenticação** - JWT em cookie HTTP-only
2. **Autorização** - Middleware de autenticação
3. **Validação** - Validação de entrada com Zod
4. **Hash** - Senhas hasheadas com bcrypt

## 🚀 Performance

1. **Cache** - Dados de ações em cache no banco
2. **Rate Limiting** - Delays entre requisições
3. **Lazy Loading** - Banco inicializado sob demanda
4. **Type Safety** - tRPC garante type-safety

## 📊 Tecnologias

### Frontend
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Recharts
- tRPC

### Backend
- Node.js
- Express
- tRPC
- Drizzle ORM
- MySQL

### Python
- Python 3.11
- Groq API
- Tesseract OCR
- yfinance
- NewsAPI
- pandas
- decimal

## 🔗 Links

- [Arquitetura Detalhada](ARQUITETURA.md)
- [Diagramas de Arquitetura](ARQUITETURA_DIAGRAMA.md)
- [Documentação da API](API.md)
- [README Principal](../README.md)

