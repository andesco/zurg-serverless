-- Migration script to add new cache settings table structure
-- This adds a new table for key-value cache settings storage

CREATE TABLE IF NOT EXISTS cache_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cache_settings_key ON cache_settings(key);
