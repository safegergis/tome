-- Rollback Migration: Remove Reading Activity Tracking
-- Description: Rolls back all changes made by add_reading_activity_tracking.sql
-- Date: 2025-11-15
-- WARNING: This will delete all reading session data!

-- ============================================================================
-- PART 1: DROP TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_create_default_lists ON users;
DROP TRIGGER IF EXISTS update_reading_sessions_timestamp ON reading_sessions;

-- ============================================================================
-- PART 2: DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS create_default_lists_for_user();
DROP FUNCTION IF EXISTS update_reading_sessions_updated_at();

-- ============================================================================
-- PART 3: DROP VIEWS
-- ============================================================================

DROP VIEW IF EXISTS user_book_progress;
DROP VIEW IF EXISTS user_reading_activity;
DROP VIEW IF EXISTS audiobook_statistics;

-- ============================================================================
-- PART 4: DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS reading_sessions;
DROP TABLE IF EXISTS list_books CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS user_books CASCADE;

-- ============================================================================
-- PART 5: REVERT TABLE ALTERATIONS
-- ============================================================================

-- Revert books table changes
DROP INDEX IF EXISTS idx_books_audio_length;

ALTER TABLE books
    DROP CONSTRAINT IF EXISTS ebook_page_count_positive,
    DROP CONSTRAINT IF EXISTS audio_length_positive,
    DROP CONSTRAINT IF EXISTS page_count_positive;

ALTER TABLE books
    DROP COLUMN IF EXISTS ebook_page_count,
    DROP COLUMN IF EXISTS audio_length_seconds;

-- Re-add original page_count constraint
ALTER TABLE books
    ADD CONSTRAINT page_count_positive CHECK (page_count > 0);

-- ============================================================================
-- PART 6: DROP ENUM TYPES
-- ============================================================================

DROP TYPE IF EXISTS list_type;
DROP TYPE IF EXISTS reading_method;
DROP TYPE IF EXISTS reading_status;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

SELECT 'Rollback completed. Note: ENUM types may still contain new values.' AS status;
