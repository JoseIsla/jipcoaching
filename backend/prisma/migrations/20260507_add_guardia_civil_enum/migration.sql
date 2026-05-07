-- Add GUARDIA_CIVIL to the oppositionType ENUM on physical_test_scales
ALTER TABLE `physical_test_scales`
  MODIFY COLUMN `oppositionType` ENUM('POLICIA_NACIONAL','POLICIA_LOCAL','BOMBEROS','TROPA_MARINERIA','GUARDIA_CIVIL') NOT NULL;