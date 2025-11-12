# 🚀 Guia: Sistema de Cache de Ações

## 📋 Visão Geral

O sistema agora usa um cache no banco de dados MySQL para armazenar dados de ações, evitando:
- ✅ Rate limiting do Yahoo Finance
- ✅ Dependência da API externa
- ✅ Lentidão nas requisições
- ✅ Erros de "dados não disponíveis"

## 🗄️ Estrutura

### Tabela `stockCache`

A tabela armazena:
- Informações básicas da ação (preço, variação, volume)
- Histórico de preços (JSON)
- Metadata (setor, mercado, etc.)
- Timestamp de última atualização

### Como Funciona

1. **Primeira Requisição**: Busca da API do Yahoo Finance e salva no cache
2. **Requisições Subsequentes**: Retorna do cache (válido por 15 minutos)
3. **Cache Antigo**: Se cache > 15 min, busca da API e atualiza
4. **API Falhou**: Retorna cache antigo mesmo assim (melhor que nada)

## 🛠️ Setup

### 1. Criar a Tabela no Banco

**Opção A: Usando Docker (Recomendado)**

```bash
# Se o container já existe, execute o SQL manualmente
docker exec -i bolsinho-db mysql -ubolsinho -pbolsinho_password bolsinho < drizzle/0003_add_stock_cache.sql
```

**Opção B: Manualmente**

```sql
-- Execute o SQL em drizzle/0003_add_stock_cache.sql
-- Ou copie o conteúdo de docker/mysql/init.sql (tabela stockCache)
```

### 2. Popular Dados Iniciais

Execute o script para popular o cache com dados das principais ações:

```bash
pnpm populate-stocks
```

Ou use o endpoint da API:

```bash
# Atualizar todas as ações populares
curl -X POST http://localhost:3000/api/trpc/stocks.updateCache

# Atualizar uma ação específica
curl -X POST http://localhost:3000/api/trpc/stocks.updateCache \
  -H "Content-Type: application/json" \
  -d '{"ticker": "PETR4"}'
```

## 📊 Endpoints

### `stocks.info`
- Busca do cache primeiro
- Se cache válido (< 15 min), retorna do cache
- Se cache antigo ou não existe, busca da API
- Se API falhar, retorna cache antigo

### `stocks.history`
- Similar ao `info`, mas para histórico
- Histórico é armazenado como JSON no campo `historyData`

### `stocks.updateCache`
- Endpoint para atualizar cache manualmente
- Pode atualizar todas as ações ou uma específica
- Útil para cron jobs ou atualizações periódicas

## 🔄 Atualização Automática

### Opção 1: Cron Job no Servidor

```bash
# Adicionar ao crontab (atualiza a cada 15 minutos)
*/15 * * * * curl -X POST http://localhost:3000/api/trpc/stocks.updateCache
```

### Opção 2: Script Node.js

```javascript
// scripts/update-stock-cache.js
import { stockService } from "./server/python-bridge";
import * as db from "./server/db";

async function updateCache() {
  const tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3"];
  
  for (const ticker of tickers) {
    const info = await stockService.getStockInfo(ticker);
    const history = await stockService.getStockHistory(ticker, "1mo", "1d");
    
    if (info?.success) {
      await db.upsertStockCache({
        ticker: info.ticker,
        // ... outros campos
        historyData: history?.success ? JSON.stringify(history) : null,
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

updateCache();
```

## 🐛 Troubleshooting

### Tabela não existe

```sql
-- Verificar se a tabela existe
SHOW TABLES LIKE 'stockCache';

-- Se não existir, criar manualmente
-- Execute o SQL de drizzle/0003_add_stock_cache.sql
```

### Cache não está sendo usado

1. Verificar logs do servidor: `[Stocks] Retornando X do cache`
2. Verificar se a tabela existe: `SHOW TABLES;`
3. Verificar dados no cache: `SELECT * FROM stockCache;`

### Dados desatualizados

- Cache é válido por 15 minutos
- Para forçar atualização, use `stocks.updateCache`
- Ou aguarde 15 minutos para atualização automática

## 📝 Notas

- Cache válido por **15 minutos**
- Se API falhar, retorna cache antigo (melhor que nada)
- Histórico é armazenado como JSON string
- Preços são armazenados em **centavos** (inteiro)
- Percentuais são armazenados como **inteiros** (250 = 2.50%)

## 🎯 Próximos Passos

1. ✅ Criar tabela `stockCache`
2. ✅ Popular dados iniciais
3. ✅ Configurar atualização automática (cron job)
4. ⏳ Monitorar uso do cache
5. ⏳ Ajustar tempo de expiração se necessário

