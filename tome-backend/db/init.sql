-- =====================================================
-- Tome Books Microservice Database Initialization
-- =====================================================
-- This script initializes the books microservice tables
-- for the Tome reading tracking application.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: authors
-- Stores author information
-- =====================================================

CREATE TABLE IF NOT EXISTS authors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_date DATE,
    death_date DATE,
    photo_url VARCHAR(500),
    external_id VARCHAR(255),
    external_source VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT death_after_birth CHECK (death_date IS NULL OR birth_date IS NULL OR death_date > birth_date),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
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
    book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
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
-- SAMPLE DATA: Books from mocked data
-- =====================================================

-- Insert authors
INSERT INTO authors (id, name) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'F. Scott Fitzgerald'),
    ('a2222222-2222-2222-2222-222222222222', 'George Orwell'),
    ('a3333333-3333-3333-3333-333333333333', 'Harper Lee'),
    ('a4444444-4444-4444-4444-444444444444', 'Andy Weir'),
    ('a5555555-5555-5555-5555-555555555555', 'Matt Haig'),
    ('a6666666-6666-6666-6666-666666666666', 'James Clear'),
    ('a7777777-7777-7777-7777-777777777777', 'Alex Michaelides'),
    ('a8888888-8888-8888-8888-888888888888', 'Tara Westover')
ON CONFLICT (id) DO NOTHING;

-- Insert books
INSERT INTO books (id, title, isbn_10, isbn_13, publisher, published_date, page_count, description) VALUES
    (
        'b1111111-1111-1111-1111-111111111111',
        'The Great Gatsby',
        '0743273565',
        '9780743273565',
        'Scribner',
        '1925-04-10',
        180,
        'The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway''s interactions with mysterious millionaire Jay Gatsby and Gatsby''s obsession to reunite with his former lover, Daisy Buchanan.'
    ),
    (
        'b2222222-2222-2222-2222-222222222222',
        '1984',
        '0451524935',
        '9780451524935',
        'Signet Classic',
        '1949-06-08',
        328,
        'A dystopian social science fiction novel and cautionary tale by English writer George Orwell. It was published on 8 June 1949 by Secker & Warburg as Orwell''s ninth and final book completed in his lifetime. Thematically, it centres on the consequences of totalitarianism, mass surveillance, and repressive regimentation of people and behaviours within society.'
    ),
    (
        'b3333333-3333-3333-3333-333333333333',
        'To Kill a Mockingbird',
        '0061120084',
        '9780061120084',
        'Harper Perennial Modern Classics',
        '1960-07-11',
        336,
        'To Kill a Mockingbird is a novel by the American author Harper Lee. It was published in 1960 and was instantly successful. The plot and characters are loosely based on Lee''s observations of her family, her neighbors and an event that occurred near her hometown of Monroeville, Alabama, in 1936, when she was ten.'
    ),
    (
        'b4444444-4444-4444-4444-444444444444',
        'Project Hail Mary',
        '0593135202',
        '9780593135204',
        'Ballantine Books',
        '2021-05-04',
        496,
        'A 2021 science fiction novel by American author Andy Weir. Set in the near future, it centers on middle school teacher Ryland Grace, who wakes up from a coma afflicted with amnesia, aboard a small spacecraft. He gradually remembers that he was sent to the Tau Ceti solar system, 12 light-years from Earth, to find a means of reversing a solar dimming event that could cause the extinction of humanity.'
    ),
    (
        'b5555555-5555-5555-5555-555555555555',
        'The Midnight Library',
        '0525559477',
        '9780525559474',
        'Viking',
        '2020-08-13',
        304,
        'The Midnight Library is a 2020 novel by Matt Haig. It tells the story of Nora Seed, a woman who lives a monotonous, ordinary life and feels estranged from herself. After facing a series of rejections, she becomes suicidal and ends up in the Midnight Library, where she gets the chance to undo her regrets through exploring infinite parallel lives.'
    ),
    (
        'b6666666-6666-6666-6666-666666666666',
        'Atomic Habits',
        '0735211299',
        '9780735211292',
        'Avery',
        '2018-10-16',
        320,
        'An Easy & Proven Way to Build Good Habits & Break Bad Ones. No matter your goals, Atomic Habits offers a proven framework for improving--every day. James Clear, one of the world''s leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.'
    ),
    (
        'b7777777-7777-7777-7777-777777777777',
        'The Silent Patient',
        '1250301696',
        '9781250301697',
        'Celadon Books',
        '2019-02-05',
        336,
        'The Silent Patient is a 2019 psychological thriller novel written by British–Cypriot author Alex Michaelides. The successful debut novel was published by Celadon Books, a division of Macmillan Publishers, on 5 February 2019. The story is about a woman named Alicia who shoots her husband and then stops speaking.'
    ),
    (
        'b8888888-8888-8888-8888-888888888888',
        'Educated',
        '0399590501',
        '9780399590504',
        'Random House',
        '2018-02-20',
        334,
        'Educated is a memoir by the American author Tara Westover. Westover recounts her childhood in rural Idaho, where her family lived in isolation from mainstream society. Her father was distrustful of the government and modern medicine, and her mother was a midwife and herbalist. Westover did not attend school but taught herself enough to gain admission to Brigham Young University.'
    )
ON CONFLICT (id) DO NOTHING;

-- Link books to authors
INSERT INTO book_authors (book_id, author_id, author_order) VALUES
    ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 1),
    ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 1),
    ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 1),
    ('b4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 1),
    ('b5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 1),
    ('b6666666-6666-6666-6666-666666666666', 'a6666666-6666-6666-6666-666666666666', 1),
    ('b7777777-7777-7777-7777-777777777777', 'a7777777-7777-7777-7777-777777777777', 1),
    ('b8888888-8888-8888-8888-888888888888', 'a8888888-8888-8888-8888-888888888888', 1)
ON CONFLICT (book_id, author_id) DO NOTHING;

-- Link books to genres
INSERT INTO book_genres (book_id, genre_id)
SELECT 'b1111111-1111-1111-1111-111111111111', id FROM genres WHERE name IN ('Classic', 'Fiction', 'Romance')
UNION ALL
SELECT 'b2222222-2222-2222-2222-222222222222', id FROM genres WHERE name IN ('Dystopian', 'Science Fiction', 'Political Fiction')
UNION ALL
SELECT 'b3333333-3333-3333-3333-333333333333', id FROM genres WHERE name IN ('Classic', 'Fiction', 'Coming-of-Age')
UNION ALL
SELECT 'b4444444-4444-4444-4444-444444444444', id FROM genres WHERE name IN ('Science Fiction', 'Adventure', 'Fiction')
UNION ALL
SELECT 'b5555555-5555-5555-5555-555555555555', id FROM genres WHERE name IN ('Fiction', 'Fantasy', 'Contemporary')
UNION ALL
SELECT 'b6666666-6666-6666-6666-666666666666', id FROM genres WHERE name IN ('Self-Help', 'Non-Fiction', 'Psychology')
UNION ALL
SELECT 'b7777777-7777-7777-7777-777777777777', id FROM genres WHERE name IN ('Mystery', 'Thriller', 'Fiction')
UNION ALL
SELECT 'b8888888-8888-8888-8888-888888888888', id FROM genres WHERE name IN ('Memoir', 'Non-Fiction', 'Biography')
ON CONFLICT (book_id, genre_id) DO NOTHING;

-- =====================================================
-- Initialization Complete
-- =====================================================

-- Display table counts
SELECT 'Authors: ' || COUNT(*) FROM authors;
SELECT 'Genres: ' || COUNT(*) FROM genres;
SELECT 'Books: ' || COUNT(*) FROM books;
SELECT 'Book-Author relationships: ' || COUNT(*) FROM book_authors;
SELECT 'Book-Genre relationships: ' || COUNT(*) FROM book_genres;
