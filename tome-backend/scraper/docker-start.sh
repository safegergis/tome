#!/bin/bash
# Quick start script for Docker deployment

set -e

echo "======================================"
echo "Hardcover Scraper - Docker Quick Start"
echo "======================================"
echo ""

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Install with: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: Docker Compose is not installed"
    echo "Install with: sudo apt install docker-compose"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "WARNING: .env file not found"
    echo "Creating from template..."
    cp .env.example .env
    echo ""
    echo "Please edit .env with your credentials:"
    echo "  nano .env"
    echo ""
    read -p "Press Enter after editing .env..."
fi

# Create logs directory
echo "Creating logs directory..."
mkdir -p logs
chmod 755 logs

# Check if migration needs to be run
echo ""
echo "Have you run the database migration?"
echo "If not, run:"
echo "  psql 'postgresql://user:pass@host:port/db?sslmode=require' -f migrations/add_hardcover_tracking.sql"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

# Build and start
echo ""
echo "Building Docker image..."
docker-compose build

echo ""
echo "Starting scraper..."
docker-compose up -d

echo ""
echo "✓ Scraper started!"
echo ""
echo "Check status:"
echo "  docker-compose ps"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo "  tail -f logs/hardcover_scraper.log"
echo ""
echo "Manage:"
echo "  docker-compose stop    # Stop"
echo "  docker-compose start   # Start"
echo "  docker-compose restart # Restart"
echo ""
