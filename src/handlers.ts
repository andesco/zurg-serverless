import { Env, DirectoryMap } from './types';
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
    await refreshTorrents(env, storage);
  } else {
    console.log('Using cached torrent data');
  }
}

async function refreshTorrents(env: Env, storage: StorageManager): Promise<void> {
  console.log('=== Starting torrent refresh ===');
  const rd = new RealDebridClient(env);
  const pageSize = parseInt(env.TORRENTS_PAGE_SIZE || '1000');
  
  try {
    console.log(`Fetching torrents from Real Debrid (page size: ${pageSize})...`);
    const rdTorrents = await rd.getTorrents(1, pageSize);
    console.log(`Received ${rdTorrents.length} torrents from Real Debrid`);
    
    const directoryMap: DirectoryMap = { __all__: {} };
    let processedCount = 0;
    
    for (const rdTorrent of rdTorrents) {
      if (rdTorrent.status !== 'downloaded' || rdTorrent.progress !== 100) {
        continue;
      }
      
      try {
        const torrentInfo = await rd.getTorrentInfo(rdTorrent.id);
        const torrent = convertToTorrent(torrentInfo);
        
        if (torrent) {
          directoryMap.__all__[torrent.id] = torrent;
          processedCount++;
        }
      } catch (torrentError) {
        console.error(`Failed to process torrent ${rdTorrent.id}:`, torrentError);
      }
    }

    await storage.setDirectoryMap(directoryMap);
    await storage.setCacheMetadata({
      lastRefresh: Date.now(),
      libraryChecksum: JSON.stringify(rdTorrents).length.toString(),
    });
    
    console.log(`✅ Refresh complete: ${processedCount} torrents processed`);
  } catch (error) {
    console.error('❌ Failed to refresh torrents:', error);
    
    // More detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Check if it's a network/API error
    if (error.message?.includes('RD API Error')) {
      console.error('🔍 This appears to be a Real Debrid API error. Check:');
      console.error('  1. Your RD_TOKEN is valid');
      console.error('  2. Your Real Debrid account is active');
      console.error('  3. Network connectivity');
    }
    
    throw error; // Re-throw to bubble up
  }
}
