-- ═══════════════════════════════════════════════════════════════════
-- Official Policía Nacional physical test baremos (BOE)
-- Source: voyaseropositor.es — 11 score bands (0-10) per test/gender
-- ═══════════════════════════════════════════════════════════════════

-- Clean existing PN baremos before re-seeding
DELETE FROM physical_test_scales WHERE oppositionType = 'POLICIA_NACIONAL';

INSERT INTO physical_test_scales (id, oppositionType, testName, gender, minValue, maxValue, unit, score, createdAt) VALUES
-- ── Circuito de agilidad — HOMBRES (lower is better: seconds) ──
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 11.7, 999, 'seconds', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 11.5, 11.6, 'seconds', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 11.3, 11.4, 'seconds', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 11.0, 11.2, 'seconds', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 10.6, 10.9, 'seconds', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 10.2, 10.5, 'seconds', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 9.8, 10.1, 'seconds', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 9.4, 9.7, 'seconds', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 8.9, 9.3, 'seconds', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 8.3, 8.8, 'seconds', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'MALE', 0, 8.2, 'seconds', 10, NOW()),
-- ── Circuito de agilidad — MUJERES ──
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 12.8, 999, 'seconds', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 12.6, 12.7, 'seconds', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 12.4, 12.5, 'seconds', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 12.1, 12.3, 'seconds', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 11.7, 12.0, 'seconds', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 11.3, 11.6, 'seconds', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 10.9, 11.2, 'seconds', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 10.4, 10.8, 'seconds', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 9.9, 10.3, 'seconds', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 9.4, 9.8, 'seconds', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Circuito de agilidad', 'FEMALE', 0, 9.3, 'seconds', 10, NOW()),
-- ── Dominadas — HOMBRES ──
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 0, 4, 'reps', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 5, 5, 'reps', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 6, 6, 'reps', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 7, 7, 'reps', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 8, 9, 'reps', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 10, 11, 'reps', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 12, 13, 'reps', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 14, 14, 'reps', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 15, 15, 'reps', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 16, 16, 'reps', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Dominadas', 'MALE', 17, 999, 'reps', 10, NOW()),
-- ── Suspensión en barra — MUJERES ──
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 0, 35, 'seconds', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 36, 40, 'seconds', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 41, 45, 'seconds', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 46, 51, 'seconds', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 52, 56, 'seconds', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 57, 62, 'seconds', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 63, 69, 'seconds', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 70, 77, 'seconds', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 78, 85, 'seconds', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 86, 94, 'seconds', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Suspensión en barra', 'FEMALE', 95, 999, 'seconds', 10, NOW()),
-- ── Carrera 1000m — HOMBRES (times in seconds, lower is better) ──
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 229, 999, 'seconds', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 223, 228, 'seconds', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 217, 222, 'seconds', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 211, 216, 'seconds', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 205, 210, 'seconds', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 199, 204, 'seconds', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 193, 198, 'seconds', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 187, 192, 'seconds', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 181, 186, 'seconds', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 175, 180, 'seconds', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'MALE', 0, 174, 'seconds', 10, NOW()),
-- ── Carrera 1000m — MUJERES ──
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 286, 999, 'seconds', 0, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 277, 285, 'seconds', 1, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 268, 276, 'seconds', 2, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 259, 267, 'seconds', 3, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 250, 258, 'seconds', 4, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 241, 249, 'seconds', 5, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 232, 240, 'seconds', 6, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 223, 231, 'seconds', 7, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 214, 222, 'seconds', 8, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 205, 213, 'seconds', 9, NOW()),
(UUID(), 'POLICIA_NACIONAL', 'Carrera 1000m', 'FEMALE', 0, 204, 'seconds', 10, NOW());