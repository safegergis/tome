-- Migration: Add Reading Activity Tracking
-- Description: Adds comprehensive reading activity tracking with sessions, progress monitoring,
--              DNF status, audiobook support, and auto-generated default lists
-- Date: 2025-11-15

-- ============================================================================
-- PART 1: CREATE NEW ENUM TYPES
-- ============================================================================

-- Reading status enum for user_books
CREATE TYPE reading_status AS ENUM ('want-to-read', 'currently-reading', 'read', 'did-not-finish');

-- Reading method enum for sessions
CREATE TYPE reading_method AS ENUM ('physical', 'ebook', 'audiobook');

-- List type enum for categorizing lists
CREATE TYPE list_type AS ENUM ('custom', 'currently-reading', 'to-be-read');

-- ============================================================================
-- PART 2: ALTER EXISTING TABLES
-- ============================================================================

-- Update books table with audiobook and ebook support
ALTER TABLE books
    ADD COLUMN ebook_page_count INTEGER,
    ADD COLUMN audio_length_seconds INTEGER,
    ADD CONSTRAINT ebook_page_count_positive CHECK (ebook_page_count > 0 OR ebook_page_count IS NULL),
    ADD CONSTRAINT audio_length_positive CHECK (audio_length_seconds > 0 OR audio_length_seconds IS NULL);

-- Make page_count nullable (some books may only have audiobook versions)
ALTER TABLE books
    DROP CONSTRAINT page_count_positive,
    ADD CONSTRAINT page_count_positive CHECK (page_count > 0 OR page_count IS NULL);

-- Add index for audiobooks
CREATE INDEX idx_books_audio_length ON books(audio_length_seconds) WHERE audio_length_seconds IS NOT NULL;

-- Create user_books table with tracking fields
CREATE TABLE user_books (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status reading_status NOT NULL,
    current_page INTEGER DEFAULT 0,
    current_seconds INTEGER DEFAULT 0,
    user_page_count INTEGER,
    user_audio_length_seconds INTEGER,
    personal_rating INTEGER,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    dnf_date TIMESTAMP WITH TIME ZONE,
    dnf_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, book_id),
    CONSTRAINT current_page_positive CHECK (current_page >= 0),
    CONSTRAINT current_seconds_positive CHECK (current_seconds >= 0),
    CONSTRAINT user_page_count_positive CHECK (user_page_count > 0 OR user_page_count IS NULL),
    CONSTRAINT user_audio_length_positive CHECK (user_audio_length_seconds > 0 OR user_audio_length_seconds IS NULL),
    CONSTRAINT rating_range CHECK (personal_rating >= 1 AND personal_rating <= 5),
    CONSTRAINT finished_after_started CHECK (finished_at IS NULL OR started_at IS NULL OR finished_at >= started_at)
);

CREATE INDEX idx_user_books_user_id ON user_books(user_id);
CREATE INDEX idx_user_books_status ON user_books(status);
CREATE INDEX idx_user_books_book_id ON user_books(book_id);

-- Create lists table with default list support
CREATE TABLE lists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    list_type list_type DEFAULT 'custom',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT name_length CHECK (length(name) >= 1),
    CONSTRAINT system_list_check CHECK (
        (is_default = false) OR
        (is_default = true AND list_type IN ('currently-reading', 'to-be-read'))
    )
);

CREATE INDEX idx_lists_user_id ON lists(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_is_public ON lists(is_public) WHERE deleted_at IS NULL AND is_public = true;
CREATE INDEX idx_lists_created_at ON lists(created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_lists_default_per_user ON lists(user_id, list_type) WHERE is_default = true;

-- Create list_books junction table
CREATE TABLE list_books (
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    book_order INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (list_id, book_id),
    CONSTRAINT book_order_positive CHECK (book_order > 0)
);

CREATE INDEX idx_list_books_book_id ON list_books(book_id);
CREATE INDEX idx_list_books_order ON list_books(list_id, book_order);

-- ============================================================================
-- PART 3: CREATE NEW TABLES
-- ============================================================================

CREATE TABLE reading_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,

    pages_read INTEGER,
    minutes_read INTEGER,

    reading_method reading_method NOT NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,

    start_page INTEGER,
    end_page INTEGER,
    notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pages_read_positive CHECK (pages_read > 0 OR pages_read IS NULL),
    CONSTRAINT minutes_read_positive CHECK (minutes_read > 0 OR minutes_read IS NULL),
    CONSTRAINT audiobook_requires_time CHECK (
        reading_method != 'audiobook' OR minutes_read IS NOT NULL
    ),
    CONSTRAINT non_audiobook_requires_pages CHECK (
        reading_method = 'audiobook' OR pages_read IS NOT NULL
    ),
    CONSTRAINT start_before_end CHECK (end_page IS NULL OR start_page IS NULL OR end_page > start_page)
);

-- Create indexes for reading_sessions
CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(session_date DESC);
CREATE INDEX idx_reading_sessions_user_book ON reading_sessions(user_id, book_id);
CREATE INDEX idx_reading_sessions_method ON reading_sessions(reading_method);

-- ============================================================================
-- PART 4: CREATE VIEWS
-- ============================================================================

-- View: user_book_progress
-- Provides easy access to reading progress with calculated percentages and session aggregations
CREATE VIEW user_book_progress AS
SELECT
    ub.id,
    ub.user_id,
    ub.book_id,
    ub.status,
    ub.current_page,
    ub.current_seconds,

    -- Page-based tracking
    COALESCE(ub.user_page_count, b.page_count, b.ebook_page_count) AS effective_page_count,
    b.page_count AS book_page_count,
    b.ebook_page_count,
    ub.user_page_count,

    -- Time-based tracking (audiobooks)
    COALESCE(ub.user_audio_length_seconds, b.audio_length_seconds) AS effective_audio_length,
    b.audio_length_seconds AS book_audio_length,
    ub.user_audio_length_seconds,

    -- Progress percentage (uses whichever is applicable)
    CASE
        WHEN COALESCE(ub.user_page_count, b.page_count, b.ebook_page_count) > 0
        THEN LEAST(ROUND((ub.current_page::NUMERIC / COALESCE(ub.user_page_count, b.page_count, b.ebook_page_count)) * 100, 2), 100)
        WHEN COALESCE(ub.user_audio_length_seconds, b.audio_length_seconds) > 0
        THEN LEAST(ROUND((ub.current_seconds::NUMERIC / COALESCE(ub.user_audio_length_seconds, b.audio_length_seconds)) * 100, 2), 100)
        ELSE 0
    END AS progress_percentage,

    -- Session aggregations
    COUNT(rs.id) AS total_sessions,
    SUM(rs.pages_read) AS total_pages_logged,
    SUM(rs.minutes_read) AS total_minutes_logged,
    MAX(rs.session_date) AS last_session_date,

    -- Primary reading method (most used)
    MODE() WITHIN GROUP (ORDER BY rs.reading_method) AS primary_method

FROM user_books ub
JOIN books b ON ub.book_id = b.id
LEFT JOIN reading_sessions rs ON ub.user_id = rs.user_id AND ub.book_id = rs.book_id
GROUP BY ub.id, ub.user_id, ub.book_id, ub.status, ub.current_page, ub.current_seconds,
         ub.user_page_count, b.page_count, b.ebook_page_count,
         ub.user_audio_length_seconds, b.audio_length_seconds;

-- View: user_reading_activity
-- Aggregated reading activity and statistics per user, including weekly metrics
CREATE VIEW user_reading_activity AS
SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '7 days' THEN rs.id END) AS sessions_this_week,
    SUM(CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '7 days' THEN COALESCE(rs.pages_read, 0) ELSE 0 END) AS pages_this_week,
    SUM(CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '7 days' THEN COALESCE(rs.minutes_read, 0) ELSE 0 END) AS minutes_this_week,
    COUNT(DISTINCT CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '30 days' THEN rs.id END) AS sessions_this_month,
    SUM(CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '30 days' THEN COALESCE(rs.pages_read, 0) ELSE 0 END) AS pages_this_month,
    SUM(CASE WHEN rs.session_date >= CURRENT_DATE - INTERVAL '30 days' THEN COALESCE(rs.minutes_read, 0) ELSE 0 END) AS minutes_this_month,
    COUNT(DISTINCT rs.book_id) AS books_with_sessions,
    MODE() WITHIN GROUP (ORDER BY rs.reading_method) AS preferred_reading_method
FROM users u
LEFT JOIN reading_sessions rs ON u.id = rs.user_id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username;

-- View: audiobook_statistics
-- Statistics and metrics specifically for audiobooks
CREATE VIEW audiobook_statistics AS
SELECT
    b.id AS book_id,
    b.title,
    b.audio_length_seconds,
    ROUND(b.audio_length_seconds / 3600.0, 2) AS audio_length_hours,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE rs.reading_method = 'audiobook') AS audiobook_listeners,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE ub.status = 'read' AND rs.reading_method = 'audiobook') AS completed_listeners,
    AVG(rs.minutes_read) FILTER (WHERE rs.reading_method = 'audiobook') AS avg_session_minutes,
    SUM(rs.minutes_read) FILTER (WHERE rs.reading_method = 'audiobook') AS total_listening_minutes
FROM books b
LEFT JOIN user_books ub ON b.id = ub.book_id
LEFT JOIN reading_sessions rs ON b.id = rs.book_id AND ub.user_id = rs.user_id
WHERE b.audio_length_seconds IS NOT NULL
GROUP BY b.id, b.title, b.audio_length_seconds;

-- ============================================================================
-- PART 5: CREATE TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function: Auto-create default lists for new users
CREATE OR REPLACE FUNCTION create_default_lists_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lists (user_id, name, description, is_public, is_default, list_type)
    VALUES
        (NEW.id, 'Currently Reading', 'Books I am currently reading', true, true, 'currently-reading'),
        (NEW.id, 'To Be Read', 'Books I want to read', true, true, 'to-be-read');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Create default lists after user creation
CREATE TRIGGER trigger_create_default_lists
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_lists_for_user();

-- Function: Auto-update updated_at timestamp for reading_sessions
CREATE OR REPLACE FUNCTION update_reading_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update reading_sessions updated_at on modification
CREATE TRIGGER update_reading_sessions_timestamp
    BEFORE UPDATE ON reading_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_reading_sessions_updated_at();

-- ============================================================================
-- PART 6: BACKFILL DEFAULT LISTS FOR EXISTING USERS (Optional)
-- ============================================================================

-- Uncomment the following to create default lists for existing users
-- INSERT INTO lists (user_id, name, description, is_public, is_default, list_type)
-- SELECT
--     u.id,
--     'Currently Reading',
--     'Books I am currently reading',
--     true,
--     true,
--     'currently-reading'
-- FROM users u
-- WHERE u.deleted_at IS NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM lists l
--       WHERE l.user_id = u.id AND l.list_type = 'currently-reading' AND l.is_default = true
--   );

-- INSERT INTO lists (user_id, name, description, is_public, is_default, list_type)
-- SELECT
--     u.id,
--     'To Be Read',
--     'Books I want to read',
--     true,
--     true,
--     'to-be-read'
-- FROM users u
-- WHERE u.deleted_at IS NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM lists l
--       WHERE l.user_id = u.id AND l.list_type = 'to-be-read' AND l.is_default = true
--   );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration
SELECT 'Migration completed successfully!' AS status;
