# Hardcover Book Scraper

Continuously scrapes popular books from the Hardcover API and imports them into the Tome database.

## Overview

This scraper:
- ✅ Runs 24/7 as a systemd service
- ✅ Respects Hardcover API rate limits (60 requests/minute)
- ✅ Imports books, authors, and genres automatically
- ✅ Maps Hardcover data to our PostgreSQL schema
- ✅ Includes comprehensive error logging
- ✅ Supports graceful shutdown and resume
- ✅ Connects to Digital Ocean managed databases

## Quick Start (Docker)

### Prerequisites
- Docker and Docker Compose installed
- Digital Ocean managed PostgreSQL database
- Hardcover API token ([get one here](https://hardcover.app))

### Installation

1. **Copy files to your VM:**
   ```bash
   scp -r scraper/ user@your-vm-ip:/opt/tome/
   ```

2. **Configure credentials:**
   ```bash
   cd /opt/tome/scraper
   cp .env.example .env
   nano .env  # Add your database credentials and API token
   ```

3. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

4. **Run database migration:**
   ```bash
   psql "postgresql://user:pass@host:port/db?sslmode=require" \
     -f migrations/add_hardcover_tracking.sql
   ```

5. **Build and run:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```

6. **Verify it's running:**
   ```bash
   docker-compose logs -f
   # Or check local logs
   tail -f logs/hardcover_scraper.log
   ```

### Management

```bash
# Stop
docker-compose stop

# Start
docker-compose start

# Restart
docker-compose restart

# View logs
docker-compose logs -f

# Update
docker-compose down
docker-compose build
docker-compose up -d
```

## Files

- **`hardcover_scraper.py`** - Main scraper application
- **`requirements.txt`** - Python dependencies
- **`.env.example`** - Environment variables template
- **`hardcover-scraper.service`** - Systemd service configuration
- **`setup.sh`** - Automated setup script
- **`migrations/add_hardcover_tracking.sql`** - Database migration
- **`HARDCOVER_SCHEMA.md`** - Hardcover API schema reference

## Documentation

- **[Docker Deployment Guide](DOCKER_DEPLOYMENT.md)** - Docker-specific deployment instructions
- **[VM Deployment Guide](DEPLOYMENT.md)** - Complete VM setup instructions (systemd)
- **[Hardcover Schema](HARDCOVER_SCHEMA.md)** - API schema reference
- **[Database Schema](../DATABASE_SCHEMA.md)** - Our database schema

## How It Works

### Data Flow

1. **Fetch popular books** from Hardcover API (sorted by user count)
   - **Optimized**: Single GraphQL query fetches book + edition + authors + publisher in one request
   - **Old approach**: Would require 2 API calls per book (book query + edition query)
   - **Benefit**: 2x faster, uses half the API quota
2. **Import to database**:
   - Create or lookup authors
   - Create or lookup genres
   - Insert book (edition) with ISBNs
   - Link authors and genres
3. **Track progress** in `hardcover_*` tables
4. **Log everything** for monitoring

### Schema Mapping

| Hardcover | → | Our Database |
|-----------|---|--------------|
| Edition | → | Book (each book = specific edition) |
| Author | → | Author |
| Genre | → | Genre |
| Publisher | → | books.publisher (string, not separate table yet) |

### Rate Limiting

- Hardcover API: 60 requests/minute maximum
- Scraper: ~1 request/second (with buffer)
- Automatic delays between requests
- Graceful handling of rate limit errors

### Error Handling

All errors logged to:
- **Application log**: `/var/log/tome/hardcover_scraper.log`
- **Database table**: `scraper_errors`
- **Systemd journal**: `journalctl -u hardcover-scraper`

### Resume Capability

The scraper tracks:
- Which Hardcover books have been processed
- Which editions have been imported
- Current offset in the API results

If stopped and restarted, it continues from where it left off.

## Monitoring

### Check Status

```bash
# Service status
sudo systemctl status hardcover-scraper

# Live logs
tail -f /var/log/tome/hardcover_scraper.log

# Recent errors
sudo journalctl -u hardcover-scraper -p err -n 50
```

### Database Queries

```sql
-- View statistics
SELECT * FROM scraper_stats;

-- Recent runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10;

-- Recent errors
SELECT * FROM scraper_errors ORDER BY occurred_at DESC LIMIT 20;

-- Books imported today
SELECT COUNT(*) FROM hardcover_editions
WHERE imported_at >= CURRENT_DATE;

-- Top genres
SELECT g.name, COUNT(*) as book_count
FROM genres g
JOIN book_genres bg ON g.id = bg.genre_id
GROUP BY g.id, g.name
ORDER BY book_count DESC
LIMIT 20;
```

### Verify Import Quality

Run the verification script:

```bash
cd /opt/tome/scraper
source venv/bin/activate
python verify_import.py
```

## Configuration

Edit `/opt/tome/scraper/.env`:

```env
# Database (Digital Ocean)
DB_HOST=your-db.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=tomedb
DB_USER=doadmin
DB_PASSWORD=your_password

# Hardcover API
HARDCOVER_API_TOKEN=your_token

# Logging
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
LOG_FILE=/var/log/tome/hardcover_scraper.log
```

## Troubleshooting

### Scraper Won't Start

```bash
# Check logs
sudo journalctl -u hardcover-scraper -n 100

# Common fixes:
# 1. Verify .env file exists and has credentials
# 2. Test database connection manually
# 3. Check API token is valid (expires annually)
```

### No Books Importing

```bash
# Check if editions already exist
psql "..." -c "SELECT COUNT(*) FROM hardcover_editions;"

# Check for API errors
tail -n 100 /var/log/tome/hardcover_scraper.log | grep ERROR

# Verify API token
curl -H "Authorization: Bearer $TOKEN" \
  https://api.hardcover.app/v1/graphql \
  -d '{"query":"{ books(limit: 1) { id title } }"}'
```

### High Error Rate

```sql
-- Check error types
SELECT error_type, COUNT(*) FROM scraper_errors
WHERE occurred_at >= NOW() - INTERVAL '1 hour'
GROUP BY error_type;

-- Common issues:
-- - api_error: Check API token, rate limits
-- - database_error: Check DB connection, disk space
-- - validation_error: Data quality issues (expected)
```

## Maintenance

### Update Scraper Code

```bash
sudo systemctl stop hardcover-scraper
cd /opt/tome/scraper
git pull  # or copy new files
source venv/bin/activate
pip install -r requirements.txt --upgrade
sudo systemctl start hardcover-scraper
```

### Rotate API Token (Annual)

Hardcover tokens expire January 1st each year:

1. Generate new token at hardcover.app
2. Update `.env` file
3. Restart service: `sudo systemctl restart hardcover-scraper`

### Database Cleanup

```sql
-- Remove old error logs (keep 30 days)
DELETE FROM scraper_errors
WHERE occurred_at < NOW() - INTERVAL '30 days';

-- Remove old run logs (keep 90 days)
DELETE FROM scraper_runs
WHERE started_at < NOW() - INTERVAL '90 days';
```

## Performance

### Current Throughput

- **Rate**: ~3,600 API requests/hour (60/minute)
- **Books/hour**: ~50-100 (depending on editions per book)
- **Data/day**: ~1,200-2,400 books

### Scaling Options

If you need faster imports:
1. Request higher rate limit from Hardcover
2. Run multiple scrapers with different query filters
3. Use batch endpoints (if available in API)

## Security

- ✅ Runs as non-root user (`tome`)
- ✅ `.env` file protected (`chmod 600`)
- ✅ Database connections use SSL
- ✅ API token in environment variable
- ✅ Systemd security hardening enabled
- ✅ Logs rotated automatically

## License

See repository root for license information.

## Support

- **Hardcover API Docs**: https://hardcover.app/docs
- **Issues**: Check `/var/log/tome/hardcover_scraper.log`
- **Database**: Query `scraper_errors` table
