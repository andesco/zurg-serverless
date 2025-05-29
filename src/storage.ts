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
}