-- Allow athletes to log accessory & main lift weights per-session (mode + per-set CSV)
ALTER TABLE `exercise_logs`
  ADD COLUMN `weightMode` VARCHAR(20) NULL,
  ADD COLUMN `perSetWeights` VARCHAR(200) NULL,
  ADD COLUMN `loggedAt` DATETIME NULL;