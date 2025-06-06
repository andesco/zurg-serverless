import { Env, Torrent, DirectoryMap, CacheMetadata } from './types';

export class StorageManager {
  private db: D1Database;

  constructor(env: Env) {
    this.db = env.DB;
  }

  // Cache metadata operations
  async getCacheMetadata(): Promise<CacheMetadata | null> {
    const result = await this.db
      .prepare('SELECT last_refresh, library_checksum FROM cache_metadata ORDER BY id DESC LIMIT 1')
      .first();
    
    return result ? {
      lastRefresh: result.last_refresh as number,
      libraryChecksum: result.library_checksum as string
    } : null;
  }

  async setCacheMetadata(metadata: CacheMetadata): Promise<void> {
    await this.db
      .prepare('INSERT OR REPLACE INTO cache_metadata (id, last_refresh, library_checksum) VALUES (1, ?, ?)')
      .bind(metadata.lastRefresh, metadata.libraryChecksum)
      .run();
  }

  // Torrent operations
  async getTorrent(accessKey: string): Promise<Torrent | null> {
    const result = await this.db
      .prepare('SELECT * FROM torrents WHERE access_key = ?')
      .bind(accessKey)
      .first();
    
    if (!result) return null;
    
    return {
      id: result.id as string,
      name: result.name as string,
      originalName: result.original_name as string,
      hash: result.hash as string,
      added: result.added as string,
      ended: result.ended as string || undefined,
      selectedFiles: JSON.parse(result.selected_files as string),
      downloadedIDs: JSON.parse(result.downloaded_ids as string),
      state: result.state as 'ok_torrent' | 'broken_torrent',
      totalSize: result.total_size as number
    };
  }
  async getTorrentByName(directory: string, torrentName: string): Promise<{ torrent: Torrent; accessKey: string } | null> {
    const result = await this.db
      .prepare(`
        SELECT t.*, d.access_key
        FROM torrents t
        JOIN directories d ON t.access_key = d.access_key
        WHERE d.directory = ? AND t.name = ?
        LIMIT 1
      `)
      .bind(directory, torrentName)
      .first();
    
    if (!result) return null;
    
    const torrent: Torrent = {
      id: result.id as string,
      name: result.name as string,
      originalName: result.original_name as string,
      hash: result.hash as string,
      added: result.added as string,
      ended: result.ended as string || undefined,
      selectedFiles: JSON.parse(result.selected_files as string),
      downloadedIDs: JSON.parse(result.downloaded_ids as string),
      state: result.state as 'ok_torrent' | 'broken_torrent',
      totalSize: result.total_size as number
    };
    
    return { torrent, accessKey: result.access_key as string };
  }

  async setTorrent(accessKey: string, torrent: Torrent): Promise<void> {
    await this.db
      .prepare(`
        INSERT OR REPLACE INTO torrents 
        (access_key, id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        accessKey,
        torrent.id,
        torrent.name,
        torrent.originalName,
        torrent.hash,
        torrent.added,
        torrent.ended || null,
        JSON.stringify(torrent.selectedFiles),
        JSON.stringify(torrent.downloadedIDs),
        torrent.state,
        torrent.totalSize
      )
      .run();
  }

  async deleteTorrent(accessKey: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM torrents WHERE access_key = ?')
      .bind(accessKey)
      .run();
  }
  // Directory operations
  async getDirectory(directory: string): Promise<{ [accessKey: string]: Torrent } | null> {
    const results = await this.db
      .prepare(`
        SELECT t.*, d.access_key
        FROM torrents t
        JOIN directories d ON t.access_key = d.access_key
        WHERE d.directory = ?
      `)
      .bind(directory)
      .all();
    
    if (!results.results || results.results.length === 0) return null;
    
    const torrents: { [accessKey: string]: Torrent } = {};
    
    for (const result of results.results) {
      const torrent: Torrent = {
        id: result.id as string,
        name: result.name as string,
        originalName: result.original_name as string,
        hash: result.hash as string,
        added: result.added as string,
        ended: result.ended as string || undefined,
        selectedFiles: JSON.parse(result.selected_files as string),
        downloadedIDs: JSON.parse(result.downloaded_ids as string),
        state: result.state as 'ok_torrent' | 'broken_torrent',
        totalSize: result.total_size as number
      };
      
      torrents[result.access_key as string] = torrent;
    }
    
    return torrents;
  }

  async setDirectory(directory: string, torrents: { [accessKey: string]: Torrent }): Promise<void> {
    // First delete existing directory mappings
    await this.db
      .prepare('DELETE FROM directories WHERE directory = ?')
      .bind(directory)
      .run();
    
    // Insert new directory mappings
    for (const accessKey of Object.keys(torrents)) {
      await this.db
        .prepare('INSERT INTO directories (directory, access_key) VALUES (?, ?)')
        .bind(directory, accessKey)
        .run();
    }
  }
  async getAllDirectories(): Promise<string[]> {
    const results = await this.db
      .prepare('SELECT DISTINCT directory FROM directories ORDER BY directory')
      .all();
    
    return results.results?.map(row => row.directory as string) || [];
  }

  // Bulk operations
  async setDirectoryMap(directoryMap: DirectoryMap): Promise<void> {
    // Use a transaction for bulk operations
    const statements = [];
    
    // Store all torrents first
    for (const [directory, torrents] of Object.entries(directoryMap)) {
      for (const [accessKey, torrent] of Object.entries(torrents)) {
        statements.push(
          this.db
            .prepare(`
              INSERT OR REPLACE INTO torrents 
              (access_key, id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
              accessKey,
              torrent.id,
              torrent.name,
              torrent.originalName,
              torrent.hash,
              torrent.added,
              torrent.ended || null,
              JSON.stringify(torrent.selectedFiles),
              JSON.stringify(torrent.downloadedIDs),
              torrent.state,
              torrent.totalSize
            )
        );
      }
    }
    
    // Clear existing directory mappings
    statements.push(this.db.prepare('DELETE FROM directories'));
    
    // Add new directory mappings
    for (const [directory, torrents] of Object.entries(directoryMap)) {
      for (const accessKey of Object.keys(torrents)) {
        statements.push(
          this.db
            .prepare('INSERT INTO directories (directory, access_key) VALUES (?, ?)')
            .bind(directory, accessKey)
        );
      }
    }
    
    await this.db.batch(statements);
  }
  async getDirectoryMap(): Promise<DirectoryMap> {
    const directories = await this.getAllDirectories();
    const directoryMap: DirectoryMap = {};
    
    for (const directory of directories) {
      const torrents = await this.getDirectory(directory);
      if (torrents) {
        directoryMap[directory] = torrents;
      }
    }
    
    return directoryMap;
  }

  // Smart caching methods for torrent details
  async getCachedTorrentIds(): Promise<Set<string> | null> {
    const result = await this.db
      .prepare('SELECT torrent_ids FROM cache_metadata ORDER BY id DESC LIMIT 1')
      .first();
    
    if (!result?.torrent_ids) return null;
    
    try {
      const ids = JSON.parse(result.torrent_ids as string);
      return new Set(ids);
    } catch {
      return null;
    }
  }

  async saveTorrentIds(torrentIds: Set<string>): Promise<void> {
    const idsArray = Array.from(torrentIds).sort();
    await this.db
      .prepare('UPDATE cache_metadata SET torrent_ids = ? WHERE id = 1')
      .bind(JSON.stringify(idsArray))
      .run();
  }

  async getCachedTorrentDetails(torrentId: string): Promise<{ selectedFiles: any; downloadedIDs: string[] } | null> {
    const result = await this.db
      .prepare('SELECT selected_files, downloaded_ids FROM torrents WHERE id = ? AND selected_files != "{}"')
      .bind(torrentId)
      .first();
    
    if (!result) return null;
    
    try {
      return {
        selectedFiles: JSON.parse(result.selected_files as string),
        downloadedIDs: JSON.parse(result.downloaded_ids as string)
      };
    } catch {
      return null;
    }
  }

  async cacheTorrentDetails(torrentId: string, torrent: Torrent, expiresAt: number | null): Promise<void> {
    // Update the existing torrent record with detailed info
    await this.db
      .prepare(`
        UPDATE torrents 
        SET selected_files = ?, downloaded_ids = ?, updated_at = strftime('%s', 'now')
        WHERE id = ?
      `)
      .bind(
        JSON.stringify(torrent.selectedFiles),
        JSON.stringify(torrent.downloadedIDs),
        torrentId
      )
      .run();
  }

  // Called when STRM generation fails - expire cached details for this torrent
  async expireTorrentDetails(torrentId: string): Promise<void> {
    console.log(`🔄 Expiring cached details for torrent ${torrentId} due to STRM failure`);
    await this.db
      .prepare('UPDATE torrents SET selected_files = "{}", downloaded_ids = "[]" WHERE id = ?')
      .bind(torrentId)
      .run();
  }

  // Priority-based cache management methods
  async getOldestCachedTorrents(limit: number, excludeIds: string[]): Promise<string[]> {
    const excludeList = excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.map(() => '?').join(',')})` : '';
    const query = `
      SELECT id FROM torrents 
      WHERE selected_files != "{}" AND selected_files != ""
      ${excludeList}
      ORDER BY updated_at ASC 
      LIMIT ?
    `;
    
    const result = await this.db
      .prepare(query)
      .bind(...excludeIds, limit)
      .all();
    
    return result.results.map((row: any) => row.id);
  }

  async getUncachedTorrents(limit: number, excludeIds: string[]): Promise<string[]> {
    const excludeList = excludeIds.length > 0 ? `AND id NOT IN (${excludeIds.map(() => '?').join(',')})` : '';
    const query = `
      SELECT id FROM torrents 
      WHERE (selected_files = "{}" OR selected_files = "" OR selected_files IS NULL)
      ${excludeList}
      ORDER BY added DESC 
      LIMIT ?
    `;
    
    const result = await this.db
      .prepare(query)
      .bind(...excludeIds, limit)
      .all();
    
    return result.results.map((row: any) => row.id);
  }

  // Method for STRM handler to request priority caching
  async requestSTRMPriority(torrentId: string): Promise<void> {
    // Mark this torrent for immediate priority on next worker call
    // For now, just ensure it gets refreshed by clearing cache
    await this.expireTorrentDetails(torrentId);
    console.log(`🔥 STRM priority requested for torrent ${torrentId}`);
  }
  
  // Enhanced cache metadata management
  async updateCacheMetadata(): Promise<void> {
    console.log('🔄 Updating cache metadata to force refresh');
    const metadata = {
      lastRefresh: 0, // Set to 0 to force refresh on next call
      lastUpdate: Date.now(),
      forceRefresh: true
    };
    
    try {
      await this.db
        .prepare('INSERT OR REPLACE INTO cache_settings (key, value) VALUES (?, ?)')
        .bind('main', JSON.stringify(metadata))
        .run();
      
      console.log('✅ Cache metadata updated - next request will refresh');
    } catch (error) {
      console.log('⚠️ Cache metadata table not found, using fallback method');
      // Fallback: just log the action since the main caching still works
      console.log('📝 Cache refresh requested but will use existing refresh logic');
    }
  }

  async getCacheMetadata(): Promise<{ lastRefresh: number; lastUpdate: number; forceRefresh?: boolean } | null> {
    try {
      const result = await this.db
        .prepare('SELECT value FROM cache_settings WHERE key = ?')
        .bind('main')
        .first();
      
      if (!result?.value) {
        console.log('⚠️ No cache metadata found');
        return null;
      }
      
      const metadata = JSON.parse(result.value as string);
      console.log('📊 Cache metadata:', metadata);
      return metadata;
    } catch (error) {
      console.log('⚠️ Cache metadata table not available, using fallback');
      // Fallback to the original cache_metadata table structure
      try {
        const result = await this.db
          .prepare('SELECT last_refresh FROM cache_metadata ORDER BY id DESC LIMIT 1')
          .first();
        
        if (result?.last_refresh) {
          return {
            lastRefresh: result.last_refresh as number,
            lastUpdate: Date.now()
          };
        }
      } catch (fallbackError) {
        console.log('⚠️ No cache metadata available');
      }
      
      return null;
    }
  }

  async setCacheMetadata(metadata: { lastRefresh: number; lastUpdate: number }): Promise<void> {
    console.log('💾 Setting cache metadata:', metadata);
    try {
      await this.db
        .prepare('INSERT OR REPLACE INTO cache_settings (key, value) VALUES (?, ?)')
        .bind('main', JSON.stringify(metadata))
        .run();
    } catch (error) {
      console.log('⚠️ Using fallback cache metadata storage');
      // Fallback to original table if available
      try {
        await this.db
          .prepare('INSERT OR REPLACE INTO cache_metadata (last_refresh, library_checksum) VALUES (?, ?)')
          .bind(metadata.lastRefresh, 'updated')
          .run();
      } catch (fallbackError) {
        console.log('⚠️ Cache metadata storage not available');
      }
    }
  }

  async getCacheMetadata(): Promise<{ lastRefresh: number; lastUpdate: number; forceRefresh?: boolean } | null> {
    const result = await this.db
      .prepare('SELECT value FROM cache_metadata WHERE key = ?')
      .bind('main')
      .first();
    
    if (!result?.value) {
      console.log('⚠️ No cache metadata found');
      return null;
    }
    
    try {
      const metadata = JSON.parse(result.value as string);
      console.log('📊 Cache metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('❌ Error parsing cache metadata:', error);
      return null;
    }
  }

  async setCacheMetadata(metadata: { lastRefresh: number; lastUpdate: number }): Promise<void> {
    console.log('💾 Setting cache metadata:', metadata);
    await this.db
      .prepare('INSERT OR REPLACE INTO cache_metadata (key, value) VALUES (?, ?)')
      .bind('main', JSON.stringify(metadata))
      .run();
  }

  // Enhanced directory operations with debugging
  async getAllDirectories(): Promise<string[]> {
    console.log('📁 Getting all directories from database');
    const startTime = Date.now();
    
    try {
      const results = await this.db
        .prepare('SELECT DISTINCT directory FROM directories ORDER BY directory')
        .all();
      
      const directories = results.results?.map(row => row.directory as string) || [];
      const loadTime = Date.now() - startTime;
      
      console.log(`✅ Found ${directories.length} directories in ${loadTime}ms:`, directories.slice(0, 5));
      if (directories.length > 5) {
        console.log(`   ... and ${directories.length - 5} more`);
      }
      
      return directories;
    } catch (error) {
      console.error('❌ Error getting directories:', error);
      throw error;
    }
  }

  async getDirectory(directory: string): Promise<Record<string, Torrent> | null> {
    console.log(`📂 Getting torrents for directory: ${directory}`);
    const startTime = Date.now();
    
    try {
      const results = await this.db
        .prepare(`
          SELECT t.*, d.access_key
          FROM torrents t
          JOIN directories d ON t.access_key = d.access_key
          WHERE d.directory = ?
        `)
        .bind(directory)
        .all();
      
      if (!results.results || results.results.length === 0) {
        console.log(`⚠️ No torrents found for directory: ${directory}`);
        return null;
      }
      
      const torrents: Record<string, Torrent> = {};
      for (const row of results.results) {
        const accessKey = row.access_key as string;
        torrents[accessKey] = this.convertRowToTorrent(row);
      }
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Found ${Object.keys(torrents).length} torrents for ${directory} in ${loadTime}ms`);
      
      return torrents;
    } catch (error) {
      console.error(`❌ Error getting directory ${directory}:`, error);
      throw error;
    }
  }

  async getTorrentByName(directory: string, torrentName: string): Promise<{ torrent: Torrent; accessKey: string } | null> {
    console.log(`🎬 Getting torrent: ${directory}/${torrentName}`);
    const startTime = Date.now();
    
    try {
      const result = await this.db
        .prepare(`
          SELECT t.*, d.access_key
          FROM torrents t
          JOIN directories d ON t.access_key = d.access_key
          WHERE d.directory = ? AND t.name = ?
          LIMIT 1
        `)
        .bind(directory, torrentName)
        .first();
      
      if (!result) {
        console.log(`⚠️ Torrent not found: ${directory}/${torrentName}`);
        return null;
      }
      
      const loadTime = Date.now() - startTime;
      const torrent = this.convertRowToTorrent(result);
      const accessKey = result.access_key as string;
      
      console.log(`✅ Found torrent ${torrent.name} (${torrent.id}) in ${loadTime}ms`);
      console.log(`   Files: ${Object.keys(torrent.selectedFiles).length}, State: ${torrent.state}`);
      
      return { torrent, accessKey };
    } catch (error) {
      console.error(`❌ Error getting torrent ${directory}/${torrentName}:`, error);
      throw error;
    }
  }

  // Enhanced caching methods with better debugging
  async getCachedTorrentIds(): Promise<Set<string> | null> {
    console.log('🗂️ Getting cached torrent IDs');
    
    try {
      const results = await this.db
        .prepare('SELECT id FROM torrents')
        .all();
      
      if (!results.results) {
        console.log('⚠️ No cached torrents found');
        return null;
      }
      
      const ids = new Set(results.results.map(row => row.id as string));
      console.log(`✅ Found ${ids.size} cached torrent IDs`);
      
      return ids;
    } catch (error) {
      console.error('❌ Error getting cached torrent IDs:', error);
      return null;
    }
  }

  async getCachedTorrentDetails(torrentId: string): Promise<Torrent | null> {
    console.log(`🔍 Getting cached details for torrent: ${torrentId}`);
    
    try {
      const result = await this.db
        .prepare('SELECT * FROM torrents WHERE id = ? LIMIT 1')
        .bind(torrentId)
        .first();
      
      if (!result) {
        console.log(`⚠️ No cached details for torrent: ${torrentId}`);
        return null;
      }
      
      const torrent = this.convertRowToTorrent(result);
      const fileCount = Object.keys(torrent.selectedFiles).length;
      
      console.log(`✅ Found cached details for ${torrent.name} (${fileCount} files)`);
      
      return torrent;
    } catch (error) {
      console.error(`❌ Error getting cached torrent details for ${torrentId}:`, error);
      return null;
    }
  }

  async saveTorrentDetails(torrent: Torrent): Promise<void> {
    console.log(`💾 Saving torrent details: ${torrent.name} (${torrent.id})`);
    
    try {
      await this.db
        .prepare(`
          INSERT OR REPLACE INTO torrents 
          (id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .bind(
          torrent.id,
          torrent.name,
          torrent.originalName,
          torrent.hash,
          torrent.added,
          torrent.ended || null,
          JSON.stringify(torrent.selectedFiles),
          JSON.stringify(torrent.downloadedIDs),
          torrent.state,
          torrent.totalSize
        )
        .run();
      
      console.log(`✅ Saved torrent details for ${torrent.name}`);
    } catch (error) {
      console.error(`❌ Error saving torrent details for ${torrent.id}:`, error);
      throw error;
    }
  }

  // Database health check
  async checkDatabaseHealth(): Promise<{ 
    directories: number; 
    torrents: number; 
    cacheAge: number;
    lastRefresh: string | null;
  }> {
    console.log('🏥 Checking database health');
    
    try {
      const [dirResult, torrentResult, cacheResult] = await Promise.all([
        this.db.prepare('SELECT COUNT(*) as count FROM directories').first(),
        this.db.prepare('SELECT COUNT(*) as count FROM torrents').first(),
        this.getCacheMetadata()
      ]);
      
      const health = {
        directories: (dirResult?.count as number) || 0,
        torrents: (torrentResult?.count as number) || 0,
        cacheAge: cacheResult ? Date.now() - cacheResult.lastRefresh : -1,
        lastRefresh: cacheResult ? new Date(cacheResult.lastRefresh).toISOString() : null
      };
      
      console.log('📊 Database health:', health);
      return health;
    } catch (error) {
      console.error('❌ Error checking database health:', error);
      throw error;
    }
  }

  private convertRowToTorrent(row: any): Torrent {
    return {
      id: row.id as string,
      name: row.name as string,
      originalName: row.original_name as string,
      hash: row.hash as string,
      added: row.added as string,
      ended: row.ended as string || undefined,
      selectedFiles: JSON.parse(row.selected_files as string),
      downloadedIDs: JSON.parse(row.downloaded_ids as string),
      state: row.state as 'ok_torrent' | 'broken_torrent',
      totalSize: row.total_size as number
    };
  }

  // Method for STRM handler to request priority caching
  async requestSTRMPriority(torrentId: string): Promise<void> {
    // Mark this torrent for immediate priority on next worker call
    // For now, just ensure it gets refreshed by clearing cache
    await this.expireTorrentDetails(torrentId);
    console.log(`🔥 STRM priority requested for torrent ${torrentId}`);
  }
}