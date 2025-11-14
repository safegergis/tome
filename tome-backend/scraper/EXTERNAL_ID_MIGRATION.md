# External ID Migration - Simplified Architecture

## Overview

Migrated from separate tracking tables (`hardcover_authors`, `hardcover_editions`) to using `external_source` and `external_id` columns directly in the `authors` and `books` tables.

## What Changed

### Before: Separate Tracking Tables

**Schema:**
```sql
-- Main tables
books (id, title, isbn_10, ...)
authors (id, name, bio, ...)

-- Separate tracking tables
hardcover_authors (hardcover_id, author_id, imported_at, ...)
hardcover_editions (hardcover_id, book_id, hardcover_book_id, ...)
```

**To check if imported:**
```sql
-- Required JOIN
SELECT b.* FROM books b
JOIN hardcover_editions he ON b.id = he.book_id
WHERE he.hardcover_id = 12345
```

### After: Embedded External IDs

**Schema:**
```sql
books (
    id,
    title,
    isbn_10,
    ...,
    external_source VARCHAR(50),     -- NEW: 'hardcover', 'google_books', etc.
    external_id VARCHAR(100),        -- NEW: ID from that source
    UNIQUE(external_source, external_id)
)

authors (
    id,
    name,
    bio,
    ...,
    external_source VARCHAR(50),     -- NEW
    external_id VARCHAR(100),        -- NEW
    UNIQUE(external_source, external_id)
)
```

**To check if imported:**
```sql
-- Direct lookup, no JOIN
SELECT * FROM books
WHERE external_source = 'hardcover' AND external_id = '12345'
```

## Benefits

### 1. Simpler Schema
- ✅ 2 fewer tables to manage
- ✅ Clearer data model
- ✅ Less complex migrations

### 2. Better Performance
- ✅ No JOINs needed to check if imported
- ✅ Single index lookup: `(external_source, external_id)`
- ✅ Faster queries

### 3. Easier Queries
```sql
-- Before (with tracking tables)
SELECT b.*, a.name
FROM books b
JOIN hardcover_editions he ON b.id = he.book_id
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
JOIN hardcover_authors ha ON a.id = ha.author_id
WHERE he.hardcover_id = 12345

-- After (with external_id)
SELECT b.*, a.name
FROM books b
JOIN book_authors ba ON b.id = ba.book_id
JOIN authors a ON ba.author_id = a.id
WHERE b.external_source = 'hardcover' AND b.external_id = '12345'
```

### 4. Multi-Source Ready
Can easily add books/authors from other sources:
```sql
-- Hardcover book
external_source = 'hardcover', external_id = '4675245'

-- Google Books
external_source = 'google_books', external_id = 'sF3aAAAAMAAJ'

-- Open Library
external_source = 'openlibrary', external_id = 'OL7353617M'
```

### 5. Application Code Simpler
```python
# Before: 2 queries + tracking table insert
author_id = create_author(...)
insert_into_hardcover_authors(hardcover_id, author_id)

# After: 1 query with external_id
author_id = create_author(..., external_source='hardcover', external_id=123)
```

## What Remains

### Scraper Monitoring Tables (Kept)

We still have these for logging/monitoring:

1. **scraper_runs** - Track each scraper execution
   - When started/ended
   - How many books processed
   - Status (running/completed/failed)

2. **scraper_errors** - Detailed error logs
   - What went wrong
   - When it happened
   - Which external ID failed

These are **separate concerns** (monitoring vs. data tracking) so they remain.

## Migration Steps

### 1. Update Main Tables

Add columns to books and authors:
```sql
ALTER TABLE books
ADD COLUMN external_source VARCHAR(50),
ADD COLUMN external_id VARCHAR(100),
ADD CONSTRAINT unique_external_book UNIQUE(external_source, external_id);

CREATE INDEX idx_books_external ON books(external_source, external_id)
WHERE external_source IS NOT NULL;

ALTER TABLE authors
ADD COLUMN external_source VARCHAR(50),
ADD COLUMN external_id VARCHAR(100),
ADD CONSTRAINT unique_external_author UNIQUE(external_source, external_id);

CREATE INDEX idx_authors_external ON authors(external_source, external_id)
WHERE external_source IS NOT NULL;
```

### 2. Drop Old Tracking Tables (If Exists)

```sql
DROP TABLE IF EXISTS hardcover_editions CASCADE;
DROP TABLE IF EXISTS hardcover_authors CASCADE;
DROP TABLE IF EXISTS hardcover_books CASCADE;
```

### 3. Update Scraper Code

**Changed functions:**
- `get_or_create_author()` - Now checks/sets external_source and external_id
- `book_exists()` - Now checks books.external_id instead of hardcover_editions table
- `import_edition()` - Sets external_source and external_id on INSERT

## Updated Migration File

The new `add_hardcover_tracking.sql` now only creates:
- ✅ `scraper_runs` - Monitoring
- ✅ `scraper_errors` - Error logging
- ✅ `scraper_stats` view - Aggregated statistics

**Removed:**
- ❌ `hardcover_authors` - No longer needed
- ❌ `hardcover_editions` - No longer needed
- ❌ `hardcover_books` - No longer needed

## Code Changes

### Python Type Hints
No change needed - still returns `int` (author/book ID)

### Database Queries

**Before:**
```python
# Check if author exists
cursor.execute("""
    SELECT author_id FROM hardcover_authors
    WHERE hardcover_id = %s
""", (hardcover_id,))

# Insert tracking
cursor.execute("""
    INSERT INTO hardcover_authors (hardcover_id, author_id)
    VALUES (%s, %s)
""", (hardcover_id, author_id))
```

**After:**
```python
# Check if author exists (single query)
cursor.execute("""
    SELECT id FROM authors
    WHERE external_source = 'hardcover' AND external_id = %s
""", (str(hardcover_id),))

# Insert with external_id (single query)
cursor.execute("""
    INSERT INTO authors (name, bio, external_source, external_id, ...)
    VALUES (%s, %s, 'hardcover', %s, ...)
""", (name, bio, str(hardcover_id), ...))
```

## Validation

After migration, verify:

```sql
-- Check books have external IDs
SELECT COUNT(*) FROM books WHERE external_source = 'hardcover';

-- Check authors have external IDs
SELECT COUNT(*) FROM authors WHERE external_source = 'hardcover';

-- Check UNIQUE constraint works
INSERT INTO books (title, isbn_10, isbn_13, external_source, external_id)
VALUES ('Test', '1234567890', '1234567890123', 'hardcover', '999');
-- Try duplicate:
INSERT INTO books (title, isbn_10, isbn_13, external_source, external_id)
VALUES ('Test2', '0987654321', '9876543210987', 'hardcover', '999');
-- Should fail: ERROR: duplicate key value violates unique constraint
```

## Rollback (If Needed)

To rollback to separate tracking tables:

1. Stop the scraper
2. Re-create tracking tables
3. Migrate data:
```sql
-- Recreate tracking tables
CREATE TABLE hardcover_authors (
    hardcover_id BIGINT PRIMARY KEY,
    author_id BIGINT NOT NULL REFERENCES authors(id),
    ...
);

-- Migrate existing data
INSERT INTO hardcover_authors (hardcover_id, author_id, imported_at)
SELECT external_id::bigint, id, created_at
FROM authors
WHERE external_source = 'hardcover';

-- Remove columns
ALTER TABLE authors DROP COLUMN external_source;
ALTER TABLE authors DROP COLUMN external_id;
```

## Example Queries

### Find book by Hardcover ID
```sql
SELECT * FROM books
WHERE external_source = 'hardcover' AND external_id = '4675245';
```

### Find all Hardcover books
```sql
SELECT COUNT(*) FROM books WHERE external_source = 'hardcover';
```

### Find books with multiple sources (future)
```sql
-- If we ever import same book from multiple sources
SELECT title, external_source, external_id
FROM books
WHERE isbn_13 = '9780241430972'
ORDER BY external_source;
```

### Check import status
```sql
-- See which sources we're importing from
SELECT external_source, COUNT(*) as book_count
FROM books
WHERE external_source IS NOT NULL
GROUP BY external_source;

-- Output:
-- hardcover | 5000
-- google_books | 0  (future)
```

## Impact on Scraper

### Before
```python
def book_exists(hardcover_edition_id):
    cursor.execute("""
        SELECT 1 FROM hardcover_editions
        WHERE hardcover_id = %s
    """, (hardcover_edition_id,))
    return cursor.fetchone() is not None
```

### After
```python
def book_exists(hardcover_edition_id):
    cursor.execute("""
        SELECT 1 FROM books
        WHERE external_source = 'hardcover' AND external_id = %s
    """, (str(hardcover_edition_id),))
    return cursor.fetchone() is not None
```

**Result:** Simpler, faster, cleaner! ✨

## Files Updated

- ✅ `DATABASE_SCHEMA.md` - Added external_source/external_id to books and authors
- ✅ `migrations/add_hardcover_tracking.sql` - Removed tracking tables, kept monitoring tables
- ✅ `hardcover_scraper.py` - Updated to use external_id columns
- ✅ `EXTERNAL_ID_MIGRATION.md` - This document

## Questions?

**Q: Can we have books from multiple sources?**
A: No, each book can only have ONE external source (enforced by UNIQUE constraint). But different books can come from different sources.

**Q: What if we want to track multiple sources per book?**
A: You'd need a junction table like `book_external_ids`. But for MVP, one source per book is simpler.

**Q: How do we handle updates from external sources?**
A: Query by external_source + external_id, then UPDATE the book record.

**Q: Can we still use ISBNs to deduplicate?**
A: Yes! ISBNs are still UNIQUE. This prevents importing the same edition twice even from different sources.
