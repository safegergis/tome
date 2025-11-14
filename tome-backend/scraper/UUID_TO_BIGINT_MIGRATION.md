# UUID to BIGINT Migration Guide

## Overview

All database IDs have been changed from UUID to auto-incrementing BIGINT for better performance and simplicity.

## Changes Summary

### Database Schema Changes

#### Primary Keys Changed from UUID to BIGSERIAL

**Before:**
```sql
id UUID PRIMARY KEY DEFAULT gen_random_uuid()
```

**After:**
```sql
id BIGSERIAL PRIMARY KEY
```

#### Foreign Keys Changed from UUID to BIGINT

**Before:**
```sql
user_id UUID NOT NULL REFERENCES users(id)
```

**After:**
```sql
user_id BIGINT NOT NULL REFERENCES users(id)
```

### Tables Updated

All tables now use BIGINT auto-incrementing IDs:

1. **users** - `id BIGSERIAL PRIMARY KEY`
2. **books** - `id BIGSERIAL PRIMARY KEY`
3. **authors** - `id BIGSERIAL PRIMARY KEY`
4. **genres** - `id BIGSERIAL PRIMARY KEY`
5. **user_books** - `id BIGSERIAL PRIMARY KEY` + foreign keys
6. **reviews** - `id BIGSERIAL PRIMARY KEY` + foreign keys
7. **lists** - `id BIGSERIAL PRIMARY KEY` + foreign keys
8. **list_books** - foreign keys only
9. **book_authors** - foreign keys only
10. **book_genres** - foreign keys only

### Hardcover Tracking Tables

Scraper tracking tables also updated:

1. **hardcover_authors**
   - `author_id` changed from `UUID` to `BIGINT`

2. **hardcover_editions**
   - `book_id` changed from `UUID` to `BIGINT`

3. **scraper_runs**
   - `id` changed from `UUID` to `BIGSERIAL`

4. **scraper_errors**
   - `id` changed from `UUID` to `BIGSERIAL`
   - `scraper_run_id` changed from `UUID` to `BIGINT`

### Code Changes

#### Python Type Hints Updated

**hardcover_scraper.py:**
```python
# Before
def get_or_create_author(...) -> Optional[str]:  # UUID as string
def get_or_create_genre(...) -> Optional[str]:   # UUID as string
def start_scraper_run() -> str:                   # UUID as string

# After
def get_or_create_author(...) -> Optional[int]:  # BIGINT
def get_or_create_genre(...) -> Optional[int]:   # BIGINT
def start_scraper_run() -> int:                   # BIGINT
```

## Benefits of BIGINT over UUID

### Performance
- **Smaller index size**: 8 bytes vs 16 bytes
- **Faster joins**: Integer comparison is faster than UUID comparison
- **Better caching**: More IDs fit in memory/cache

### Simplicity
- **Human readable**: `123` vs `550e8400-e29b-41d4-a716-446655440000`
- **Easier debugging**: Can reference IDs in conversations
- **URL friendly**: `/books/123` vs `/books/550e8400-e29b-41d4-a716-446655440000`

### Database Efficiency
- **Sequential**: Auto-incrementing reduces index fragmentation
- **Clustered index**: Better for range queries
- **No extension needed**: No need for pgcrypto extension

## Migration Path

### For New Deployments

Simply run the updated schema and migration files:

```bash
# 1. Run main schema (creates tables with BIGSERIAL)
psql "connection_string" -f path/to/schema.sql

# 2. Run Hardcover tracking migration
psql "connection_string" -f tome-backend/scraper/migrations/add_hardcover_tracking.sql
```

### For Existing Deployments (If Applicable)

⚠️ **Warning**: This is a breaking change for existing databases with UUID data.

If you have an existing database with UUIDs, you would need to:

1. **Backup your data**
```bash
pg_dump "connection_string" > backup.sql
```

2. **Create migration script** to:
   - Create new tables with BIGSERIAL
   - Copy data with new sequential IDs
   - Update foreign key relationships
   - Drop old tables
   - Rename new tables

3. **Test thoroughly** in staging environment first

**Recommendation**: Since this is MVP phase, consider starting fresh if possible.

## Removed Dependencies

### PostgreSQL Extensions

**No longer needed:**
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- Not needed anymore
```

The pgcrypto extension was only used for `gen_random_uuid()`. With BIGSERIAL, PostgreSQL handles ID generation natively.

## Files Updated

### Documentation
- ✅ `DATABASE_SCHEMA.md` - All tables updated to BIGSERIAL

### Migrations
- ✅ `tome-backend/scraper/migrations/add_hardcover_tracking.sql` - Tracking tables updated

### Code
- ✅ `tome-backend/scraper/hardcover_scraper.py` - Type hints updated

## Validation Checklist

After migration, verify:

- [ ] Tables created with `BIGSERIAL PRIMARY KEY`
- [ ] Auto-increment working (insert without specifying ID)
- [ ] Foreign keys reference BIGINT columns
- [ ] Indexes created on BIGINT columns
- [ ] Scraper can insert and retrieve records
- [ ] IDs are sequential integers (1, 2, 3, ...)
- [ ] No UUID-related errors in logs

## Example Queries

### Check Table Structure
```sql
-- Verify books table has BIGSERIAL
\d books

-- Should show:
-- id | bigint | not null default nextval('books_id_seq'::regclass)
```

### Insert Test
```sql
-- Insert without specifying ID
INSERT INTO genres (name, created_at)
VALUES ('Test Genre', NOW())
RETURNING id;

-- Should return sequential integer like: 1, 2, 3...
```

### Check Sequences
```sql
-- List all sequences
\ds

-- Should see sequences like:
-- books_id_seq
-- authors_id_seq
-- genres_id_seq
-- users_id_seq
```

## Rollback (If Needed)

If you need to rollback to UUIDs:

1. Stop the scraper
2. Drop Hardcover tracking tables
3. Restore from backup (if existing deployment)
4. Revert code changes in git

```bash
# Revert code
git checkout HEAD~1 -- DATABASE_SCHEMA.md
git checkout HEAD~1 -- tome-backend/scraper/migrations/add_hardcover_tracking.sql
git checkout HEAD~1 -- tome-backend/scraper/hardcover_scraper.py
```

## Notes

- **ID Gaps**: Auto-increment can have gaps (normal behavior)
- **Max Value**: BIGINT max is 9,223,372,036,854,775,807 (plenty for our use case)
- **Starting Value**: Sequences start at 1 by default
- **Thread Safety**: BIGSERIAL is thread-safe and handles concurrent inserts

## Support

If you encounter issues:
1. Check PostgreSQL logs for errors
2. Verify table structure with `\d table_name`
3. Test INSERT operations manually
4. Check scraper logs for type errors
