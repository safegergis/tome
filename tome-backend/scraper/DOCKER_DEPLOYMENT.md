# Docker Deployment Guide for Hardcover Scraper

Simple deployment guide for running the Hardcover scraper in Docker.

## Prerequisites

- Docker installed on your VM
- Docker Compose installed
- Digital Ocean managed PostgreSQL database
- Hardcover API token

## Quick Start

### 1. Copy Files to Your VM

```bash
# Copy the scraper directory to your VM
scp -r scraper/ user@your-vm-ip:/opt/tome/
```

### 2. Configure Environment

```bash
cd /opt/tome/scraper

# Copy example env file
cp .env.example .env

# Edit with your credentials
nano .env
```

Update with your actual values:
```env
DB_HOST=your-db.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=tomedb
DB_USER=doadmin
DB_PASSWORD=your_actual_password

HARDCOVER_API_TOKEN=your_actual_token

LOG_LEVEL=INFO
LOG_FILE=/app/logs/hardcover_scraper.log
```

### 3. Create Logs Directory

```bash
mkdir -p logs
chmod 755 logs
```

### 4. Run Database Migration

```bash
# Install PostgreSQL client if not already installed
sudo apt install postgresql-client

# Run migration
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require" \
  -f migrations/add_hardcover_tracking.sql
```

### 5. Build and Run

```bash
# Build the image
docker-compose build

# Start the scraper (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f
```

## Management Commands

### Check Status

```bash
# Check if container is running
docker-compose ps

# View live logs
docker-compose logs -f hardcover-scraper

# View last 100 lines
docker-compose logs --tail=100 hardcover-scraper
```

### Stop/Start/Restart

```bash
# Stop the scraper
docker-compose stop

# Start the scraper
docker-compose start

# Restart the scraper
docker-compose restart

# Stop and remove container
docker-compose down
```

### Update the Scraper

```bash
# Stop the container
docker-compose down

# Pull/update code
git pull  # or copy new files

# Rebuild and start
docker-compose build
docker-compose up -d
```

## Monitoring

### Check Logs

```bash
# Application logs (in container)
docker-compose exec hardcover-scraper cat /app/logs/hardcover_scraper.log

# Or view local logs directory (mounted volume)
tail -f logs/hardcover_scraper.log
```

### Check Database

```bash
# Connect to your database
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

# View stats
SELECT * FROM scraper_stats;

# Recent runs
SELECT * FROM scraper_runs ORDER BY started_at DESC LIMIT 5;

# Recent errors
SELECT * FROM scraper_errors ORDER BY occurred_at DESC LIMIT 20;

# Books imported today
SELECT COUNT(*) FROM hardcover_editions WHERE imported_at >= CURRENT_DATE;
```

### Health Check

```bash
# Check container health
docker inspect hardcover-scraper | grep -A 10 "Health"

# Manual health check
docker-compose exec hardcover-scraper pgrep -f hardcover_scraper.py
```

## Configuration

### Adjust Batch Size

Edit `hardcover_scraper.py` before building:

```python
self.books_per_batch = 100  # Default is 50
```

Then rebuild:
```bash
docker-compose build
docker-compose up -d
```

### Change Log Level

Update `.env`:
```env
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
```

Restart:
```bash
docker-compose restart
```

### Configure Auto-Restart

The `docker-compose.yml` already includes `restart: unless-stopped`, which means:
- Container restarts on failure
- Container restarts on system reboot
- Container stays stopped if you manually stop it

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs hardcover-scraper

# Common issues:
# 1. Missing .env file
# 2. Invalid database credentials
# 3. Port conflicts
```

### Database Connection Errors

```bash
# Test connection from host
psql "postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME?sslmode=require"

# If connection works from host but not container:
# - Check firewall rules
# - Verify container can reach external networks
# - Try: docker-compose exec hardcover-scraper ping 8.8.8.8
```

### Container Keeps Restarting

```bash
# Check logs for errors
docker-compose logs --tail=200 hardcover-scraper

# Check container status
docker-compose ps

# Reduce restart aggressiveness
# Edit docker-compose.yml, change:
# restart: "no"  # For debugging only
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker resources
docker system prune -a

# Check logs size
du -sh logs/
```

### API Rate Limiting

If you see rate limit errors in logs:

Edit `hardcover_scraper.py`:
```python
REQUESTS_PER_MINUTE = 30  # Reduce from 60
```

Rebuild and restart:
```bash
docker-compose build
docker-compose restart
```

## Performance Optimization

### Reduce Memory Usage

Edit `docker-compose.yml`:
```yaml
services:
  hardcover-scraper:
    # ... existing config ...
    mem_limit: 512m
    memswap_limit: 1g
```

### Faster Import Rate

In `hardcover_scraper.py`:
```python
# Increase batch size (uses more memory)
self.books_per_batch = 100

# Reduce delay between batches
time.sleep(1)  # Instead of 2
```

## Production Checklist

- [ ] `.env` file configured with correct credentials
- [ ] Database migration run successfully
- [ ] Logs directory created and writable
- [ ] Container running: `docker-compose ps`
- [ ] Logs showing imports: `docker-compose logs -f`
- [ ] Database has data: `SELECT COUNT(*) FROM books;`
- [ ] No errors in logs: `grep ERROR logs/hardcover_scraper.log`
- [ ] Firewall allows database connection
- [ ] Docker set to start on boot: `systemctl enable docker`
- [ ] Auto-restart enabled in `docker-compose.yml`

## Backup & Recovery

### Backup Configuration

```bash
# Backup your .env file (contains secrets!)
cp .env .env.backup
chmod 600 .env.backup

# Or use a secure location
sudo cp .env /root/tome-scraper-env.backup
```

### View Current State

```bash
# Check last processed offset
psql "..." -c "SELECT last_hardcover_book_id FROM scraper_runs WHERE status = 'running';"

# Books imported per day (last 7 days)
psql "..." -c "
SELECT DATE(imported_at) as date, COUNT(*) as books
FROM hardcover_editions
WHERE imported_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(imported_at)
ORDER BY date;
"
```

## Resource Requirements

### Minimum

- **CPU**: 1 core
- **RAM**: 512 MB
- **Disk**: 2 GB (includes logs, docker images)
- **Network**: Stable internet connection

### Recommended

- **CPU**: 2 cores
- **RAM**: 1 GB
- **Disk**: 5 GB
- **Network**: Low latency to database

## Logs Rotation

Setup log rotation for the mounted logs directory:

```bash
sudo nano /etc/logrotate.d/tome-scraper
```

Add:
```
/opt/tome/scraper/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    copytruncate
}
```

## Security

- ✅ Container runs as non-root user (UID 1000)
- ✅ `.env` file should have `chmod 600`
- ✅ Database uses SSL (`sslmode=require`)
- ✅ No ports exposed to host
- ✅ Logs mounted read/write only to necessary directory

## Benefits Over Systemd

- ✅ **Portable**: Same container runs anywhere
- ✅ **Isolated**: Dependencies self-contained
- ✅ **Easy updates**: Just rebuild image
- ✅ **Simple logs**: `docker-compose logs`
- ✅ **Resource limits**: Built-in memory/CPU limits
- ✅ **Health checks**: Built-in health monitoring

## Next Steps

After successful deployment:

1. Monitor for 24 hours to ensure stability
2. Check import rate meets expectations
3. Setup external monitoring (optional)
4. Configure alerting for errors (optional)
5. Schedule regular database backups

## Support

- **Docker logs**: `docker-compose logs -f`
- **Application logs**: `logs/hardcover_scraper.log`
- **Database errors**: Query `scraper_errors` table
- **Hardcover API docs**: https://hardcover.app/docs
