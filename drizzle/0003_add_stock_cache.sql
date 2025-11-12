-- Migration: Add stock cache table
-- Created: 2025-01-XX

CREATE TABLE IF NOT EXISTS `stockCache` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ticker` VARCHAR(20) NOT NULL UNIQUE,
  `normalizedTicker` VARCHAR(50),
  `name` VARCHAR(200),
  `currentPrice` INT, -- Preço em centavos
  `previousClose` INT, -- Preço anterior em centavos
  `change` INT, -- Variação em centavos
  `changePercent` INT, -- Variação percentual (ex: 250 = 2.50%)
  `dayHigh` INT, -- Máxima do dia em centavos
  `dayLow` INT, -- Mínima do dia em centavos
  `volume` INT, -- Volume de negociação
  `currency` VARCHAR(10) DEFAULT 'BRL',
  `market` VARCHAR(50),
  `sector` VARCHAR(100),
  `industry` VARCHAR(200),
  `marketCap` INT, -- Market cap em centavos
  `historyData` TEXT, -- JSON com histórico de preços
  `lastUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticker` (`ticker`),
  INDEX `idx_lastUpdated` (`lastUpdated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

