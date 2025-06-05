-- Add torrent_ids column to cache_metadata for new torrent detection
ALTER TABLE cache_metadata ADD COLUMN torrent_ids TEXT DEFAULT '[]';
