-- Add OppositionType enum
ALTER TABLE `training_intakes` ADD COLUMN `oppositionType` VARCHAR(30) NULL;
ALTER TABLE `training_intakes` ADD COLUMN `examDate` DATETIME(3) NULL;
ALTER TABLE `training_intakes` ADD COLUMN `currentMarks` TEXT NULL;

-- Create PhysicalTestScale table
CREATE TABLE `physical_test_scales` (
    `id` VARCHAR(191) NOT NULL,
    `oppositionType` ENUM('POLICIA_NACIONAL', 'POLICIA_LOCAL', 'BOMBEROS', 'TROPA_MARINERIA') NOT NULL,
    `testName` VARCHAR(100) NOT NULL,
    `gender` VARCHAR(10) NOT NULL,
    `minValue` DOUBLE NOT NULL,
    `maxValue` DOUBLE NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `score` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create ClientPhysicalMark table
CREATE TABLE `client_physical_marks` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `testName` VARCHAR(100) NOT NULL,
    `value` DOUBLE NOT NULL,
    `unit` VARCHAR(20) NOT NULL,
    `recordedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` TEXT NULL,
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `client_physical_marks` ADD CONSTRAINT `client_physical_marks_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;