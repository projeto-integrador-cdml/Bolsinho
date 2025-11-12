-- Migration: Add password authentication fields
-- Make openId nullable and add passwordHash field

ALTER TABLE `users` 
  MODIFY COLUMN `openId` VARCHAR(64) NULL,
  ADD COLUMN `passwordHash` VARCHAR(255) NULL AFTER `email`,
  ADD UNIQUE KEY `unique_email` (`email`);

-- Update existing users if needed (optional)
-- This migration assumes openId can be nullable for email/password auth

