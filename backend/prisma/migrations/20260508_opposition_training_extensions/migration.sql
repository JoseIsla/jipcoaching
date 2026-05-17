-- ════════════════════════════════════════════════════════════════════
-- Opposition training extensions
-- Adds running / running technique / official-test support to plans,
-- prescriptions, exercise logs and check-in training exercises.
-- All columns are additive and nullable → safe with existing rows.
-- ════════════════════════════════════════════════════════════════════

-- 1. Exercise library: new kind (gym/running/running_technique/official_test)
--    and oppositionTypes (JSON array string) to filter by oposición
ALTER TABLE `exercises`
  ADD COLUMN `kind` VARCHAR(30) NULL,
  ADD COLUMN `oppositionTypes` TEXT NULL,
  ADD COLUMN `defaultUnit` VARCHAR(20) NULL;

-- 2. ExercisePrescription: sectionExt (running/running_technique/official_test)
--    + planned metrics for running and official tests
ALTER TABLE `exercise_prescriptions`
  ADD COLUMN `sectionExt` VARCHAR(30) NULL,
  ADD COLUMN `plannedDistanceM` DOUBLE NULL,
  ADD COLUMN `plannedDurationSec` INT NULL,
  ADD COLUMN `plannedPace` VARCHAR(20) NULL,
  ADD COLUMN `plannedHeartRate` INT NULL,
  ADD COLUMN `plannedMarkValue` DOUBLE NULL,
  ADD COLUMN `plannedMarkUnit` VARCHAR(20) NULL;

-- 3. ExerciseLog: actual metrics for running and official tests
ALTER TABLE `exercise_logs`
  ADD COLUMN `distanceMeters` DOUBLE NULL,
  ADD COLUMN `durationSeconds` INT NULL,
  ADD COLUMN `pace` VARCHAR(20) NULL,
  ADD COLUMN `heartRateAvg` INT NULL,
  ADD COLUMN `markValue` DOUBLE NULL,
  ADD COLUMN `markUnit` VARCHAR(20) NULL,
  ADD COLUMN `scoreObtained` INT NULL;

-- 4. CheckinTrainingExercise: widen section + actual metrics + score
ALTER TABLE `checkin_training_exercises`
  MODIFY COLUMN `section` VARCHAR(30) NOT NULL DEFAULT 'basic',
  ADD COLUMN `actualDistanceM` DOUBLE NULL,
  ADD COLUMN `actualDurationSec` INT NULL,
  ADD COLUMN `actualPace` VARCHAR(20) NULL,
  ADD COLUMN `actualHeartRate` INT NULL,
  ADD COLUMN `actualMarkValue` DOUBLE NULL,
  ADD COLUMN `actualMarkUnit` VARCHAR(20) NULL,
  ADD COLUMN `scoreObtained` INT NULL;