# Hardcover Scraper Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app
RUN mkdir -p /app/logs/

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY hardcover_scraper.py .

# Create non-root user for security
RUN useradd -m -u 1000 scraper && \
    chown -R scraper:scraper /app

# Switch to non-root user
USER scraper

# Run the scraper
CMD ["python", "-u", "hardcover_scraper.py"]
