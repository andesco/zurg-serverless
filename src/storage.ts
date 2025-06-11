import { Env, Torrent, DirectoryMap, CacheMetadata } from './types';
import { getTestBrokenTorrent } from './test-data';

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
    const torrentIdsJson = metadata.torrentIds ? JSON.stringify(metadata.torrentIds) : null;
    await this.db
      .prepare('INSERT OR REPLACE INTO cache_metadata (id, last_refresh, library_checksum, torrent_ids) VALUES (1, ?, ?, ?)')
      .bind(metadata.lastRefresh, metadata.libraryChecksum, torrentIdsJson)
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
    // Handle test broken torrent
    if (directory === 'Test.Broken.Movie.2024.1080p.WEB-DL.x264' && torrentName === 'Test.Broken.Movie.2024.1080p.WEB-DL.x264') {
      return {
        accessKey: 'TEST_BROKEN_123',
        torrent: {
          id: 'TEST_BROKEN_123',
          name: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
          originalName: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
          hash: 'abcdef1234567890abcdef1234567890abcdef12',
          added: new Date().toISOString(),
          ended: new Date().toISOString(),
          selectedFiles: {
            'Test.Broken.Movie.2024.1080p.WEB-DL.x264.mp4': {
              id: 'broken_file_1',
              path: '/Test.Broken.Movie.2024.1080p.WEB-DL.x264.mp4',
              bytes: 2147483648,
              selected: 1,
              link: null,
              ended: undefined,
              state: 'broken_file' as const
            },
            'Test.Broken.Movie.2024.Sample.mp4': {
              id: 'broken_file_2',
              path: '/Test.Broken.Movie.2024.Sample.mp4',
              bytes: 52428800,
              selected: 1,
              link: null,
              ended: undefined,
              state: 'broken_file' as const
            }
          },
          downloadedIDs: [],
          state: 'broken_torrent' as const,
          totalSize: 2199912448,
          cacheTimestamp: Date.now()
        }
      };
    }

    // Check for test broken torrent in development
    const testTorrent = getTestBrokenTorrent();
    if (testTorrent && torrentName === testTorrent.name) {
      return { 
        torrent: testTorrent, 
        accessKey: `test_${testTorrent.id}` 
      };
    }

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
        (access_key, id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size, cache_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        torrent.totalSize,
        torrent.cacheTimestamp || null
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
  async getDirectory(directory: string, filterForWebDAV = false): Promise<{ [accessKey: string]: Torrent } | null> {
    // Handle test broken torrent
    if (directory === 'Test.Broken.Movie.2024.1080p.WEB-DL.x264') {
      return {
        'TEST_BROKEN_123': {
          id: 'TEST_BROKEN_123',
          name: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
          originalName: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
          hash: 'abcdef1234567890abcdef1234567890abcdef12',
          added: new Date().toISOString(),
          ended: new Date().toISOString(),
          selectedFiles: {
            'Test.Broken.Movie.2024.1080p.WEB-DL.x264.mp4': {
              id: 'broken_file_1',
              path: '/Test.Broken.Movie.2024.1080p.WEB-DL.x264.mp4',
              bytes: 2147483648,
              selected: 1,
              link: null,
              ended: undefined,
              state: 'broken_file' as const
            },
            'Test.Broken.Movie.2024.Sample.mp4': {
              id: 'broken_file_2',
              path: '/Test.Broken.Movie.2024.Sample.mp4', 
              bytes: 52428800,
              selected: 1,
              link: null,
              ended: undefined,
              state: 'broken_file' as const
            }
          },
          downloadedIDs: [],
          state: 'broken_torrent' as const,
          totalSize: 2199912448,
          cacheTimestamp: Date.now()
        }
      };
    }

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
        totalSize: result.total_size as number,
        cacheTimestamp: result.cache_timestamp as number || undefined
      };
      
      // Filter out torrents without details for WebDAV
      if (filterForWebDAV) {
        const hasFiles = Object.keys(torrent.selectedFiles).length > 0;
        if (!hasFiles) continue; // Skip torrents without file details
      }
      
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
    
    const directories = results.results?.map(row => row.directory as string)
      .filter(dir => dir !== '__all__' && !dir.startsWith('int__')) || [];
    
    // Always add test broken torrent for demonstration
    if (!directories.includes('Test.Broken.Movie.2024.1080p.WEB-DL.x264')) {
      directories.unshift('Test.Broken.Movie.2024.1080p.WEB-DL.x264');
    }
    
    return directories;
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
              (access_key, id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size, cache_timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              torrent.totalSize,
              torrent.cacheTimestamp || null
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

  // Enhanced cache management for folder navigation fix
  async updateCacheMetadata(): Promise<void> {
    console.log('🔄 Updating cache metadata to force refresh');
    try {
      // First, try to use the new cache_settings table structure
      await this.db
        .prepare('INSERT OR REPLACE INTO cache_settings (key, value) VALUES (?, ?)')
        .bind('main', JSON.stringify({
          lastRefresh: 0, // Set to 0 to force refresh on next call
          lastUpdate: Date.now(),
          forceRefresh: true
        }))
        .run();
      
      console.log('✅ Cache metadata updated - next request will refresh');
    } catch (error) {
      console.log('⚠️ New cache table not available, using fallback method');
      // Fallback: Force a refresh by updating the existing cache metadata
      try {
        await this.db
          .prepare('UPDATE cache_metadata SET last_refresh = 0, updated_at = ? WHERE id = 1')
          .bind(Math.floor(Date.now() / 1000))
          .run();
        console.log('✅ Cache refresh forced using existing table');
      } catch (fallbackError) {
        console.log('⚠️ Cache refresh requested but tables not available, refresh will happen naturally');
      }
    }
  }

  // Get cache statistics with duplicate detection (counts all torrents from RD)
  async getCacheStatistics(): Promise<{ cached: number; pending: number; duplicates: number; total: number }> {
    try {
      // Get total unique torrents from RD
      const totalResult = await this.db
        .prepare('SELECT COUNT(DISTINCT id) as total FROM torrents')
        .first();
      
      const total = totalResult?.total || 0;
      
      // Get visible torrents with cache status
      const visibleResult = await this.db
        .prepare(`
          SELECT 
            COUNT(DISTINCT t.id) as visible_total,
            COUNT(DISTINCT CASE WHEN 
              (length(t.selected_files) > 5 AND t.selected_files != '[]' AND t.selected_files != '{}' AND NOT t.selected_files LIKE '{}%' AND NOT t.selected_files LIKE '[]%') 
              OR t.cache_timestamp IS NOT NULL 
              THEN t.id END) as visible_cached
          FROM torrents t
          JOIN directories d ON t.access_key = d.access_key
          WHERE d.directory != '__all__' AND d.directory NOT LIKE 'int__%'
        `)
        .first();
        
      const visibleTotal = visibleResult?.visible_total || 0;
      const visibleCached = visibleResult?.visible_cached || 0;
      const visiblePending = visibleTotal - visibleCached;
      const orphaned = total - visibleTotal;
      
      return {
        total,
        cached: visibleCached,
        pending: visiblePending,
        duplicates: orphaned
      };
    } catch (error) {
      console.error('Error getting cache statistics:', error);
      return { total: 0, cached: 0, pending: 0, duplicates: 0 };
    }
  }

  // Get torrents that need cache population (use same logic as cache statistics)
  async getAllUncachedTorrents(): Promise<Array<{ id: string; name: string }>> {
    const results = await this.db
      .prepare(`
        SELECT DISTINCT id, name 
        FROM torrents 
        WHERE NOT (
          (length(selected_files) > 5 AND selected_files != '[]' AND selected_files != '{}' AND NOT selected_files LIKE '{}%' AND NOT selected_files LIKE '[]%') 
          OR cache_timestamp IS NOT NULL
        )
        ORDER BY added DESC
      `)
      .all();
    
    return results.results?.map(row => ({
      id: row.id as string,
      name: row.name as string
    })) || [];
  }
  async saveTorrentDetails(torrentId: string, torrent: Torrent): Promise<void> {
    const accessKey = torrent.id;
    await this.db
      .prepare(`
        INSERT OR REPLACE INTO torrents 
        (access_key, id, name, original_name, hash, added, ended, selected_files, downloaded_ids, state, total_size, cache_timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        torrent.totalSize,
        torrent.cacheTimestamp || Date.now()
      )
      .run();

    // Also update directory mapping
    await this.db
      .prepare('INSERT OR REPLACE INTO directories (directory, access_key) VALUES (?, ?)')
      .bind(torrent.name, accessKey) // Use exact torrent name as directory
      .run();
  }
  
  // === Cache Progress Tracking ===
  
  async startCacheRefresh(totalTorrents: number): Promise<number> {
    const refreshId = Date.now(); // Use timestamp as simple ID
    
    await this.db.prepare(`
      INSERT INTO refresh_progress (id, status, total_torrents, processed_torrents, started_at)
      VALUES (?, 'running', ?, 0, ?)
    `).bind(refreshId, totalTorrents, Date.now()).run();
    
    console.log(`Started cache refresh tracking: ID ${refreshId}, ${totalTorrents} torrents`);
    return refreshId;
  }
  
  async updateCacheProgress(refreshId: number, processedTorrents: number, currentTorrent?: string): Promise<void> {
    await this.db.prepare(`
      UPDATE refresh_progress 
      SET processed_torrents = ?, current_torrent = ?, updated_at = ?
      WHERE id = ?
    `).bind(processedTorrents, currentTorrent || null, Date.now(), refreshId).run();
  }
  
  async completeCacheRefresh(refreshId: number, success: boolean, errorMessage?: string): Promise<void> {
    const status = success ? 'completed' : 'failed';
    
    await this.db.prepare(`
      UPDATE refresh_progress 
      SET status = ?, completed_at = ?, error_message = ?, updated_at = ?
      WHERE id = ?
    `).bind(status, Date.now(), errorMessage || null, Date.now(), refreshId).run();
    
    console.log(`Cache refresh ${refreshId} ${status}${errorMessage ? `: ${errorMessage}` : ''}`);
  }
  
  async getCacheRefreshStatus(refreshId?: number): Promise<any | null> {
    let query;
    if (refreshId) {
      query = this.db.prepare(`
        SELECT * FROM refresh_progress WHERE id = ? ORDER BY started_at DESC LIMIT 1
      `).bind(refreshId);
    } else {
      // Get latest refresh status
      query = this.db.prepare(`
        SELECT * FROM refresh_progress ORDER BY started_at DESC LIMIT 1
      `);
    }
    
    const result = await query.first();
    return result || null;
  }
  
  async cleanupOldRefreshProgress(): Promise<void> {
    // Keep only last 10 refresh records
    await this.db.prepare(`
      DELETE FROM refresh_progress 
      WHERE id NOT IN (
        SELECT id FROM refresh_progress 
        ORDER BY started_at DESC 
        LIMIT 10
      )
    `).run();
  }
  
  async cleanupStaleRefreshProgress(): Promise<void> {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds
    
    // Find and complete any stale "running" refreshes older than 1 hour
    const staleRefreshes = await this.db.prepare(`
      SELECT id FROM refresh_progress 
      WHERE status = 'running' AND started_at < ?
    `).bind(oneHourAgo).all();
    
    for (const refresh of staleRefreshes.results) {
      console.log(`Cleaning up stale refresh: ${refresh.id}`);
      await this.completeCacheRefresh(refresh.id as number, false, 'Cleaned up stale refresh (timeout)');
    }
    
    console.log(`Cleaned up ${staleRefreshes.results.length} stale refresh progress entries`);
  }
}