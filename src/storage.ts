import { Env, Torrent, DirectoryMap, CacheMetadata } from './types';

export class StorageManager {
  private kv: KVNamespace;

  constructor(env: Env) {
    this.kv = env.KV;
  }

  // Cache metadata operations
  async getCacheMetadata(): Promise<CacheMetadata | null> {
    const data = await this.kv.get('cache_metadata');
    return data ? JSON.parse(data) : null;
  }

  async setCacheMetadata(metadata: CacheMetadata): Promise<void> {
    await this.kv.put('cache_metadata', JSON.stringify(metadata));
  }

  // Torrent operations
  async getTorrent(accessKey: string): Promise<Torrent | null> {
    const data = await this.kv.get(`torrent:${accessKey}`);
    return data ? JSON.parse(data) : null;
  }

  async getTorrentByName(directory: string, torrentName: string): Promise<{ torrent: Torrent; accessKey: string } | null> {
    const torrents = await this.getDirectory(directory);
    if (!torrents) return null;
    
    for (const [accessKey, torrent] of Object.entries(torrents)) {
      if (torrent.name === torrentName) {
        return { torrent, accessKey };
      }
    }
    
    return null;
  }

  async setTorrent(accessKey: string, torrent: Torrent): Promise<void> {
    await this.kv.put(`torrent:${accessKey}`, JSON.stringify(torrent));
  }

  async deleteTorrent(accessKey: string): Promise<void> {
    await this.kv.delete(`torrent:${accessKey}`);
  }

  // Directory operations
  async getDirectory(directory: string): Promise<{ [accessKey: string]: Torrent } | null> {
    const data = await this.kv.get(`dir:${directory}`);
    return data ? JSON.parse(data) : null;
  }

  async setDirectory(directory: string, torrents: { [accessKey: string]: Torrent }): Promise<void> {
    await this.kv.put(`dir:${directory}`, JSON.stringify(torrents));
  }

  async getAllDirectories(): Promise<string[]> {
    const list = await this.kv.list({ prefix: 'dir:' });
    return list.keys.map(key => key.name.substring(4)); // Remove 'dir:' prefix
  }

  // Bulk operations
  async setDirectoryMap(directoryMap: DirectoryMap): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [directory, torrents] of Object.entries(directoryMap)) {
      promises.push(this.setDirectory(directory, torrents));
      
      // Also store individual torrents
      for (const [accessKey, torrent] of Object.entries(torrents)) {
        promises.push(this.setTorrent(accessKey, torrent));
      }
    }
    
    await Promise.all(promises);
  }

  async getDirectoryMap(): Promise<DirectoryMap> {
    const directories = await this.getAllDirectories();
    const directoryMap: DirectoryMap = {};
    
    await Promise.all(
      directories.map(async (directory) => {
        const torrents = await this.getDirectory(directory);
        if (torrents) {
          directoryMap[directory] = torrents;
        }
      })
    );
    
    return directoryMap;
  }
}
