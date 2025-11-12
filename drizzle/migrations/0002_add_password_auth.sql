-- Migration: Add password authentication fields
ALTER TABLE `users` 
  MODIFY COLUMN `openId` VARCHAR(64) NULL,
  ADD COLUMN `passwordHash` VARCHAR(255) NULL AFTER `email`,
  ADD UNIQUE KEY `unique_email` (`email`);

