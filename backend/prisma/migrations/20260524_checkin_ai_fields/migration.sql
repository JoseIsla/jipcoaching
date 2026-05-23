-- Add AI analysis + admin feedback fields to checkins for Claude-powered review flow.
ALTER TABLE `checkins`
  ADD COLUMN `aiAnalysis` TEXT NULL,
  ADD COLUMN `aiDraftResponse` TEXT NULL,
  ADD COLUMN `aiAnalyzedAt` DATETIME(3) NULL,
  ADD COLUMN `adminFeedback` TEXT NULL,
  ADD COLUMN `feedbackSentAt` DATETIME(3) NULL;