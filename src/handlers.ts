import { Env, DirectoryMap, Torrent } from './types';
import { RealDebridClient } from './realdebrid';
import { StorageManager } from './storage';
import { convertToTorrent } from './utils';

export async function maybeRefreshTorrents(env: Env): Promise<void> {
  console.log('=== maybeRefreshTorrents called ===');
  
  const storage = new StorageManager(env);
  const metadata = await storage.getCacheMetadata();
  const now = Date.now();
  const refreshInterval = parseInt(env.REFRESH_INTERVAL_SECONDS || '15') * 1000;

  if (!metadata || (now - metadata.lastRefresh) > refreshInterval) {
    console.log('Refreshing torrents from Real Debrid...');
    await refreshTorrentsLightweight(env, storage);
  } else {
    console.log('Using cached torrent data');
  }
}

// Fast refresh using only the torrent list API - no individual calls
async function refreshTorrentsLightweight(env: Env, storage: StorageManager): Promise<void> {
  console.log('=== Starting lightweight torrent refresh ===');
  const rd = new RealDebridClient(env);
  const pageSize = parseInt(env.TORRENTS_PAGE_SIZE || '1000');
  
  try {
    console.log(`Fetching torrents from Real Debrid (page size: ${pageSize})...`);
    const rdTorrents = await rd.getTorrents(1, pageSize);
    console.log(`Received ${rdTorrents.length} torrents from Real Debrid`);
    
    // Filter to only downloaded torrents
    const downloadedTorrents = rdTorrents.filter(t => 
      t.status === 'downloaded' && t.progress === 100
    );
    console.log(`Found ${downloadedTorrents.length} downloaded torrents`);
    
    // Build directory structure using just the list data - no individual API calls needed!
    const directoryMap: DirectoryMap = { __all__: {} };
    
    for (const rdTorrent of downloadedTorrents) {
      // Create a lightweight torrent entry for directory listing
      const torrent = {
        id: rdTorrent.id,
        name: rdTorrent.filename,
        originalName: rdTorrent.filename,
        hash: rdTorrent.hash,
        added: rdTorrent.added,
        ended: rdTorrent.ended,
        selectedFiles: {}, // Will be populated only when needed for STRM
        downloadedIDs: [],  // Will be populated only when needed for STRM  
        state: 'ok_torrent' as const,
        totalSize: rdTorrent.bytes
      };
      
      directoryMap.__all__[torrent.id] = torrent;
    }
    
    console.log(`✅ Lightweight refresh complete: ${downloadedTorrents.length} torrents processed (only 1 API call!)`);
    
    // Save to database
    await storage.setDirectoryMap(directoryMap);
    await storage.setCacheMetadata({
      lastRefresh: Date.now(),
      libraryChecksum: JSON.stringify(downloadedTorrents.map(t => t.id).sort()).length.toString(),
    });
    
  } catch (error) {
    console.error('❌ Failed to refresh torrents:', error);
    throw error;
  }
}

// Fetch detailed torrent info only when needed (for STRM generation or file listing)
export async function getTorrentDetails(torrentId: string, env: Env): Promise<Torrent | null> {
  console.log(`Fetching detailed info for torrent ${torrentId}...`);
  
  try {
    const rd = new RealDebridClient(env);
    const torrentInfo = await rd.getTorrentInfo(torrentId);
    return convertToTorrent(torrentInfo);
  } catch (error) {
    console.error(`Failed to fetch details for torrent ${torrentId}:`, error);
    return null;
  }
}
