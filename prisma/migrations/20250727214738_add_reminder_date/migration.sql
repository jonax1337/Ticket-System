-- CreateTable
-- Add reminderDate column to tickets table
ALTER TABLE `tickets` ADD COLUMN `reminderDate` DATETIME(3) NULL;