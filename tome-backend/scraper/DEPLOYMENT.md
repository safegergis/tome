# Hardcover Scraper Deployment Guide

This guide walks through deploying the Hardcover scraper to a virtual machine with a Digital Ocean managed database.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Server Setup](#server-setup)
- [Database Setup](#database-setup)
- [Application Setup](#application-setup)
- [Running the Scraper](#running-the-scraper)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Digital Ocean Managed PostgreSQL Database
- Create a managed PostgreSQL database cluster
- Note the connection details:
  - Host
  - Port (usually 25060 for managed DBs)
  - Database name
  - Username
  - Password

### 2. Hardcover API Token
- Sign up at [hardcover.app](https://hardcover.app)
- Generate an API token from your account settings
- **Important**: Tokens expire annually on January 1st

### 3. Virtual Machine
- Ubuntu 22.04 LTS (recommended)
- Minimum 1GB RAM, 1 CPU
- Python 3.10+

---

## Server Setup

### 1. Create User for the Scraper

```bash
# SSH into your VM
ssh root@your-vm-ip

# Create a dedicated user
sudo useradd -m -s /bin/bash tome
sudo usermod -aG sudo tome

# Create necessary directories
sudo mkdir -p /opt/tome/scraper
sudo mkdir -p /var/log/tome
sudo chown -R tome:tome /opt/tome
sudo chown -R tome:tome /var/log/tome
```

### 2. Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install -y python3 python3-pip python3-venv git postgresql-client

# Install system libraries for psycopg2
sudo apt install -y libpq-dev build-essential
```

### 3. Setup Application Directory

```bash
# Switch to tome user
su - tome

# Create application directory
cd /opt/tome/scraper

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Verify Python version
python --version  # Should be 3.10+
```

---

## Database Setup

### 1. Connect to Digital Ocean Database

```bash
# Test connection (replace with your credentials)
psql "postgresql://username:password@host:port/database?sslmode=require"
```

### 2. Run Migrations

```bash
# Download the migration file to your VM
cd /opt/tome/scraper

# Run the migration
psql "postgresql://username:password@host:port/database?sslmode=require" \
  -f migrations/add_hardcover_tracking.sql

# Verify tables were created
psql "postgresql://username:password@host:port/database?sslmode=require" \
  -c "\dt hardcover*"

# You should see:
# - hardcover_authors
# - hardcover_books
# - hardcover_editions
# - scraper_runs
# - scraper_errors
```

### 3. Verify Existing Schema

Ensure your database has the base tables from `DATABASE_SCHEMA.md`:
- users
- books
- authors
- genres
- book_authors
- book_genres
- user_books
- reviews
- lists
- list_books

---

## Application Setup

### 1. Upload Scraper Files

```bash
# On your local machine, copy files to the server
scp hardcover_scraper.py tome@your-vm-ip:/opt/tome/scraper/
scp requirements.txt tome@your-vm-ip:/opt/tome/scraper/
scp .env.example tome@your-vm-ip:/opt/tome/scraper/
scp hardcover-scraper.service tome@your-vm-ip:/opt/tome/scraper/

# Or clone from git if you've committed them
cd /opt/tome/scraper
git clone your-repo-url .
```

### 2. Install Python Dependencies

```bash
# Make sure virtual environment is activated
source /opt/tome/scraper/venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Verify installations
pip list
```

### 3. Configure Environment Variables

```bash
cd /opt/tome/scraper

# Copy example env file
cp .env.example .env

# Edit with your actual credentials
nano .env
```

Update `.env` with your actual values:
```env
DB_HOST=your-db-host.db.ondigitalocean.com
DB_NAME=tomedb
DB_USER=doadmin
DB_PASSWORD=your_actual_password
DB_PORT=25060

HARDCOVER_API_TOKEN=your_actual_token

LOG_LEVEL=INFO
LOG_FILE=/var/log/tome/hardcover_scraper.log
```

**Important**: Ensure `.env` has proper permissions:
```bash
chmod 600 .env
```

### 4. Test the Scraper Manually

```bash
# Run scraper in foreground to test
cd /opt/tome/scraper
source venv/bin/activate
python hardcover_scraper.py

# You should see log output like:
# 2025-11-13 10:00:00 - HardcoverScraper - INFO - Starting Hardcover scraper...
# 2025-11-13 10:00:00 - HardcoverScraper - INFO - Database connected successfully
# ...

# Stop with Ctrl+C to verify graceful shutdown
```

---

## Running the Scraper

### 1. Install as Systemd Service

```bash
# Copy service file to systemd directory
sudo cp /opt/tome/scraper/hardcover-scraper.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable hardcover-scraper

# Start the service
sudo systemctl start hardcover-scraper
```

### 2. Verify Service is Running

```bash
# Check service status
sudo systemctl status hardcover-scraper

# Should show:
# ● hardcover-scraper.service - Hardcover Book Scraper
#    Loaded: loaded (/etc/systemd/system/hardcover-scraper.service; enabled)
#    Active: active (running) since ...

# View live logs
sudo journalctl -u hardcover-scraper -f

# Or check the log file
tail -f /var/log/tome/hardcover_scraper.log
```

### 3. Service Management Commands

```bash
# Stop the scraper
sudo systemctl stop hardcover-scraper

# Restart the scraper
sudo systemctl restart hardcover-scraper

# View recent logs
sudo journalctl -u hardcover-scraper -n 100

# View logs since boot
sudo journalctl -u hardcover-scraper -b
```

---

## Monitoring

### 1. Check Scraper Statistics

Connect to your database and run:

```sql
-- View scraper statistics
SELECT * FROM scraper_stats;

-- View recent runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 10;

-- View recent errors
SELECT * FROM scraper_errors ORDER BY occurred_at DESC LIMIT 20;

-- Check how many books imported
SELECT COUNT(*) as total_books FROM books;
SELECT COUNT(*) as total_authors FROM authors;
SELECT COUNT(*) as total_genres FROM genres;

-- View recent imports
SELECT
    b.title,
    a.name as author,
    he.imported_at
FROM books b
JOIN hardcover_editions he ON b.id = he.book_id
LEFT JOIN book_authors ba ON b.id = ba.book_id
LEFT JOIN authors a ON ba.author_id = a.id
ORDER BY he.imported_at DESC
LIMIT 20;
```

### 2. Log Rotation

Setup log rotation to prevent disk space issues:

```bash
sudo nano /etc/logrotate.d/tome-scraper
```

Add:
```
/var/log/tome/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0640 tome tome
    sharedscripts
    postrotate
        systemctl reload hardcover-scraper > /dev/null 2>&1 || true
    endscript
}
```

### 3. Setup Monitoring Alerts (Optional)

Consider setting up:
- Digital Ocean monitoring for CPU/memory
- Database monitoring for connection count
- Error rate alerts from `scraper_errors` table
- Uptime monitoring (e.g., UptimeRobot, Pingdom)

---

## Troubleshooting

### Service Won't Start

```bash
# Check service status
sudo systemctl status hardcover-scraper

# Check logs
sudo journalctl -u hardcover-scraper -n 50

# Common issues:
# 1. Wrong Python path - verify in service file
# 2. Missing .env file - check it exists and has correct permissions
# 3. Database connection - test with psql manually
```

### Database Connection Errors

```bash
# Test database connectivity
psql "postgresql://user:pass@host:port/db?sslmode=require"

# If connection fails:
# 1. Check firewall rules in Digital Ocean
# 2. Verify database is running
# 3. Check credentials in .env file
# 4. Ensure sslmode=require for managed databases
```

### API Rate Limiting

The scraper is configured for 60 requests/minute. If you see rate limit errors:

```python
# Edit hardcover_scraper.py and reduce REQUESTS_PER_MINUTE
REQUESTS_PER_MINUTE = 30  # Half the rate
```

### Out of Memory

If the VM runs out of memory:

```bash
# Check memory usage
free -h

# Check scraper process
ps aux | grep hardcover

# Consider:
# 1. Upgrade VM to 2GB RAM
# 2. Reduce batch size in scraper
# 3. Add swap space
```

### No Books Being Imported

```bash
# Check if scraper is running
sudo systemctl status hardcover-scraper

# Check logs for errors
tail -n 100 /var/log/tome/hardcover_scraper.log

# Verify API token is valid
# (tokens expire annually on Jan 1st)

# Check database for recent activity
psql "..." -c "SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5;"
```

### Scraper Keeps Crashing

```bash
# Check for repeated errors
sudo journalctl -u hardcover-scraper -p err

# Increase restart delay in service file
sudo nano /etc/systemd/system/hardcover-scraper.service

# Change:
RestartSec=60  # Wait 60 seconds before restart

sudo systemctl daemon-reload
sudo systemctl restart hardcover-scraper
```

---

## Maintenance

### Updating the Scraper

```bash
# Stop the service
sudo systemctl stop hardcover-scraper

# Update code
cd /opt/tome/scraper
git pull  # or copy new files

# Update dependencies
source venv/bin/activate
pip install -r requirements.txt --upgrade

# Restart service
sudo systemctl start hardcover-scraper
```

### Backup Database

```bash
# Backup database (Digital Ocean has automated backups, but you can also do manual)
pg_dump "postgresql://user:pass@host:port/db?sslmode=require" \
  -f tome_backup_$(date +%Y%m%d).sql

# Compress
gzip tome_backup_*.sql
```

### Reset Scraper State

If you need to start over:

```sql
-- Clear all Hardcover mappings (doesn't delete books/authors)
TRUNCATE hardcover_authors, hardcover_editions, hardcover_books CASCADE;

-- Clear scraper logs
TRUNCATE scraper_runs, scraper_errors CASCADE;

-- If you want to completely start over (WARNING: deletes all data)
-- TRUNCATE books, authors, genres CASCADE;
```

---

## Performance Tuning

### Increase Batch Size

For faster imports (if API allows):

```python
# Edit hardcover_scraper.py
self.books_per_batch = 100  # Default is 50
```

### Database Indexing

Ensure all indexes from the migration are created:

```sql
-- Check indexes
\di hardcover*

-- Recreate if missing
CREATE INDEX IF NOT EXISTS idx_hardcover_editions_book_id
ON hardcover_editions(book_id);
```

---

## Security Checklist

- [ ] `.env` file has `chmod 600` permissions
- [ ] Service runs as non-root user (`tome`)
- [ ] Database uses SSL connections (`sslmode=require`)
- [ ] Firewall configured (only necessary ports open)
- [ ] API token rotated annually
- [ ] Regular database backups enabled
- [ ] Log rotation configured
- [ ] Monitoring/alerts setup

---

## Support

For issues:
1. Check logs: `/var/log/tome/hardcover_scraper.log`
2. Check database: `scraper_errors` table
3. Check service: `sudo systemctl status hardcover-scraper`
4. Review Hardcover API docs: https://hardcover.app/docs
