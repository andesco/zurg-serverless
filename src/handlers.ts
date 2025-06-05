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
    
    // Detect new torrents since last refresh
    const currentTorrentIds = new Set(downloadedTorrents.map(t => t.id));
    const previousTorrentIds = await storage.getCachedTorrentIds();
    const newTorrentIds = previousTorrentIds 
      ? Array.from(currentTorrentIds).filter(id => !previousTorrentIds.has(id))
      : [];
    
    if (newTorrentIds.length > 0) {
      console.log(`🆕 Detected ${newTorrentIds.length} new torrents: ${newTorrentIds.slice(0, 3).join(', ')}${newTorrentIds.length > 3 ? '...' : ''}`);
    }
    
    // Build directory structure and enhance with cached details
    const directoryMap: DirectoryMap = { __all__: {} };
    
    for (const rdTorrent of downloadedTorrents) {
      // Check if we have cached detailed info for this torrent
      const cachedDetails = await storage.getCachedTorrentDetails(rdTorrent.id);
      
      const torrent = {
        id: rdTorrent.id,
        name: rdTorrent.filename,
        originalName: rdTorrent.filename,
        hash: rdTorrent.hash,
        added: rdTorrent.added,
        ended: rdTorrent.ended,
        selectedFiles: cachedDetails?.selectedFiles || {}, // Use cached if available
        downloadedIDs: cachedDetails?.downloadedIDs || [],  // Use cached if available
        state: 'ok_torrent' as const,
        totalSize: rdTorrent.bytes
      };
      
      directoryMap.__all__[torrent.id] = torrent;
    }
    
    // Fetch details for new torrents (within worker limits)
    await fetchNewTorrentDetails(newTorrentIds, env, storage);
    
    console.log(`✅ Lightweight refresh complete: ${downloadedTorrents.length} torrents processed (only 1 API call!)`);
    if (newTorrentIds.length > 0) {
      console.log(`📥 Queued ${newTorrentIds.length} new torrents for detail fetching`);
    }
    // Save to database with updated torrent IDs
    await storage.setDirectoryMap(directoryMap);
    await storage.setCacheMetadata({
      lastRefresh: Date.now(),
      libraryChecksum: JSON.stringify(downloadedTorrents.map(t => t.id).sort()).length.toString(),
    });
    await storage.saveTorrentIds(currentTorrentIds);
    
  } catch (error) {
    console.error('❌ Failed to refresh torrents:', error);
    throw error;
  }
}

// Fetch details for new torrents (respecting worker limits)
async function fetchNewTorrentDetails(newTorrentIds: string[], env: Env, storage: StorageManager): Promise<void> {
  if (newTorrentIds.length === 0) return;
  
  // Conservative approach: only fetch a few new torrents per request to stay well under limits
  const maxNewTorrents = Math.min(newTorrentIds.length, 10); // Much more conservative
  const torrentsToFetch = newTorrentIds.slice(0, maxNewTorrents);
  
  if (maxNewTorrents < newTorrentIds.length) {
    console.log(`⚠️ Limited to fetching ${maxNewTorrents} of ${newTorrentIds.length} new torrents to stay within limits`);
    console.log(`📅 Remaining ${newTorrentIds.length - maxNewTorrents} will be fetched on subsequent requests`);
  }
  
  const rd = new RealDebridClient(env);
  let fetchedCount = 0;
  
  for (const torrentId of torrentsToFetch) {
    try {
      console.log(`📥 Fetching details for new torrent: ${torrentId}`);
      const torrentInfo = await rd.getTorrentInfo(torrentId);
      const detailedTorrent = convertToTorrent(torrentInfo);
      
      if (detailedTorrent) {
        // Cache the detailed info with infinite expiry (until STRM fails)
        await storage.cacheTorrentDetails(torrentId, detailedTorrent, null); // null = no expiry
        fetchedCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to fetch details for new torrent ${torrentId}:`, error);
    }
  }
  
  console.log(`✅ Fetched details for ${fetchedCount} new torrents`);
}

// Fetch detailed torrent info with smart caching
export async function getTorrentDetails(torrentId: string, env: Env, storage: StorageManager): Promise<Torrent | null> {
  console.log(`Fetching detailed info for torrent ${torrentId}...`);
  
  // Check cache first
  const cached = await storage.getCachedTorrentDetails(torrentId);
  if (cached && Object.keys(cached.selectedFiles).length > 0) {
    console.log(`✅ Using cached details for torrent ${torrentId}`);
    // Return the cached torrent from storage
    const result = await storage.getTorrentByName('__all__', torrentId);
    return result?.torrent || null;
  }
  
  // Cache miss - fetch from API
  console.log(`📥 Fetching fresh details for torrent ${torrentId}`);
  try {
    const rd = new RealDebridClient(env);
    const torrentInfo = await rd.getTorrentInfo(torrentId);
    const detailedTorrent = convertToTorrent(torrentInfo);
    
    if (detailedTorrent) {
      // Cache with infinite expiry
      await storage.cacheTorrentDetails(torrentId, detailedTorrent, null);
      console.log(`✅ Cached details for torrent ${torrentId}`);
    }
    
    return detailedTorrent;
  } catch (error) {
    console.error(`Failed to fetch details for torrent ${torrentId}:`, error);
    return null;
  }
}
