-- Tome Database Initialization Script
-- PostgreSQL Database Schema
-- Generated from JPA entities and DATABASE_SCHEMA.md
--
-- COMPATIBILITY: Works with any PostgreSQL 15+ database
-- - Managed databases (DigitalOcean, AWS RDS, Azure Database, etc.)
-- - Local PostgreSQL installations
-- - PostgreSQL in Docker
-- - Cloud-hosted PostgreSQL
--
-- USAGE:
-- psql -h <hostname> -U <username> -d <database> -f init.sql
--
-- Example with local database:
-- psql -U myuser -d tomedb -f init.sql
--
-- Example with managed database:
-- psql -h db-host.example.com -p 25060 -U dbuser -d production -f init.sql

-- ============================================================================
-- 1. CREATE ENUMS
-- ============================================================================

-- Reading status enum for user_books table
CREATE TYPE reading_status AS ENUM (
    'WANT_TO_READ',
    'CURRENTLY_READING',
    'READ',
    'DID_NOT_FINISH'
);

-- Reading method enum for reading_sessions table
CREATE TYPE reading_method AS ENUM (
    'PHYSICAL',
    'EBOOK',
    'AUDIOBOOK'
);

-- List type enum for lists table
CREATE TYPE list_type AS ENUM (
    'CUSTOM',
    'CURRENTLY_READING',
    'TO_BE_READ'
);

-- Friend request status enum for friend_requests table
CREATE TYPE friend_request_status AS ENUM (
    'PENDING',
    'REJECTED'
);

-- ============================================================================
-- 2. CREATE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Users Table (tome-auth service)
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT username_length CHECK (length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Verification Tokens Table (tome-auth service)
-- ----------------------------------------------------------------------------
CREATE TABLE verification_tokens (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(6) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT token_type_check CHECK (token_type IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_code ON verification_tokens(code);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- ----------------------------------------------------------------------------
-- Books Table (tome-content service)
-- ----------------------------------------------------------------------------
CREATE TABLE books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    isbn_10 VARCHAR(10) UNIQUE,
    isbn_13 VARCHAR(13) UNIQUE,
    publisher VARCHAR(255),
    published_date DATE,
    page_count INTEGER,
    ebook_page_count INTEGER,
    audio_length_seconds INTEGER,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    description TEXT,
    cover_url VARCHAR(500),
    external_id VARCHAR(100),
    external_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT isbn_10_format CHECK (isbn_10 ~* '^[0-9]{10}$' OR isbn_10 IS NULL),
    CONSTRAINT isbn_13_format CHECK (isbn_13 ~* '^[0-9]{13}$' OR isbn_13 IS NULL),
    CONSTRAINT at_least_one_isbn CHECK (isbn_10 IS NOT NULL OR isbn_13 IS NOT NULL),
    CONSTRAINT page_count_positive CHECK (page_count > 0 OR page_count IS NULL),
    CONSTRAINT ebook_page_count_positive CHECK (ebook_page_count > 0 OR ebook_page_count IS NULL),
    CONSTRAINT audio_length_positive CHECK (audio_length_seconds > 0 OR audio_length_seconds IS NULL),
    UNIQUE(external_source, external_id)
);

CREATE INDEX idx_books_isbn_10 ON books(isbn_10) WHERE isbn_10 IS NOT NULL;
CREATE INDEX idx_books_isbn_13 ON books(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX idx_books_title ON books USING gin(to_tsvector('english', title));
CREATE INDEX idx_books_published_date ON books(published_date);
CREATE INDEX idx_books_audio_length ON books(audio_length_seconds) WHERE audio_length_seconds IS NOT NULL;
CREATE INDEX idx_books_external ON books(external_source, external_id) WHERE external_source IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Authors Table (tome-content service)
-- ----------------------------------------------------------------------------
CREATE TABLE authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_year INTEGER,
    death_year INTEGER,
    photo_url VARCHAR(500),
    external_id VARCHAR(255),
    external_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT death_after_birth CHECK (death_year IS NULL OR birth_year IS NULL OR death_year > birth_year)
);

CREATE INDEX idx_authors_name ON authors USING gin(to_tsvector('english', name));
CREATE INDEX idx_authors_external ON authors(external_source, external_id) WHERE external_source IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Genres Table (tome-content service)
-- ----------------------------------------------------------------------------
CREATE TABLE genres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_genres_name ON genres(name);

-- ----------------------------------------------------------------------------
-- Book Authors Junction Table (tome-content service)
-- ----------------------------------------------------------------------------
CREATE TABLE book_authors (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, author_id),
    CONSTRAINT author_order_positive CHECK (author_order > 0)
);

CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);

-- ----------------------------------------------------------------------------
-- Book Genres Junction Table (tome-content service)
-- ----------------------------------------------------------------------------
CREATE TABLE book_genres (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, genre_id)
);

CREATE INDEX idx_book_genres_genre_id ON book_genres(genre_id);

-- ----------------------------------------------------------------------------
-- User Books Table (tome-user-data service)
-- ----------------------------------------------------------------------------
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

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

-- ----------------------------------------------------------------------------
-- Reading Sessions Table (tome-user-data service)
-- ----------------------------------------------------------------------------
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
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pages_read_positive CHECK (pages_read > 0 OR pages_read IS NULL),
    CONSTRAINT minutes_read_positive CHECK (minutes_read > 0 OR minutes_read IS NULL),
    CONSTRAINT audiobook_requires_time CHECK (
        reading_method != 'AUDIOBOOK' OR minutes_read IS NOT NULL
    ),
    CONSTRAINT non_audiobook_requires_pages CHECK (
        reading_method = 'AUDIOBOOK' OR pages_read IS NOT NULL
    ),
    CONSTRAINT start_before_end CHECK (end_page IS NULL OR start_page IS NULL OR end_page > start_page)
);

CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(session_date DESC);
CREATE INDEX idx_reading_sessions_user_book ON reading_sessions(user_id, book_id);
CREATE INDEX idx_reading_sessions_method ON reading_sessions(reading_method);

-- ----------------------------------------------------------------------------
-- Lists Table (tome-user-data service)
-- ----------------------------------------------------------------------------
CREATE TABLE lists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    list_type list_type DEFAULT 'CUSTOM',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT name_length CHECK (length(name) >= 1),
    CONSTRAINT system_list_check CHECK (
        (is_default = false) OR
        (is_default = true AND list_type IN ('CURRENTLY_READING', 'TO_BE_READ'))
    )
);

CREATE INDEX idx_lists_user_id ON lists(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_lists_is_public ON lists(is_public) WHERE deleted_at IS NULL AND is_public = true;
CREATE INDEX idx_lists_created_at ON lists(created_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_lists_default_per_user ON lists(user_id, list_type) WHERE is_default = true;

-- ----------------------------------------------------------------------------
-- List Books Junction Table (tome-user-data service)
-- ----------------------------------------------------------------------------
CREATE TABLE list_books (
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    book_order INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (list_id, book_id),
    CONSTRAINT book_order_positive CHECK (book_order > 0)
);

CREATE INDEX idx_list_books_book_id ON list_books(book_id);
CREATE INDEX idx_list_books_order ON list_books(list_id, book_order);

-- ----------------------------------------------------------------------------
-- Friendships Table (tome-user-data service)
-- ----------------------------------------------------------------------------
CREATE TABLE friendships (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friendships_user_id ON friendships(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id) WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Friend Requests Table (tome-user-data service)
-- ----------------------------------------------------------------------------
CREATE TABLE friend_requests (
    id BIGSERIAL PRIMARY KEY,
    requester_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    addressee_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status friend_request_status NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(requester_id, addressee_id)
);

CREATE INDEX idx_friend_requests_requester_id ON friend_requests(requester_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_friend_requests_addressee_id ON friend_requests(addressee_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_friend_requests_status ON friend_requests(status) WHERE deleted_at IS NULL;

-- ============================================================================
-- 3. CREATE VIEWS (for analytics and reporting)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Book Statistics View
-- ----------------------------------------------------------------------------
CREATE VIEW book_statistics AS
SELECT
    b.id AS book_id,
    b.title,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE ub.status = 'READ') AS total_reads,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE ub.status = 'CURRENTLY_READING') AS total_currently_reading,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE ub.status = 'WANT_TO_READ') AS total_want_to_read
FROM books b
LEFT JOIN user_books ub ON b.id = ub.book_id
GROUP BY b.id, b.title;

-- ----------------------------------------------------------------------------
-- User Reading Stats View
-- ----------------------------------------------------------------------------
CREATE VIEW user_reading_stats AS
SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT CASE WHEN ub.status = 'READ' THEN ub.book_id END) AS books_read,
    COUNT(DISTINCT CASE WHEN ub.status = 'CURRENTLY_READING' THEN ub.book_id END) AS books_currently_reading,
    COUNT(DISTINCT CASE WHEN ub.status = 'WANT_TO_READ' THEN ub.book_id END) AS books_want_to_read,
    COALESCE(SUM(b.page_count) FILTER (WHERE ub.status = 'READ'), 0) AS total_pages_read
FROM users u
LEFT JOIN user_books ub ON u.id = ub.user_id
LEFT JOIN books b ON ub.book_id = b.id
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username;

-- ----------------------------------------------------------------------------
-- User Book Progress View
-- ----------------------------------------------------------------------------
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

    -- Progress percentage
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

-- ----------------------------------------------------------------------------
-- User Reading Activity View
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Audiobook Statistics View
-- ----------------------------------------------------------------------------
CREATE VIEW audiobook_statistics AS
SELECT
    b.id AS book_id,
    b.title,
    b.audio_length_seconds,
    ROUND(b.audio_length_seconds / 3600.0, 2) AS audio_length_hours,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE rs.reading_method = 'AUDIOBOOK') AS audiobook_listeners,
    COUNT(DISTINCT ub.user_id) FILTER (WHERE ub.status = 'READ' AND rs.reading_method = 'AUDIOBOOK') AS completed_listeners,
    AVG(rs.minutes_read) FILTER (WHERE rs.reading_method = 'AUDIOBOOK') AS avg_session_minutes,
    SUM(rs.minutes_read) FILTER (WHERE rs.reading_method = 'AUDIOBOOK') AS total_listening_minutes
FROM books b
LEFT JOIN user_books ub ON b.id = ub.book_id
LEFT JOIN reading_sessions rs ON b.id = rs.book_id AND ub.user_id = rs.user_id
WHERE b.audio_length_seconds IS NOT NULL
GROUP BY b.id, b.title, b.audio_length_seconds;

-- ============================================================================
-- 4. CREATE TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Auto-update updated_at timestamp
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_authors_updated_at BEFORE UPDATE ON authors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_books_updated_at BEFORE UPDATE ON user_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reading_sessions_updated_at BEFORE UPDATE ON reading_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON friend_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Auto-create default lists for new users
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_lists_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO lists (user_id, name, description, is_public, is_default, list_type)
    VALUES
        (NEW.id, 'Currently Reading', 'Books I am currently reading', true, true, 'CURRENTLY_READING'),
        (NEW.id, 'To Be Read', 'Books I want to read', true, true, 'TO_BE_READ');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_default_lists
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_lists_for_user();

-- ============================================================================
-- 5. SEED DATA (optional - common genres)
-- ============================================================================

INSERT INTO genres (name, description) VALUES
    ('Fiction', 'Literary works created from the imagination'),
    ('Non-Fiction', 'Informational or educational works based on facts'),
    ('Science Fiction', 'Speculative fiction based on scientific concepts'),
    ('Fantasy', 'Fiction involving magic or supernatural elements'),
    ('Mystery', 'Fiction dealing with the solution of a crime or puzzle'),
    ('Thriller', 'Fast-paced fiction designed to create suspense'),
    ('Romance', 'Fiction focused on romantic relationships'),
    ('Horror', 'Fiction designed to frighten or unsettle'),
    ('Biography', 'Account of someone''s life written by someone else'),
    ('Autobiography', 'Account of one''s own life'),
    ('History', 'Study of past events'),
    ('Self-Help', 'Books offering advice and techniques for personal improvement'),
    ('Business', 'Books about commerce, economics, and management'),
    ('Cookbook', 'Books containing recipes and cooking instructions'),
    ('Poetry', 'Literary work in verse form'),
    ('Graphic Novel', 'Story told in comic-strip format'),
    ('Young Adult', 'Fiction targeted at teenage readers'),
    ('Children', 'Books written for young children'),
    ('Classic', 'Literature of recognized value from the past'),
    ('Philosophy', 'Study of fundamental questions about existence and knowledge')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- End of initialization script
-- ============================================================================
