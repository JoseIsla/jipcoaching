-- Allow athletes to register accessory (and any) exercise weights per-set or as a single load.
ALTER TABLE `checkin_training_exercises`
  ADD COLUMN `weightMode` VARCHAR(20) NULL,
  ADD COLUMN `perSetWeights` VARCHAR(200) NULL;