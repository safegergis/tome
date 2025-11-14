-- =====================================================
-- Tome Books Microservice Database Initialization
-- =====================================================
-- This script initializes the books microservice tables
-- for the Tome reading tracking application.
-- =====================================================

-- =====================================================
-- TABLE: authors
-- Stores author information
-- =====================================================

CREATE TABLE IF NOT EXISTS authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_year INTEGER,
    death_year INTEGER,
    photo_url VARCHAR(500),
    external_id VARCHAR(255),
    external_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT death_after_birth_year CHECK (death_year IS NULL OR birth_year IS NULL OR death_year > birth_year),
    CONSTRAINT valid_birth_year CHECK (birth_year IS NULL OR (birth_year >= 1000 AND birth_year <= 2100)),
    CONSTRAINT valid_death_year CHECK (death_year IS NULL OR (death_year >= 1000 AND death_year <= 2100)),
    CONSTRAINT valid_author_external_source CHECK (external_source IN ('hardcover', 'google_books', 'open_library', 'goodreads') OR external_source IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_authors_name ON authors USING gin(to_tsvector('english', name));
CREATE UNIQUE INDEX IF NOT EXISTS idx_authors_external_unique ON authors(external_source, external_id) WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authors_external_id ON authors(external_id) WHERE external_id IS NOT NULL;

-- =====================================================
-- TABLE: genres
-- Stores book genre categories
-- =====================================================

CREATE TABLE IF NOT EXISTS genres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name);

-- =====================================================
-- TABLE: books
-- Stores specific book editions with ISBN identifiers
-- =====================================================

CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    isbn_10 VARCHAR(10) UNIQUE,
    isbn_13 VARCHAR(13) UNIQUE,
    publisher VARCHAR(255),
    published_date DATE,
    page_count INTEGER,
    language VARCHAR(10) DEFAULT 'en',
    description TEXT,
    cover_url VARCHAR(500),
    external_id VARCHAR(255),
    external_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT isbn_10_format CHECK (isbn_10 ~* '^[0-9]{10}$' OR isbn_10 IS NULL),
    CONSTRAINT isbn_13_format CHECK (isbn_13 ~* '^[0-9]{13}$' OR isbn_13 IS NULL),
    CONSTRAINT at_least_one_isbn CHECK (isbn_10 IS NOT NULL OR isbn_13 IS NOT NULL),
    CONSTRAINT page_count_positive CHECK (page_count > 0 OR page_count IS NULL),
    CONSTRAINT valid_external_source CHECK (external_source IN ('hardcover', 'google_books', 'open_library', 'goodreads') OR external_source IS NULL)
);

CREATE INDEX IF NOT EXISTS idx_books_isbn_10 ON books(isbn_10) WHERE isbn_10 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_isbn_13 ON books(isbn_13) WHERE isbn_13 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_books_published_date ON books(published_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_books_external_unique ON books(external_source, external_id) WHERE external_source IS NOT NULL AND external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_external_id ON books(external_id) WHERE external_id IS NOT NULL;

-- =====================================================
-- TABLE: book_authors
-- Junction table for books and authors (many-to-many)
-- =====================================================

CREATE TABLE IF NOT EXISTS book_authors (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, author_id),
    CONSTRAINT author_order_positive CHECK (author_order > 0)
);

CREATE INDEX IF NOT EXISTS idx_book_authors_author_id ON book_authors(author_id);

-- =====================================================
-- TABLE: book_genres
-- Junction table for books and genres (many-to-many)
-- =====================================================

CREATE TABLE IF NOT EXISTS book_genres (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_book_genres_genre_id ON book_genres(genre_id);

-- =====================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at column
DROP TRIGGER IF EXISTS update_authors_updated_at ON authors;
CREATE TRIGGER update_authors_updated_at
    BEFORE UPDATE ON authors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at
    BEFORE UPDATE ON books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Common book genres
-- =====================================================

INSERT INTO genres (name, description) VALUES
    ('Fiction', 'Literary works of imaginative narration'),
    ('Non-Fiction', 'Factual and informative works'),
    ('Science Fiction', 'Speculative fiction based on science and technology'),
    ('Fantasy', 'Fiction involving magic and supernatural elements'),
    ('Mystery', 'Fiction dealing with puzzles and crime-solving'),
    ('Thriller', 'Fast-paced fiction with suspense and excitement'),
    ('Romance', 'Fiction focused on romantic relationships'),
    ('Horror', 'Fiction intended to frighten or disturb'),
    ('Historical Fiction', 'Fiction set in the past with historical elements'),
    ('Biography', 'Non-fiction account of a person''s life'),
    ('Autobiography', 'Non-fiction account of one''s own life'),
    ('Memoir', 'Non-fiction narrative from personal knowledge'),
    ('Self-Help', 'Non-fiction for personal improvement'),
    ('Business', 'Non-fiction about business and economics'),
    ('Philosophy', 'Non-fiction exploring fundamental questions'),
    ('Psychology', 'Non-fiction about mental processes and behavior'),
    ('History', 'Non-fiction about past events'),
    ('Science', 'Non-fiction about scientific topics'),
    ('Technology', 'Non-fiction about technological subjects'),
    ('Poetry', 'Literary work in verse form'),
    ('Drama', 'Literary work intended for theatrical performance'),
    ('Young Adult', 'Fiction targeted at teenage readers'),
    ('Children', 'Fiction and non-fiction for children'),
    ('Graphic Novel', 'Visual storytelling in comic format'),
    ('Classic', 'Literary works of recognized quality and lasting value'),
    ('Contemporary', 'Modern literary works'),
    ('Dystopian', 'Fiction depicting undesirable or frightening societies'),
    ('Adventure', 'Fiction involving exciting journeys or experiences'),
    ('Crime', 'Fiction centered on criminal activity'),
    ('Political Fiction', 'Fiction dealing with political themes'),
    ('Coming-of-Age', 'Fiction about personal growth and maturation'),
    ('Literary Fiction', 'Character-driven fiction with artistic merit'),
    ('Satire', 'Fiction using humor and irony to criticize'),
    ('Short Stories', 'Collection of brief fictional narratives'),
    ('Essays', 'Collection of analytical or interpretive writings')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- Initialization Complete
-- =====================================================
