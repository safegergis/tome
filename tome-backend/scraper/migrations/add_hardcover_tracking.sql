-- Migration: Add Hardcover scraper tracking tables
-- Created: 2025-11-13
-- Updated: 2025-11-13 - Using external_source/external_id in main tables instead of separate mapping tables

-- This migration only creates scraper monitoring tables

-- Scraper run log
CREATE TABLE IF NOT EXISTS scraper_runs (
    id BIGSERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'running',  -- running, completed, failed, stopped
    books_processed INTEGER DEFAULT 0,
    editions_imported INTEGER DEFAULT 0,
    authors_imported INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    last_hardcover_book_id BIGINT,  -- For resuming
    notes TEXT
);

CREATE INDEX idx_scraper_runs_started_at ON scraper_runs(started_at DESC);
CREATE INDEX idx_scraper_runs_status ON scraper_runs(status);

-- Scraper error log
CREATE TABLE IF NOT EXISTS scraper_errors (
    id BIGSERIAL PRIMARY KEY,
    scraper_run_id BIGINT REFERENCES scraper_runs(id) ON DELETE SET NULL,
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_type VARCHAR(100),  -- api_error, database_error, validation_error, rate_limit
    hardcover_id BIGINT,
    hardcover_type VARCHAR(50),  -- book, edition, author
    error_message TEXT,
    stack_trace TEXT,
    retry_count INTEGER DEFAULT 0
);

CREATE INDEX idx_scraper_errors_occurred_at ON scraper_errors(occurred_at DESC);
CREATE INDEX idx_scraper_errors_error_type ON scraper_errors(error_type);
CREATE INDEX idx_scraper_errors_scraper_run_id ON scraper_errors(scraper_run_id);

-- No triggers needed for scraper tables (they are append-only)

-- View for scraper statistics
CREATE OR REPLACE VIEW scraper_stats AS
SELECT
    COUNT(*) as total_runs,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_runs,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
    COUNT(*) FILTER (WHERE status = 'running') as active_runs,
    SUM(books_processed) as total_books_processed,
    SUM(editions_imported) as total_editions_imported,
    SUM(authors_imported) as total_authors_imported,
    SUM(errors_count) as total_errors,
    MAX(started_at) as last_run_at
FROM scraper_runs;

COMMENT ON TABLE scraper_runs IS 'Logs each scraper execution for monitoring and recovery';
COMMENT ON TABLE scraper_errors IS 'Detailed error logging for debugging and monitoring';
COMMENT ON VIEW scraper_stats IS 'Aggregated statistics across all scraper runs';
