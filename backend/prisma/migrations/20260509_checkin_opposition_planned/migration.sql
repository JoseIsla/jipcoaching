-- Add planned metrics to checkin training exercises so the admin review
-- can show "Objetivo vs Obtenido" for opposition (running / official_test) rows.
ALTER TABLE `checkin_training_exercises`
  ADD COLUMN `sectionExt` VARCHAR(30) NULL,
  ADD COLUMN `plannedDistanceM` DOUBLE NULL,
  ADD COLUMN `plannedDurationSec` INT NULL,
  ADD COLUMN `plannedPace` VARCHAR(20) NULL,
  ADD COLUMN `plannedHeartRate` INT NULL,
  ADD COLUMN `plannedMarkValue` DOUBLE NULL,
  ADD COLUMN `plannedMarkUnit` VARCHAR(20) NULL;