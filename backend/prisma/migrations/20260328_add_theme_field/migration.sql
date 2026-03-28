-- Add theme column to admin_profiles
ALTER TABLE `admin_profiles` ADD COLUMN `theme` VARCHAR(10) NOT NULL DEFAULT 'dark';

-- Add theme column to clients
ALTER TABLE `clients` ADD COLUMN `theme` VARCHAR(10) NOT NULL DEFAULT 'dark';
