-- Script para criar a tabela stockCache
-- Execute este SQL no MySQL

USE bolsinho;

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
  `marketCap` VARCHAR(50) NULL COMMENT 'Market cap (string para valores grandes)',
  `historyData` TEXT NULL COMMENT 'JSON com histórico de preços',
  `lastUpdated` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_ticker` (`ticker`),
  INDEX `idx_lastUpdated` (`lastUpdated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'Tabela stockCache criada com sucesso!' AS Status;

