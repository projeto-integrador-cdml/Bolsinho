-- =====================================================
-- Script Completo para Criar Banco de Dados do Bolsinho
-- =====================================================
-- Execute este script como root do MySQL:
-- mysql -u root -p < setup-database-completo.sql
-- =====================================================

-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS bolsinho CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Usar o banco de dados
USE bolsinho;

-- =====================================================
-- TABELA: users
-- =====================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `openId` VARCHAR(64) NULL UNIQUE,
  `name` TEXT NULL,
  `email` VARCHAR(320) NULL UNIQUE,
  `passwordHash` VARCHAR(255) NULL,
  `loginMethod` VARCHAR(64) NULL,
  `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`),
  INDEX `idx_openId` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: categories
-- =====================================================
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `type` ENUM('expense', 'income') NOT NULL DEFAULT 'expense',
  `icon` VARCHAR(50) NULL,
  `color` VARCHAR(20) NULL,
  `userId` INT NULL,
  `isDefault` INT NOT NULL DEFAULT 0,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `categoryId` INT NULL,
  `amount` INT NOT NULL COMMENT 'Valor em centavos',
  `description` TEXT NOT NULL,
  `type` ENUM('expense', 'income') NOT NULL,
  `date` TIMESTAMP NOT NULL,
  `documentUrl` VARCHAR(500) NULL,
  `documentType` ENUM('recibo', 'nota_fiscal', 'extrato', 'boleto') NULL,
  `extractedData` TEXT NULL,
  `notes` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_categoryId` (`categoryId`),
  INDEX `idx_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: budgets
-- =====================================================
CREATE TABLE IF NOT EXISTS `budgets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `categoryId` INT NULL,
  `amount` INT NOT NULL COMMENT 'Valor em centavos',
  `period` ENUM('monthly', 'weekly', 'yearly') NOT NULL DEFAULT 'monthly',
  `startDate` TIMESTAMP NOT NULL,
  `endDate` TIMESTAMP NULL,
  `alertThreshold` INT DEFAULT 80,
  `isActive` INT NOT NULL DEFAULT 1,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: goals
-- =====================================================
CREATE TABLE IF NOT EXISTS `goals` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NULL,
  `targetAmount` INT NOT NULL COMMENT 'Valor em centavos',
  `currentAmount` INT NOT NULL DEFAULT 0 COMMENT 'Valor em centavos',
  `deadline` TIMESTAMP NULL,
  `priority` ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  `status` ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: chatMessages
-- =====================================================
CREATE TABLE IF NOT EXISTS `chatMessages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` TEXT NOT NULL,
  `imageUrl` VARCHAR(500) NULL,
  `metadata` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: alerts
-- =====================================================
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `type` ENUM('budget_exceeded', 'goal_milestone', 'unusual_spending', 'bill_reminder') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `message` TEXT NOT NULL,
  `severity` ENUM('info', 'warning', 'critical') NOT NULL DEFAULT 'info',
  `isRead` INT NOT NULL DEFAULT 0,
  `relatedEntityId` INT NULL,
  `relatedEntityType` VARCHAR(50) NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_isRead` (`isRead`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: documents
-- =====================================================
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `transactionId` INT NULL,
  `fileUrl` VARCHAR(500) NOT NULL,
  `fileKey` VARCHAR(500) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `fileType` VARCHAR(50) NOT NULL,
  `fileSize` INT NOT NULL,
  `documentType` ENUM('recibo', 'nota_fiscal', 'extrato', 'boleto', 'outro') NOT NULL,
  `ocrText` TEXT NULL,
  `extractedData` TEXT NULL,
  `processingStatus` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `errorMessage` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`transactionId`) REFERENCES `transactions`(`id`) ON DELETE SET NULL,
  INDEX `idx_userId` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABELA: investments
-- =====================================================
CREATE TABLE IF NOT EXISTS `investments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `ticker` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NULL,
  `quantity` INT NOT NULL DEFAULT 0,
  `averagePrice` INT NOT NULL COMMENT 'Preço médio em centavos',
  `totalInvested` INT NOT NULL DEFAULT 0 COMMENT 'Total investido em centavos',
  `currentValue` INT DEFAULT 0 COMMENT 'Valor atual em centavos',
  `currency` VARCHAR(10) DEFAULT 'BRL',
  `notes` TEXT NULL,
  `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_ticker` (`ticker`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONFIRMAÇÃO
-- =====================================================
SELECT 'Banco de dados bolsinho criado com sucesso!' AS Status;
SELECT 'Tabelas criadas:' AS Info;
SHOW TABLES;

