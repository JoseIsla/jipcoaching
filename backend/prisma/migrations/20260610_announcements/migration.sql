-- Announcements modal for client panel (release notes).

CREATE TABLE `announcements` (
  `id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `body` TEXT NOT NULL,
  `bullets` JSON NULL,
  `audience` ENUM('NUTRITION', 'TRAINING', 'ALL') NOT NULL DEFAULT 'ALL',
  `version` VARCHAR(40) NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `publishedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `announcements_active_publishedAt_idx` (`active`, `publishedAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `announcement_reads` (
  `id` VARCHAR(191) NOT NULL,
  `announcementId` VARCHAR(191) NOT NULL,
  `clientId` VARCHAR(191) NOT NULL,
  `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `announcement_reads_announcementId_clientId_key` (`announcementId`, `clientId`),
  INDEX `announcement_reads_clientId_idx` (`clientId`),
  CONSTRAINT `announcement_reads_announcementId_fkey`
    FOREIGN KEY (`announcementId`) REFERENCES `announcements`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;