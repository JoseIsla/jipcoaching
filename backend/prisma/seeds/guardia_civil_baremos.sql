-- Guardia Civil physical test scales (apto/no apto, <35 age group)
-- BOE Resolución 160/38240/2025, 28 mayo 2025 (Apéndice II)
-- Run after deleting existing GC rows: DELETE FROM physical_test_scales WHERE oppositionType = 'GUARDIA_CIVIL';

-- Circuito de agilidad — MALE (≤14s = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Circuito de agilidad', 'MALE', 0, 14, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Circuito de agilidad', 'MALE', 14.01, 9999, 'seconds', 0);

-- Circuito de agilidad — FEMALE (≤16s = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Circuito de agilidad', 'FEMALE', 0, 16, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Circuito de agilidad', 'FEMALE', 16.01, 9999, 'seconds', 0);

-- Carrera 2000m — MALE (≤565s = 9'25" = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Carrera 2000m', 'MALE', 0, 565, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Carrera 2000m', 'MALE', 565.01, 9999, 'seconds', 0);

-- Carrera 2000m — FEMALE (≤674s = 11'14" = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Carrera 2000m', 'FEMALE', 0, 674, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Carrera 2000m', 'FEMALE', 674.01, 9999, 'seconds', 0);

-- Flexiones de brazos — MALE (≥16 = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Flexiones de brazos', 'MALE', 16, 9999, 'reps', 5),
(UUID(), 'GUARDIA_CIVIL', 'Flexiones de brazos', 'MALE', 0, 15.99, 'reps', 0);

-- Flexiones de brazos — FEMALE (≥11 = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Flexiones de brazos', 'FEMALE', 11, 9999, 'reps', 5),
(UUID(), 'GUARDIA_CIVIL', 'Flexiones de brazos', 'FEMALE', 0, 10.99, 'reps', 0);

-- Natación 50m — MALE (≤70s = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Natación 50m', 'MALE', 0, 70, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Natación 50m', 'MALE', 70.01, 9999, 'seconds', 0);

-- Natación 50m — FEMALE (≤81s = apto)
INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score) VALUES
(UUID(), 'GUARDIA_CIVIL', 'Natación 50m', 'FEMALE', 0, 81, 'seconds', 5),
(UUID(), 'GUARDIA_CIVIL', 'Natación 50m', 'FEMALE', 81.01, 9999, 'seconds', 0);