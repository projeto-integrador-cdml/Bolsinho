-- Script para adicionar autenticação por email/senha ao banco de dados
-- Execute este script no seu banco MySQL

-- Tornar openId nullable (para permitir autenticação por email)
ALTER TABLE `users` 
  MODIFY COLUMN `openId` VARCHAR(64) NULL;

-- Adicionar campo passwordHash
ALTER TABLE `users` 
  ADD COLUMN `passwordHash` VARCHAR(255) NULL AFTER `email`;

-- Garantir que email é único
ALTER TABLE `users` 
  ADD UNIQUE KEY `unique_email` (`email`);

-- Adicionar tabela de investimentos se não existir
CREATE TABLE IF NOT EXISTS `investments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `ticker` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200),
  `quantity` INT NOT NULL DEFAULT 0,
  `averagePrice` INT NOT NULL,
  `totalInvested` INT NOT NULL DEFAULT 0,
  `currentValue` INT DEFAULT 0,
  `currency` VARCHAR(10) DEFAULT 'BRL',
  `notes` TEXT,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_ticker` (`ticker`)
);

