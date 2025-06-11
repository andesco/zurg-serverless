-- D1 Database Schema for Zurg Serverless
-- Migrated from Cloudflare KV to D1

-- Cache metadata table
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY,
    last_refresh INTEGER NOT NULL,
    library_checksum TEXT NOT NULL,
    torrent_ids TEXT DEFAULT '[]',
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Torrents table
CREATE TABLE IF NOT EXISTS torrents (
    access_key TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    hash TEXT NOT NULL,
    added TEXT NOT NULL,
    ended TEXT,
    selected_files TEXT NOT NULL, -- JSON string
    downloaded_ids TEXT NOT NULL, -- JSON string  
    state TEXT NOT NULL CHECK (state IN ('ok_torrent', 'broken_torrent')),
    total_size INTEGER NOT NULL,
    cache_timestamp INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Directory mappings table
CREATE TABLE IF NOT EXISTS directories (
    directory TEXT NOT NULL,
    access_key TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (directory, access_key),
    FOREIGN KEY (access_key) REFERENCES torrents(access_key) ON DELETE CASCADE
);

-- STRM cache entries table
CREATE TABLE IF NOT EXISTS strm_cache (
    strm_code TEXT PRIMARY KEY,
    download_url TEXT NOT NULL,
    torrent_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    directory TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);
-- STRM mappings table  
CREATE TABLE IF NOT EXISTS strm_mappings (
    directory TEXT NOT NULL,
    torrent_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    strm_code TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    PRIMARY KEY (directory, torrent_id, filename),
    FOREIGN KEY (strm_code) REFERENCES strm_cache(strm_code) ON DELETE CASCADE
);

-- Cache settings table for key-value storage
CREATE TABLE IF NOT EXISTS cache_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Cache refresh progress tracking
CREATE TABLE IF NOT EXISTS refresh_progress (
    id INTEGER PRIMARY KEY,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    total_torrents INTEGER DEFAULT 0,
    processed_torrents INTEGER DEFAULT 0,
    current_torrent TEXT,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    error_message TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_torrents_state ON torrents(state);
CREATE INDEX IF NOT EXISTS idx_torrents_id ON torrents(id);
CREATE INDEX IF NOT EXISTS idx_directories_directory ON directories(directory);
CREATE INDEX IF NOT EXISTS idx_strm_cache_expires_at ON strm_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_strm_mappings_expires_at ON strm_mappings(expires_at);
CREATE INDEX IF NOT EXISTS idx_strm_mappings_strm_code ON strm_mappings(strm_code);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_cache_metadata_timestamp 
    AFTER UPDATE ON cache_metadata
BEGIN
    UPDATE cache_metadata SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_torrents_timestamp 
    AFTER UPDATE ON torrents
BEGIN
    UPDATE torrents SET updated_at = strftime('%s', 'now') WHERE access_key = NEW.access_key;
END;