import { Env, DirectoryMap } from './types';
import { RealDebridClient } from './realdebrid';
import { StorageManager } from './storage';
import { convertToTorrent } from './utils';

export async function maybeRefreshTorrents(env: Env): Promise<void> {
  console.log('=== maybeRefreshTorrents called ===');
  
  // Skip refresh for now during debugging
  console.log('Skipping torrent refresh for debugging');
  return;
  
  // Original refresh logic commented out for debugging
  /*
  const storage = new StorageManager(env);
  const metadata = await storage.getCacheMetadata();
  const now = Date.now();
  const refreshInterval = parseInt(env.REFRESH_INTERVAL_SECONDS || '15') * 1000;

  if (!metadata || (now - metadata.lastRefresh) > refreshInterval) {
    await refreshTorrents(env, storage);
  }
  */
}

async function refreshTorrents(env: Env, storage: StorageManager): Promise<void> {
  const rd = new RealDebridClient(env);
  const pageSize = parseInt(env.TORRENTS_PAGE_SIZE || '1000');
  
  try {
    const rdTorrents = await rd.getTorrents(1, pageSize);
    const directoryMap: DirectoryMap = { __all__: {} };
    
    for (const rdTorrent of rdTorrents) {
      if (rdTorrent.status !== 'downloaded' || rdTorrent.progress !== 100) {
        continue;
      }
      
      const torrentInfo = await rd.getTorrentInfo(rdTorrent.id);
      const torrent = convertToTorrent(torrentInfo);
      
      if (torrent) {
        directoryMap.__all__[torrent.id] = torrent;
      }
    }

    await storage.setDirectoryMap(directoryMap);
    await storage.setCacheMetadata({
      lastRefresh: Date.now(),
      libraryChecksum: JSON.stringify(rdTorrents).length.toString(),
    });
    
    console.log(`Refreshed ${Object.keys(directoryMap.__all__).length} torrents`);
  } catch (error) {
    console.error('Failed to refresh torrents:', error);
  }
}
