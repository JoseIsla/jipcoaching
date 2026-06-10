-- Add unique slug to announcements so changelog .md files can sync deterministically.
ALTER TABLE `announcements`
  ADD COLUMN `slug` VARCHAR(120) NULL,
  ADD UNIQUE INDEX `announcements_slug_key` (`slug`);