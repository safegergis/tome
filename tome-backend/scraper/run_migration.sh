#!/bin/bash
# Database Migration Runner for Hardcover Scraper
# This script safely runs the migration on your database

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=================================="
echo "Hardcover Scraper Migration"
echo "=================================="
echo ""

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}Loaded environment variables from .env${NC}"
else
    echo -e "${YELLOW}Warning: .env file not found, using environment variables${NC}"
fi

# Check if required env vars are set
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}ERROR: Missing required environment variables${NC}"
    echo "Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, DB_PORT"
    echo ""
    echo "Either:"
    echo "  1. Create a .env file with these variables, or"
    echo "  2. Set them in your environment before running this script"
    exit 1
fi

# Set default port if not specified
DB_PORT=${DB_PORT:-5432}

# Construct connection string
CONN_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require"

echo ""
echo "Database Details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Test connection
echo -e "${GREEN}Testing database connection...${NC}"
if psql "$CONN_STRING" -c "SELECT version();" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Connection successful${NC}"
else
    echo -e "${RED}✗ Connection failed${NC}"
    echo "Please check your credentials and database connectivity"
    exit 1
fi

echo ""
echo -e "${YELLOW}This will create the following tables:${NC}"
echo "  - hardcover_authors"
echo "  - hardcover_editions"
echo "  - hardcover_books"
echo "  - scraper_runs"
echo "  - scraper_errors"
echo ""

read -p "Continue with migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
fi

echo ""
echo -e "${GREEN}Running migration...${NC}"

# Check if migration file exists
MIGRATION_FILE="migrations/add_hardcover_tracking.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}ERROR: Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

# Run the migration
if psql "$CONN_STRING" -f "$MIGRATION_FILE"; then
    echo ""
    echo -e "${GREEN}✓ Migration completed successfully${NC}"
    echo ""
    echo "Verifying tables..."

    # Verify tables were created
    psql "$CONN_STRING" -c "\dt hardcover*" -c "\dt scraper*"

    echo ""
    echo -e "${GREEN}Migration complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify the tables above were created"
    echo "  2. Test the scraper: python hardcover_scraper.py"
    echo "  3. Install as service if test succeeds"
else
    echo ""
    echo -e "${RED}✗ Migration failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi
