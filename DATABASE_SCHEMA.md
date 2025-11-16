# Database Schema Documentation

This document details the PostgreSQL database schema for the Tome application.

## Design Principles

1. **Books are specific editions** - Each book entry represents a specific edition with unique ISBN-10 and ISBN-13
2. **Normalized structure** - Reduces data redundancy through proper table relationships
3. **Flexible genre system** - Many-to-many relationship allows books to have multiple genres
4. **User-centric tracking** - Separate tables for user interactions (reading status, ratings, reviews, lists)
5. **Soft deletes** - Use `deleted_at` timestamps for important records instead of hard deletes

---

## Tables

### 1. users

Stores user account information.

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT username_length CHECK (length(username) >= 3),
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_username ON users(username) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

**Columns:**
- `id`: Unique user identifier (auto-incrementing BIGINT)
- `username`: Unique username (min 3 characters)
- `email`: Unique email address
- `password_hash`: Hashed password (bcrypt/argon2 recommended, required)
- `avatar_url`: Optional profile picture URL
- `bio`: User biography/description (optional)
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update timestamp
- `deleted_at`: Soft delete timestamp (NULL if active)

---

### 2. books

Stores specific book editions with ISBN identifiers.

```sql
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
    language VARCHAR(10) DEFAULT 'en',
    description TEXT,
    cover_url VARCHAR(500),
    audio_length_seconds INTEGER,
    external_source VARCHAR(50),
    external_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

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
```

**Columns:**
- `id`: Unique book identifier (auto-incrementing BIGINT)
- `title`: Book title (required)
- `subtitle`: Book subtitle (optional)
- `isbn_10`: ISBN-10 identifier (unique, 10 digits)
- `isbn_13`: ISBN-13 identifier (unique, 13 digits)
- `publisher`: Publishing company name
- `published_date`: Publication date
- `page_count`: Number of pages (physical edition)
- `ebook_page_count`: Number of pages (ebook edition, may differ from physical)
- `language`: ISO 639-1 language code (default: 'en')
- `description`: Book synopsis/description
- `cover_url`: Book cover image URL
- `audio_length_seconds`: Audiobook duration in seconds (optional)
- `external_source`: Source of the book data (e.g., 'hardcover', 'google_books', 'openlibrary')
- `external_id`: ID from the external source (e.g., Hardcover edition ID)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Notes:**
- At least one ISBN (ISBN-10 or ISBN-13) is required
- Both ISBNs are unique to ensure specific editions
- `external_source` + `external_id` combination is unique (prevents duplicate imports)

---

### 3. authors

Stores author information.

```sql
CREATE TABLE authors (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    birth_date DATE,
    death_date DATE,
    photo_url VARCHAR(500),
    external_source VARCHAR(50),
    external_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT death_after_birth CHECK (death_date IS NULL OR birth_date IS NULL OR death_date > birth_date),
    UNIQUE(external_source, external_id)
);

CREATE INDEX idx_authors_name ON authors USING gin(to_tsvector('english', name));
CREATE INDEX idx_authors_external ON authors(external_source, external_id) WHERE external_source IS NOT NULL;
```

**Columns:**
- `id`: Unique author identifier (auto-incrementing BIGINT)
- `name`: Author's full name
- `bio`: Author biography
- `birth_date`: Date of birth
- `death_date`: Date of death (NULL if alive)
- `photo_url`: Author photo URL
- `external_source`: Source of the author data (e.g., 'hardcover', 'google_books')
- `external_id`: ID from the external source (e.g., Hardcover author ID)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

---

### 4. book_authors

Junction table for books and authors (many-to-many).

```sql
CREATE TABLE book_authors (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    author_id BIGINT NOT NULL REFERENCES authors(id) ON DELETE CASCADE,
    author_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, author_id),
    CONSTRAINT author_order_positive CHECK (author_order > 0)
);

CREATE INDEX idx_book_authors_author_id ON book_authors(author_id);
```

**Columns:**
- `book_id`: Reference to books table (BIGINT)
- `author_id`: Reference to authors table (BIGINT)
- `author_order`: Order of author listing (1 for primary author, 2+ for co-authors)
- `created_at`: Record creation timestamp

---

### 5. genres

Stores genre categories.

```sql
CREATE TABLE genres (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_genres_name ON genres(name);
```

**Columns:**
- `id`: Unique genre identifier (auto-incrementing BIGINT)
- `name`: Genre name (e.g., "Science Fiction", "Romance", "Classic")
- `description`: Genre description
- `created_at`: Record creation timestamp

---

### 6. book_genres

Junction table for books and genres (many-to-many).

```sql
CREATE TABLE book_genres (
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (book_id, genre_id)
);

CREATE INDEX idx_book_genres_genre_id ON book_genres(genre_id);
```

**Columns:**
- `book_id`: Reference to books table (BIGINT)
- `genre_id`: Reference to genres table (BIGINT)
- `created_at`: Record creation timestamp

---

### 7. user_books

Tracks user's reading status and progress for each book.

```sql
CREATE TYPE reading_status AS ENUM ('want-to-read', 'currently-reading', 'read', 'did-not-finish');

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
```

**Columns:**
- `id`: Unique record identifier (auto-incrementing BIGINT)
- `user_id`: Reference to users table (BIGINT)
- `book_id`: Reference to books table (BIGINT)
- `status`: Reading status (want-to-read, currently-reading, read, did-not-finish)
- `current_page`: Current page number for physical/ebook reading (default: 0)
- `current_seconds`: Current listening position in seconds for audiobooks (default: 0)
- `user_page_count`: User's edition page count (optional, overrides books.page_count for progress calculation)
- `user_audio_length_seconds`: User's audiobook length in seconds (optional, overrides books.audio_length_seconds)
- `personal_rating`: User's rating (1-5 stars, optional)
- `notes`: Personal notes about the book
- `started_at`: When user started reading
- `finished_at`: When user finished reading
- `dnf_date`: When user marked as did-not-finish (optional)
- `dnf_reason`: Why user did not finish the book (optional)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Notes:**
- Each user can only have one reading status per book (enforced by unique constraint)
- Progress is calculated from current_page/user_page_count or current_seconds/user_audio_length_seconds
- User-specific page/audio counts allow tracking different editions than the database default
- Personal rating is separate from public reviews
- DNF (did-not-finish) status preserves progress when stopped

---

### 8. reading_sessions

Tracks individual reading activities and sessions.

```sql
CREATE TYPE reading_method AS ENUM ('physical', 'ebook', 'audiobook');

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

CREATE INDEX idx_reading_sessions_user_id ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book_id ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_date ON reading_sessions(session_date DESC);
CREATE INDEX idx_reading_sessions_user_book ON reading_sessions(user_id, book_id);
CREATE INDEX idx_reading_sessions_method ON reading_sessions(reading_method);
```

**Columns:**
- `id`: Unique session identifier (auto-incrementing BIGINT)
- `user_id`: Reference to users table (BIGINT)
- `book_id`: Reference to books table (BIGINT)
- `pages_read`: Number of pages read in this session (required for physical/ebook, optional for audiobook)
- `minutes_read`: Time spent reading in minutes (required for audiobook, optional for physical/ebook)
- `reading_method`: Method used (physical, ebook, audiobook)
- `session_date`: Date of reading session (defaults to today)
- `start_page`: Starting page number (optional)
- `end_page`: Ending page number (optional)
- `notes`: Session notes or reflections (optional)
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp

**Notes:**
- Physical/ebook sessions require `pages_read`, audiobook sessions require `minutes_read`
- Users can optionally track both pages and time for any session
- Multiple sessions per day are allowed
- Reading method can vary per session (e.g., switching between physical and audiobook)

---

### 9. reviews

Stores public user reviews of books.

```sql
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id BIGINT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,

    UNIQUE(user_id, book_id),
    CONSTRAINT rating_range CHECK (rating >= 1 AND rating <= 5),
    CONSTRAINT content_length CHECK (length(content) >= 10)
);

CREATE INDEX idx_reviews_book_id ON reviews(book_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_user_id ON reviews(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_rating ON reviews(rating) WHERE deleted_at IS NULL;
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC) WHERE deleted_at IS NULL;
```

**Columns:**
- `id`: Unique review identifier (auto-incrementing BIGINT)
- `user_id`: Reference to users table (reviewer) (BIGINT)
- `book_id`: Reference to books table (BIGINT)
- `rating`: Rating (1-5 stars, required)
- `content`: Review text (minimum 10 characters)
- `created_at`: Review creation timestamp
- `updated_at`: Last edit timestamp
- `deleted_at`: Soft delete timestamp

**Notes:**
- One review per user per book
- Minimum 10 characters for content to ensure quality
- Soft deletes to preserve data integrity

---

### 10. lists

Stores user-created book lists and system-generated default lists.

```sql
CREATE TYPE list_type AS ENUM ('custom', 'currently-reading', 'to-be-read');

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
```

**Columns:**
- `id`: Unique list identifier (auto-incrementing BIGINT)
- `user_id`: Reference to users table (list owner) (BIGINT)
- `name`: List name (required)
- `description`: List description (optional)
- `is_public`: Whether list is publicly visible
- `is_default`: Whether this is a system-generated default list (cannot be deleted)
- `list_type`: Type of list (custom, currently-reading, to-be-read)
- `created_at`: List creation timestamp
- `updated_at`: Last update timestamp
- `deleted_at`: Soft delete timestamp

**Notes:**
- System-generated default lists (Currently Reading, To Be Read) are created automatically for new users
- Each user can have only one default list per list_type
- Default lists cannot be deleted but can be modified
- Custom lists can be created, edited, and deleted by users

---

### 11. list_books

Junction table for lists and books (many-to-many).

```sql
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
```

**Columns:**
- `list_id`: Reference to lists table (BIGINT)
- `book_id`: Reference to books table (BIGINT)
- `book_order`: Position of book in list (1, 2, 3, ...)
- `added_at`: When book was added to list

**Notes:**
- Users can order books within their lists
- Same book can appear in multiple lists

---

## Database Views

### book_statistics

Aggregated statistics for each book.

```sql
CREATE VIEW book_statistics AS
SELECT
    b.id AS book_id,
    b.title,
    COUNT(DISTINCT r.id) AS total_reviews,
    COALESCE(AVG(r.rating), 0)::NUMERIC(3,2) AS average_rating,
    COUNT(DISTINCT CASE WHEN ub.status = 'read' THEN ub.user_id END) AS total_reads,
    COUNT(DISTINCT CASE WHEN ub.status = 'currently-reading' THEN ub.user_id END) AS total_currently_reading,
    COUNT(DISTINCT CASE WHEN ub.status = 'want-to-read' THEN ub.user_id END) AS total_want_to_read
FROM books b
LEFT JOIN reviews r ON b.id = r.book_id AND r.deleted_at IS NULL
LEFT JOIN user_books ub ON b.id = ub.book_id
GROUP BY b.id, b.title;
```

### user_reading_stats

Aggregated reading statistics for each user.

```sql
CREATE VIEW user_reading_stats AS
SELECT
    u.id AS user_id,
    u.username,
    COUNT(DISTINCT CASE WHEN ub.status = 'read' THEN ub.book_id END) AS books_read,
    COUNT(DISTINCT CASE WHEN ub.status = 'currently-reading' THEN ub.book_id END) AS books_currently_reading,
    COUNT(DISTINCT CASE WHEN ub.status = 'want-to-read' THEN ub.book_id END) AS books_want_to_read,
    COUNT(DISTINCT r.id) AS total_reviews,
    COALESCE(SUM(b.page_count) FILTER (WHERE ub.status = 'read'), 0) AS total_pages_read
FROM users u
LEFT JOIN user_books ub ON u.id = ub.user_id
LEFT JOIN books b ON ub.book_id = b.id
LEFT JOIN reviews r ON u.id = r.user_id AND r.deleted_at IS NULL
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.username;
```

### user_book_progress

Provides easy access to reading progress with calculated percentages and session aggregations.

```sql
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
```

### user_reading_activity

Aggregated reading activity and statistics per user, including weekly metrics.

```sql
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
```

### audiobook_statistics

Statistics and metrics specifically for audiobooks.

```sql
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
```

---

## Entity Relationship Diagram

```
users (1) ----< (N) user_books (N) >---- (1) books
  |                                           |
  |                                           |
  |                                           |
(1)                                         (N)
  |                                           |
  v                                           v
reviews (N) >-------------------------- (1) books


users (1) ----< (N) reading_sessions (N) >---- (1) books


users (1) ----< (N) lists (1) ----< (N) list_books (N) >---- (1) books


books (N) >---- (N) book_authors (N) >---- (1) authors


books (N) >---- (N) book_genres (N) >---- (1) genres
```

---

## Sample Queries

### Get book details with authors and genres

```sql
SELECT
    b.*,
    ARRAY_AGG(DISTINCT a.name ORDER BY ba.author_order) AS authors,
    ARRAY_AGG(DISTINCT g.name) AS genres,
    bs.average_rating,
    bs.total_reviews
FROM books b
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
LEFT JOIN book_genres bg ON b.id = bg.book_id
LEFT JOIN genres g ON bg.genre_id = g.id
LEFT JOIN book_statistics bs ON b.id = bs.book_id
WHERE b.id = $1
GROUP BY b.id, bs.average_rating, bs.total_reviews;
```

### Get user's currently reading books with progress

```sql
SELECT
    b.id,
    b.title,
    b.cover_url,
    ARRAY_AGG(a.name ORDER BY ba.author_order) AS authors,
    ubp.progress_percentage,
    ubp.current_page,
    ubp.effective_page_count,
    ubp.last_session_date,
    ub.started_at
FROM user_books ub
JOIN books b ON ub.book_id = b.id
JOIN user_book_progress ubp ON ub.id = ubp.id
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
WHERE ub.user_id = $1 AND ub.status = 'currently-reading'
GROUP BY b.id, b.title, b.cover_url, ubp.progress_percentage, ubp.current_page,
         ubp.effective_page_count, ubp.last_session_date, ub.started_at
ORDER BY ub.started_at DESC;
```

### Get trending books (most read this month)

```sql
SELECT
    b.id,
    b.title,
    b.cover_url,
    ARRAY_AGG(DISTINCT a.name ORDER BY ba.author_order) AS authors,
    COUNT(DISTINCT ub.user_id) AS readers_this_month,
    bs.average_rating
FROM books b
JOIN user_books ub ON b.id = ub.book_id
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
LEFT JOIN book_statistics bs ON b.id = bs.book_id
WHERE ub.status = 'read'
  AND ub.finished_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY b.id, b.title, b.cover_url, bs.average_rating
ORDER BY readers_this_month DESC, bs.average_rating DESC
LIMIT 20;
```

### Get user's lists with book count

```sql
SELECT
    l.*,
    COUNT(DISTINCT lb.book_id) AS book_count,
    ARRAY_AGG(b.cover_url ORDER BY lb.book_order LIMIT 3) AS preview_covers
FROM lists l
LEFT JOIN list_books lb ON l.id = lb.list_id
LEFT JOIN books b ON lb.book_id = b.id
WHERE l.user_id = $1 AND l.deleted_at IS NULL
GROUP BY l.id
ORDER BY l.updated_at DESC;
```

### Get book reviews

```sql
SELECT
    r.*,
    u.username,
    u.avatar_url
FROM reviews r
JOIN users u ON r.user_id = u.id
WHERE r.book_id = $1 AND r.deleted_at IS NULL
ORDER BY r.created_at DESC
LIMIT 20;
```

### Get user's progress on a specific book

```sql
SELECT * FROM user_book_progress
WHERE user_id = $1 AND book_id = $2;
```

### Get reading sessions for a book

```sql
SELECT
    rs.*,
    b.title,
    b.cover_url
FROM reading_sessions rs
JOIN books b ON rs.book_id = b.id
WHERE rs.user_id = $1 AND rs.book_id = $2
ORDER BY rs.session_date DESC, rs.created_at DESC
LIMIT 50;
```

### Get user's reading activity stats

```sql
SELECT * FROM user_reading_activity
WHERE user_id = $1;
```

### Get recent reading sessions (activity feed)

```sql
SELECT
    rs.id,
    rs.session_date,
    rs.pages_read,
    rs.minutes_read,
    rs.reading_method,
    b.id AS book_id,
    b.title,
    b.cover_url,
    ARRAY_AGG(a.name ORDER BY ba.author_order) AS authors
FROM reading_sessions rs
JOIN books b ON rs.book_id = b.id
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
WHERE rs.user_id = $1
GROUP BY rs.id, rs.session_date, rs.pages_read, rs.minutes_read, rs.reading_method,
         b.id, b.title, b.cover_url
ORDER BY rs.session_date DESC, rs.created_at DESC
LIMIT 20;
```

### Get DNF (Did Not Finish) books with reasons

```sql
SELECT
    b.id,
    b.title,
    b.cover_url,
    ARRAY_AGG(DISTINCT a.name ORDER BY ba.author_order) AS authors,
    ub.current_page,
    ubp.progress_percentage,
    ub.dnf_date,
    ub.dnf_reason
FROM user_books ub
JOIN books b ON ub.book_id = b.id
JOIN user_book_progress ubp ON ub.id = ubp.id
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
WHERE ub.user_id = $1 AND ub.status = 'did-not-finish'
GROUP BY b.id, b.title, b.cover_url, ub.current_page, ubp.progress_percentage,
         ub.dnf_date, ub.dnf_reason
ORDER BY ub.dnf_date DESC;
```

### Get user's default lists (Currently Reading, TBR)

```sql
SELECT
    l.*,
    COUNT(DISTINCT lb.book_id) AS book_count
FROM lists l
LEFT JOIN list_books lb ON l.id = lb.list_id
WHERE l.user_id = $1 AND l.is_default = true
GROUP BY l.id
ORDER BY l.list_type;
```

### Get audiobook listening statistics

```sql
SELECT * FROM audiobook_statistics
WHERE book_id = $1;
```

---

## Indexes Strategy

**Performance Considerations:**
- Full-text search indexes on `books.title` and `authors.name` for search functionality
- Partial indexes with `WHERE deleted_at IS NULL` for soft-deleted records
- Composite indexes on foreign keys for efficient joins
- Descending indexes on `created_at` for recent-first queries

---

## Migration Notes

1. **Create ENUM types first** before creating tables that depend on them:
   - `reading_status` ENUM before `user_books` table
   - `reading_method` ENUM before `reading_sessions` table
   - `list_type` ENUM before `lists` table
2. **Run migrations in order**: users → books → authors → genres → user_books → reading_sessions → junction tables → reviews/lists
3. **Seed genres table** with common book genres
4. **Consider triggers** for auto-updating `updated_at` timestamps:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- (repeat for other tables)
```

5. **Auto-create default lists** for new users:

```sql
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

CREATE TRIGGER trigger_create_default_lists
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_lists_for_user();
```

---

## Future Considerations

### Phase 2: Social Features
- `friendships` table (user-to-user relationships)
- `follows` table (one-way following)
- `book_clubs` table
- `club_members` table
- `activity_feed` table

### Performance Optimizations
- Materialized views for expensive aggregations
- Read replicas for scaling
- Caching layer (Redis) for frequently accessed data
- Partitioning for large tables (reviews, user_books)

### Data Integrity
- Add foreign key constraints with appropriate `ON DELETE` actions
- Implement row-level security (RLS) for multi-tenant isolation
- Consider archived tables for deleted data retention
