// Cache population functions
import { Env } from './types';
import { StorageManager } from './storage';
import { RealDebridClient } from './realdebrid';
import { convertToTorrent } from './utils';

// Populate all uncached torrents with progress tracking
export async function populateAllTorrentDetails(env: Env, refreshId?: number): Promise<void> {
  console.log('=== Starting bulk torrent cache population ===');
  const storage = new StorageManager(env);
  const rd = new RealDebridClient(env);
  
  // Get all torrents without cached details
  const uncachedTorrents = await storage.getAllUncachedTorrents();
  console.log(`Found ${uncachedTorrents.length} uncached torrents`);
  
  if (uncachedTorrents.length === 0) {
    console.log('All torrents already cached');
    if (refreshId) {
      await storage.completeCacheRefresh(refreshId, true, 'All torrents already cached');
    }
    return;
  }
  
  // Start progress tracking if not provided
  if (!refreshId) {
    refreshId = await storage.startCacheRefresh(uncachedTorrents.length);
    console.log(`Started new cache refresh with ID: ${refreshId}`);
  } else {
    console.log(`Using existing cache refresh ID: ${refreshId}`);
  }
  
  let processedCount = 0;
  let successCount = 0;
  let failureCount = 0;
  
  try {
    // Conservative batching to respect Real-Debrid API limits
    const batchSize = 5;
    const maxTorrentsPerCron = 100;
    const torrentsToProcess = Math.min(uncachedTorrents.length, maxTorrentsPerCron);
    const batchesToProcess = Math.ceil(torrentsToProcess / batchSize);
    
    console.log(`Processing ${torrentsToProcess} of ${uncachedTorrents.length} uncached torrents in ${batchesToProcess} batches`);
    
    for (let i = 0; i < torrentsToProcess; i += batchSize) {
      const batch = uncachedTorrents.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`Processing batch ${batchNumber}/${batchesToProcess} (${batch.length} torrents)`);
      
      await Promise.all(batch.map(async (torrent) => {
        try {
          console.log(`Fetching details for: ${torrent.name}`);
          
          // Update progress with current torrent
          await storage.updateCacheProgress(refreshId!, processedCount, torrent.name);
          
          const details = await rd.getTorrentInfo(torrent.id);
          if (details) {
            const convertedTorrent = convertToTorrent(details);
            convertedTorrent.cacheTimestamp = Date.now();
            await storage.saveTorrentDetails(torrent.id, convertedTorrent);
            console.log(`✅ Cached ${torrent.name} (${Object.keys(convertedTorrent.selectedFiles).length} files)`);
            successCount++;
          } else {
            console.warn(`⚠️ No details returned for ${torrent.name}`);
            failureCount++;
          }
          
          processedCount++;
          await storage.updateCacheProgress(refreshId!, processedCount);
          
        } catch (error) {
          console.error(`❌ Failed to cache ${torrent.name}:`, error);
          processedCount++; // Still count as processed even if failed
          failureCount++;
          await storage.updateCacheProgress(refreshId!, processedCount);
        }
      }));
      
      // Adaptive delay between batches to respect API rate limits
      if (i + batchSize < torrentsToProcess) {
        const delaySeconds = 20; // Fixed 20 seconds between all batches
        console.log(`Waiting ${delaySeconds}s before next batch to respect API limits...`);
        await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
      }
    }
    
    // Mark as completed (or partially completed if we hit the limit)
    const remaining = uncachedTorrents.length - torrentsToProcess;
    const completionMessage = remaining > 0 
      ? `Processed ${torrentsToProcess} torrents (${successCount} success, ${failureCount} failures), ${remaining} remaining for next cron job`
      : `Successfully cached ${successCount} torrents, ${failureCount} failures`;
      
    await storage.completeCacheRefresh(refreshId, remaining === 0, completionMessage);
    console.log(`✅ Cache population batch complete: ${completionMessage}`);
    
  } catch (error) {
    console.error('❌ Cache population failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await storage.completeCacheRefresh(refreshId, false, `Failed after processing ${processedCount}/${uncachedTorrents.length}: ${errorMessage}`);
    throw error;
  }
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
