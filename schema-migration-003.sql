-- Add cache_timestamp column to torrents table for tracking individual torrent cache timing
-- This enables the new on-demand caching system introduced in 2025-06-06

ALTER TABLE torrents ADD COLUMN cache_timestamp INTEGER;

-- Create index for cache_timestamp for better query performance
CREATE INDEX IF NOT EXISTS idx_torrents_cache_timestamp ON torrents(cache_timestamp);
