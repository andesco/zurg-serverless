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
    
    // Always fetch details for 10 torrents on every worker call (proactive caching)
    await fetchTorrentDetailsByPriority(downloadedTorrents, env, storage);
    
    console.log(`✅ Lightweight refresh complete: ${downloadedTorrents.length} torrents processed (only 1 API call!)`);
    console.log(`🔄 Background caching: 10 torrents queued for detail fetching`);
    
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

// Priority-based torrent detail fetching (always fetch 10 per worker call)
async function fetchTorrentDetailsByPriority(
  allTorrents: any[], 
  env: Env, 
  storage: StorageManager
): Promise<void> {
  const rd = new RealDebridClient(env);
  const fetchLimit = 10; // Always fetch exactly 10 torrents
  const torrentsToFetch: Array<{id: string, priority: number, reason: string}> = [];
  
  // Get current cache status
  const currentTorrentIds = new Set(allTorrents.map(t => t.id));
  const previousTorrentIds = await storage.getCachedTorrentIds();
  const newTorrentIds = previousTorrentIds 
    ? Array.from(currentTorrentIds).filter(id => !previousTorrentIds.has(id))
    : Array.from(currentTorrentIds);

  console.log(`📊 Cache analysis: ${allTorrents.length} total, ${newTorrentIds.length} new torrents`);
  
  // Priority 1: New torrents (highest priority)
  for (const torrentId of newTorrentIds.slice(0, fetchLimit)) {
    torrentsToFetch.push({
      id: torrentId,
      priority: 1,
      reason: 'NEW'
    });
  }
  
  // Priority 2: Fill remaining slots with oldest cached data
  if (torrentsToFetch.length < fetchLimit) {
    const remaining = fetchLimit - torrentsToFetch.length;
    const oldestCached = await storage.getOldestCachedTorrents(remaining, newTorrentIds);
    
    for (const torrentId of oldestCached) {
      torrentsToFetch.push({
        id: torrentId,
        priority: 2,
        reason: 'REFRESH_OLD'
      });
    }
  }
  
  // Priority 3: Fill any remaining slots with uncached torrents
  if (torrentsToFetch.length < fetchLimit) {
    const remaining = fetchLimit - torrentsToFetch.length;
    const uncached = await storage.getUncachedTorrents(remaining, 
      [...newTorrentIds, ...torrentsToFetch.map(t => t.id)]
    );
    
    for (const torrentId of uncached) {
      torrentsToFetch.push({
        id: torrentId,
        priority: 3,
        reason: 'UNCACHED'
      });
    }
  }
  
  // Execute fetching
  let fetchedCount = 0;
  const reasons = new Map<string, number>();
  
  for (const item of torrentsToFetch) {
    try {
      console.log(`📥 [${item.reason}] Fetching details for torrent: ${item.id}`);
      const torrentInfo = await rd.getTorrentInfo(item.id);
      const detailedTorrent = convertToTorrent(torrentInfo);
      
      if (detailedTorrent) {
        await storage.cacheTorrentDetails(item.id, detailedTorrent, null);
        fetchedCount++;
        reasons.set(item.reason, (reasons.get(item.reason) || 0) + 1);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch details for ${item.reason} torrent ${item.id}:`, error);
    }
  }
  
  // Log summary
  const reasonSummary = Array.from(reasons.entries())
    .map(([reason, count]) => `${count} ${reason}`)
    .join(', ');
  
  console.log(`✅ Background cache: ${fetchedCount}/${fetchLimit} torrents fetched (${reasonSummary})`);
}

// Special handler for STRM requests - gets immediate priority
export async function handleSTRMPriorityRequest(torrentId: string, env: Env, storage: StorageManager): Promise<Torrent | null> {
  console.log(`🔥 STRM priority request for torrent ${torrentId}`);
  
  // Check cache first
  const cached = await storage.getCachedTorrentDetails(torrentId);
  if (cached && Object.keys(cached.selectedFiles).length > 0) {
    console.log(`✅ STRM using cached details for torrent ${torrentId}`);
    // Get the full torrent object from storage
    const allTorrents = await storage.getDirectory('__all__');
    return allTorrents?.[torrentId] || null;
  }
  
  // Cache miss - fetch immediately (STRM gets priority)
  console.log(`📥 STRM fetching fresh details for torrent ${torrentId}`);
  try {
    const rd = new RealDebridClient(env);
    const torrentInfo = await rd.getTorrentInfo(torrentId);
    const detailedTorrent = convertToTorrent(torrentInfo);
    
    if (detailedTorrent) {
      await storage.cacheTorrentDetails(torrentId, detailedTorrent, null);
      console.log(`✅ STRM cached details for torrent ${torrentId}`);
    }
    
    return detailedTorrent;
  } catch (error) {
    console.error(`❌ STRM failed to fetch details for torrent ${torrentId}:`, error);
    // Request priority for next background fetch
    await storage.requestSTRMPriority(torrentId);
    return null;
  }
}
