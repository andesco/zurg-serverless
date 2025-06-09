// Cache population functions
import { Env } from './types';
import { StorageManager } from './storage';
import { RealDebridClient } from './realdebrid';
import { convertToTorrent } from './utils';

// Populate all uncached torrents
export async function populateAllTorrentDetails(env: Env): Promise<void> {
  console.log('=== Starting bulk torrent cache population ===');
  const storage = new StorageManager(env);
  const rd = new RealDebridClient(env);
  
  // Get all torrents without cached details
  const uncachedTorrents = await storage.getAllUncachedTorrents();
  console.log(`Found ${uncachedTorrents.length} uncached torrents`);
  
  if (uncachedTorrents.length === 0) {
    console.log('All torrents already cached');
    return;
  }
  
  // Process in batches of 10 to avoid timeouts
  for (let i = 0; i < uncachedTorrents.length; i += 10) {
    const batch = uncachedTorrents.slice(i, i + 10);
    console.log(`Processing batch ${Math.floor(i/10) + 1}/${Math.ceil(uncachedTorrents.length/10)} (${batch.length} torrents)`);
    
    await Promise.all(batch.map(async (torrent) => {
      try {
        console.log(`Fetching details for: ${torrent.name}`);
        const details = await rd.getTorrentInfo(torrent.id);
        if (details) {
          const convertedTorrent = convertToTorrent(details);
          convertedTorrent.cacheTimestamp = Date.now();
          await storage.saveTorrentDetails(torrent.id, convertedTorrent);
          console.log(`✅ Cached ${torrent.name} (${Object.keys(convertedTorrent.selectedFiles).length} files)`);
        }
      } catch (error) {
        console.error(`❌ Failed to cache ${torrent.name}:`, error);
      }
    }));
  }
  
  console.log('✅ Bulk cache population complete');
}
// Check if cache population is needed and trigger if so
export async function maybePopulateCache(env: Env): Promise<void> {
  const storage = new StorageManager(env);
  const cacheStats = await storage.getCacheStatistics();
  
  // If no cached torrents but we have basic torrents, populate immediately
  const hasBasicTorrents = cacheStats.total > 0;
  const hasDetailedCache = cacheStats.cached > 0;
  
  if (hasBasicTorrents && !hasDetailedCache) {
    console.log('Empty cache detected, starting population...');
    await populateAllTorrentDetails(env);
  }
}
