# ⚡ Setup Rápido: Cache de Ações

## 🚀 Passo a Passo

### 1. Criar a Tabela no Banco

**Se você está usando Docker:**

```bash
# Conectar ao MySQL
docker exec -it bolsinho-db mysql -ubolsinho -pbolsinho_password bolsinho

# Criar a tabela (cole o SQL abaixo)
```

**SQL para criar a tabela:**

```sql
CREATE TABLE IF NOT EXISTS `stockCache` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticker` VARCHAR(20) NOT NULL UNIQUE,
  `normalizedTicker` VARCHAR(50) NULL,
  `name` VARCHAR(200) NULL,
  `currentPrice` INT NULL COMMENT 'Preço em centavos',
  `previousClose` INT NULL COMMENT 'Preço anterior em centavos',
  `change` INT NULL COMMENT 'Variação em centavos',
  `changePercent` INT NULL COMMENT 'Variação percentual (ex: 250 = 2.50%)',
  `dayHigh` INT NULL COMMENT 'Máxima do dia em centavos',
  `dayLow` INT NULL COMMENT 'Mínima do dia em centavos',
  `volume` INT NULL COMMENT 'Volume de negociação',
  `currency` VARCHAR(10) DEFAULT 'BRL',
  `market` VARCHAR(50) NULL,
  `sector` VARCHAR(100) NULL,
  `industry` VARCHAR(200) NULL,
  `marketCap` INT NULL COMMENT 'Market cap em centavos',
  `historyData` TEXT NULL COMMENT 'JSON com histórico de preços',
  `lastUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticker` (`ticker`),
  INDEX `idx_lastUpdated` (`lastUpdated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Popular Dados Iniciais

**Opção A: Usando o script (Recomendado)**

```bash
pnpm populate-stocks
```

**Opção B: Usando a API (depois que o servidor estiver rodando)**

```bash
# Aguarde o servidor iniciar, depois execute:
curl -X POST http://localhost:3000/api/trpc/stocks.updateCache
```

### 3. Verificar se Funcionou

```sql
-- Ver dados no cache
SELECT ticker, name, currentPrice, lastUpdated FROM stockCache;
```

### 4. Testar no Frontend

1. Acesse a aba "Ações" no dashboard
2. Os dados devem aparecer instantaneamente (do cache)
3. Se não aparecer, verifique os logs do servidor

## ✅ Pronto!

Agora o sistema:
- ✅ Busca dados do cache primeiro
- ✅ Atualiza automaticamente se cache > 15 min
- ✅ Funciona mesmo se a API estiver indisponível
- ✅ Muito mais rápido que buscar da API toda vez

## 🔄 Atualização Periódica

Para manter os dados atualizados, você pode:

1. **Cron Job** (Linux/Mac):
```bash
# Adicionar ao crontab
*/15 * * * * curl -X POST http://localhost:3000/api/trpc/stocks.updateCache
```

2. **Agendador de Tarefas** (Windows):
- Criar uma tarefa agendada que executa o script a cada 15 minutos

3. **Manual**:
- Usar o endpoint `stocks.updateCache` quando necessário

