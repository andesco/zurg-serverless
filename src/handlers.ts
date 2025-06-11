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
    console.log('Refreshing torrent list from Real Debrid...');
    await refreshTorrentList(env, storage);
  } else {
    console.log('Using cached torrent list');
  }
}

// Enhanced refresh - fetch torrent list + details for new torrents
async function refreshTorrentList(env: Env, storage: StorageManager): Promise<void> {
  console.log('=== Starting torrent list refresh ===');
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
    
    // Get current cached torrent IDs to detect new ones
    const currentTorrentIds = new Set(downloadedTorrents.map(t => t.id));
    const previousTorrentIds = await storage.getCachedTorrentIds();
    const newTorrentIds = previousTorrentIds 
      ? Array.from(currentTorrentIds).filter(id => !previousTorrentIds.has(id))
      : [];
    
    console.log(`📊 Cache analysis: ${downloadedTorrents.length} total, ${newTorrentIds.length} new torrents`);
    
    // Build simple directory map - each torrent is its own directory
    // IMPORTANT: Preserve existing cached details
    const directoryMap: DirectoryMap = {};
    
    for (const rdTorrent of downloadedTorrents) {
      // Check if we already have cached details for this torrent
      const existingTorrent = await storage.getTorrent(rdTorrent.id);
      
      const torrent = {
        id: rdTorrent.id,
        name: rdTorrent.filename,
        originalName: rdTorrent.filename,
        hash: rdTorrent.hash,
        added: rdTorrent.added,
        ended: rdTorrent.ended,
        // Preserve existing cached file details if available
        selectedFiles: existingTorrent?.selectedFiles || {}, 
        downloadedIDs: [],
        state: 'ok_torrent' as const,
        totalSize: rdTorrent.bytes,
        // Preserve existing cache timestamp
        cacheTimestamp: existingTorrent?.cacheTimestamp
      };
      
      // Use exact torrent name as directory
      const directoryName = rdTorrent.filename;
      directoryMap[directoryName] = { [rdTorrent.id]: torrent };
    }
    
    // Proactively fetch details for up to 5 newest torrents
    if (newTorrentIds.length > 0) {
      const immediateLimit = Math.min(5, newTorrentIds.length);
      const immediateTorrents = newTorrentIds.slice(0, immediateLimit);
      
      console.log(`🚀 Proactively fetching details for ${immediateLimit} newest torrents...`);
      
      for (const torrentId of immediateTorrents) {
        try {
          const rdTorrent = downloadedTorrents.find(t => t.id === torrentId);
          if (!rdTorrent) continue;
          
          console.log(`📥 Fetching details for new torrent: ${rdTorrent.filename}`);
          const torrentInfo = await rd.getTorrentInfo(torrentId);
          
          if (torrentInfo) {
            const detailedTorrent = convertToTorrent(torrentInfo);
            detailedTorrent.cacheTimestamp = Date.now();
            
            // Update the directory map with detailed info
            const directoryName = rdTorrent.filename;
            if (directoryMap[directoryName] && directoryMap[directoryName][torrentId]) {
              directoryMap[directoryName][torrentId] = detailedTorrent;
              console.log(`✅ Cached details for ${rdTorrent.filename} (${Object.keys(detailedTorrent.selectedFiles).length} files)`);
            }
          }
        } catch (error) {
          console.error(`❌ Failed to fetch details for new torrent ${torrentId}:`, error);
          // Continue with other torrents
        }
      }
      
      if (newTorrentIds.length > immediateLimit) {
        console.log(`⏳ ${newTorrentIds.length - immediateLimit} additional new torrents will be cached by background processing`);
      }
    }
    
    console.log(`✅ Torrent list refresh complete: ${downloadedTorrents.length} torrents processed, ${Math.min(5, newTorrentIds.length)} detailed immediately`);
    
    // Save to database
    await storage.setDirectoryMap(directoryMap);
    await storage.setCacheMetadata({
      lastRefresh: Date.now(),
      libraryChecksum: JSON.stringify(downloadedTorrents.map(t => t.id).sort()).length.toString(),
      torrentIds: downloadedTorrents.map(t => t.id)
    });
    
  } catch (error) {
    console.error('❌ Failed to refresh torrent list:', error);
    throw error;
  }
}

// Fetch individual torrent details on demand (file list only, no download links)
export async function fetchTorrentDetails(torrentName: string, env: Env, storage: StorageManager): Promise<Torrent | null> {
  console.log(`=== Fetching details for torrent ${torrentName} ===`);
  
  // Handle test broken torrent
  if (torrentName === 'Test.Broken.Movie.2024.1080p.WEB-DL.x264') {
    console.log('Test broken torrent - returning test data');
    return {
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
    };
  }
  
  // First get the torrent from the directory to find its ID
  console.log(`🔍 Looking for directory: ${torrentName}`);
  const directoryTorrents = await storage.getDirectory(torrentName);
  console.log(`📂 Directory result:`, directoryTorrents ? `Found ${Object.keys(directoryTorrents).length} torrents` : 'Not found');
  
  if (!directoryTorrents || Object.keys(directoryTorrents).length === 0) {
    console.log(`❌ Torrent directory ${torrentName} not found`);
    return null;
  }
  
  const torrent = Object.values(directoryTorrents)[0];
  const torrentId = torrent.id;
  console.log(`🎯 Found torrent ID: ${torrentId}, current cache timestamp: ${torrent.cacheTimestamp}, files: ${Object.keys(torrent.selectedFiles).length}`);
  
  // Check if we have cached details (within 7 days)
  if (torrent.cacheTimestamp) {
    const cacheAge = Date.now() - torrent.cacheTimestamp;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (cacheAge < sevenDays && Object.keys(torrent.selectedFiles).length > 0) {
      console.log(`✅ Using cached details for torrent ${torrentName} (${Math.round(cacheAge / (1000 * 60 * 60))}h old)`);
      return torrent;
    } else {
      console.log(`♻️ Cached details expired or empty for torrent ${torrentName} (${Math.round(cacheAge / (1000 * 60 * 60))}h old)`);
    }
  } else {
    console.log(`🚫 No cache timestamp found for torrent ${torrentName}`);
  }
  
  // Fetch fresh details from Real-Debrid (file list only, preserve existing download links)
  console.log(`📡 Fetching fresh details from Real-Debrid for torrent ID: ${torrentId}`);
  try {
    const rd = new RealDebridClient(env);
    const torrentInfo = await rd.getTorrentInfo(torrentId);
    
    console.log(`📡 Real-Debrid response:`, torrentInfo ? 'Success' : 'Failed/Null');
    
    if (!torrentInfo) {
      console.log(`❌ Torrent ${torrentId} not found on Real-Debrid`);
      return null;
    }
    
    console.log(`🔧 Converting torrent info to internal format...`);
    const detailedTorrent = convertToTorrent(torrentInfo);
    console.log(`🔧 Converted torrent has ${Object.keys(detailedTorrent.selectedFiles).length} files`);
    
    // If we had existing cached files with download links, preserve those links
    if (torrent.selectedFiles && Object.keys(torrent.selectedFiles).length > 0) {
      console.log(`🔗 Preserving existing download links for ${Object.keys(torrent.selectedFiles).length} files`);
      
      // Merge: use new file info but preserve existing download links if they exist
      for (const [filename, newFile] of Object.entries(detailedTorrent.selectedFiles)) {
        const existingFile = torrent.selectedFiles[filename];
        if (existingFile && existingFile.link) {
          // Preserve existing download link
          newFile.link = existingFile.link;
          newFile.ended = existingFile.ended; // Preserve link timestamp
        }
      }
    }
    
    detailedTorrent.cacheTimestamp = Date.now(); // Add cache timestamp
    console.log(`💾 Saving torrent details to cache with timestamp: ${detailedTorrent.cacheTimestamp}`);
    
    // Save to cache
    await storage.saveTorrentDetails(torrentId, detailedTorrent);
    
    console.log(`✅ Fetched and cached details for torrent ${torrentName} (${Object.keys(detailedTorrent.selectedFiles).length} files)`);
    return detailedTorrent;
    
  } catch (error) {
    console.error(`❌ Failed to fetch details for torrent ${torrentName}:`, error);
    return null;
  }
}

// Fetch fresh download link for a specific file (only when needed)
export async function fetchFileDownloadLink(torrentId: string, filename: string, env: Env, storage: StorageManager): Promise<string | null> {
  console.log(`=== Fetching download link for ${filename} in torrent ${torrentId} ===`);
  
  // Handle test broken torrent
  if (torrentId === 'TEST_BROKEN_123') {
    console.log('Test broken torrent - returning null for fallback');
    return null;
  }
  
  try {
    const rd = new RealDebridClient(env);
    const torrentInfo = await rd.getTorrentInfo(torrentId);
    
    if (!torrentInfo) {
      console.log(`❌ Torrent ${torrentId} not found on Real-Debrid`);
      return null;
    }
    
    const detailedTorrent = convertToTorrent(torrentInfo);
    const file = detailedTorrent.selectedFiles[filename];
    
    if (!file || !file.link) {
      console.log(`❌ File ${filename} not found or no download link available`);
      return null;
    }
    
    // Update the cached torrent with the fresh download link
    const directoryName = torrentInfo.filename; // Use exact torrent name as directory
    const existingTorrents = await storage.getDirectory(directoryName);
    
    if (existingTorrents) {
      const existingTorrent = Object.values(existingTorrents)[0];
      if (existingTorrent && existingTorrent.selectedFiles[filename]) {
        // Update just this file's download link
        existingTorrent.selectedFiles[filename].link = file.link;
        existingTorrent.selectedFiles[filename].ended = file.ended;
        
        // Save updated torrent back to cache
        await storage.saveTorrentDetails(torrentId, existingTorrent);
        console.log(`✅ Updated download link for ${filename}`);
      }
    }
    
    return file.link;
    
  } catch (error) {
    console.error(`❌ Failed to fetch download link for ${filename}:`, error);
    return null;
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

// Enhanced handler for immediate torrent detail fetching when browsing directories
export async function handleDirectoryPriorityRequest(directory: string, env: Env, storage: StorageManager): Promise<Record<string, Torrent>> {
  console.log(`🔥 Directory priority request for: ${directory}`);
  
  // Get the basic torrents first
  const basicTorrents = await storage.getDirectory(directory);
  if (!basicTorrents) {
    console.log(`❌ Directory ${directory} not found`);
    return {};
  }
  
  console.log(`📁 Found ${Object.keys(basicTorrents).length} torrents in ${directory}`);
  
  // Check which torrents need detailed file information
  const torrentsNeedingDetails: string[] = [];
  for (const [accessKey, torrent] of Object.entries(basicTorrents)) {
    const fileCount = Object.keys(torrent.selectedFiles || {}).length;
    if (fileCount === 0) {
      torrentsNeedingDetails.push(torrent.id);
    }
  }
  
  console.log(`🔍 ${torrentsNeedingDetails.length} torrents need file details`);
  
  if (torrentsNeedingDetails.length > 0) {
    // Fetch details for torrents that don't have file information
    const rd = new RealDebridClient(env);
    const fetchLimit = Math.min(torrentsNeedingDetails.length, 20); // Limit to 20 to avoid timeout
    
    console.log(`📥 Fetching details for ${fetchLimit} torrents...`);
    
    for (let i = 0; i < fetchLimit; i++) {
      const torrentId = torrentsNeedingDetails[i];
      try {
        console.log(`📥 Fetching details for torrent ${i + 1}/${fetchLimit}: ${torrentId}`);
        
        const torrentInfo = await rd.getTorrentInfo(torrentId);
        const detailedTorrent = convertToTorrent(torrentInfo);
        
        if (detailedTorrent && Object.keys(detailedTorrent.selectedFiles).length > 0) {
          await storage.cacheTorrentDetails(torrentId, detailedTorrent, null);
          
          // Update the torrent in our result
          for (const [accessKey, torrent] of Object.entries(basicTorrents)) {
            if (torrent.id === torrentId) {
              basicTorrents[accessKey] = detailedTorrent;
              break;
            }
          }
          
          console.log(`✅ Cached ${Object.keys(detailedTorrent.selectedFiles).length} files for ${detailedTorrent.name}`);
        }
      } catch (error) {
        console.error(`❌ Failed to fetch details for torrent ${torrentId}:`, error);
        // Continue with next torrent
      }
    }
    
    console.log(`✅ Directory priority fetch complete: ${fetchLimit} torrents processed`);
  }
  
  return basicTorrents;
}
// Enhanced handler for individual torrent requests with immediate file detail fetching
export async function handleTorrentPriorityRequest(directory: string, torrentName: string, env: Env, storage: StorageManager): Promise<{ torrent: Torrent; accessKey: string } | null> {
  console.log(`🔥 Torrent priority request for: ${directory}/${torrentName}`);
  
  // Get the basic torrent first
  const result = await storage.getTorrentByName(directory, torrentName);
  if (!result) {
    console.log(`❌ Torrent ${directory}/${torrentName} not found`);
    return null;
  }
  
  const { torrent, accessKey } = result;
  const fileCount = Object.keys(torrent.selectedFiles || {}).length;
  
  console.log(`🎬 Found torrent: ${torrent.name} with ${fileCount} files`);
  
  // If no files cached, fetch them immediately
  if (fileCount === 0) {
    console.log(`📥 Fetching file details for torrent: ${torrent.id}`);
    
    try {
      const rd = new RealDebridClient(env);
      const torrentInfo = await rd.getTorrentInfo(torrent.id);
      const detailedTorrent = convertToTorrent(torrentInfo);
      
      if (detailedTorrent && Object.keys(detailedTorrent.selectedFiles).length > 0) {
        await storage.cacheTorrentDetails(torrent.id, detailedTorrent, null);
        console.log(`✅ Cached ${Object.keys(detailedTorrent.selectedFiles).length} files for ${detailedTorrent.name}`);
        
        return { torrent: detailedTorrent, accessKey };
      } else {
        console.log(`⚠️ No files found in torrent: ${torrent.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to fetch details for torrent ${torrent.id}:`, error);
      // Return basic torrent even if detail fetch failed
    }
  }
  
  return { torrent, accessKey };
}
// Simple test version of priority fetching
export async function testDirectoryPriorityRequest(directory: string, env: Env, storage: StorageManager): Promise<Record<string, Torrent>> {
  console.log(`🧪 TEST: Directory priority request for: ${directory}`);
  
  try {
    // Get the basic torrents first
    const basicTorrents = await storage.getDirectory(directory);
    if (!basicTorrents) {
      console.log(`❌ TEST: Directory ${directory} not found`);
      return {};
    }
    
    console.log(`📁 TEST: Found ${Object.keys(basicTorrents).length} torrents in ${directory}`);
    
    // Check which torrents need detailed file information
    const torrentsNeedingDetails: string[] = [];
    for (const [accessKey, torrent] of Object.entries(basicTorrents)) {
      const fileCount = Object.keys(torrent.selectedFiles || {}).length;
      console.log(`🔍 TEST: Torrent ${torrent.name} has ${fileCount} files cached`);
      if (fileCount === 0) {
        torrentsNeedingDetails.push(torrent.id);
      }
    }
    
    console.log(`🔍 TEST: ${torrentsNeedingDetails.length} torrents need file details`);
    
    if (torrentsNeedingDetails.length > 0) {
      // For testing, limit to just 2 torrents to avoid timeouts
      const testLimit = Math.min(torrentsNeedingDetails.length, 2);
      console.log(`📥 TEST: Fetching details for ${testLimit} torrents...`);
      
      const rd = new RealDebridClient(env);
      
      for (let i = 0; i < testLimit; i++) {
        const torrentId = torrentsNeedingDetails[i];
        console.log(`📥 TEST: Fetching details for torrent ${i + 1}/${testLimit}: ${torrentId}`);
        
        try {
          const torrentInfo = await rd.getTorrentInfo(torrentId);
          const detailedTorrent = convertToTorrent(torrentInfo);
          
          if (detailedTorrent && Object.keys(detailedTorrent.selectedFiles).length > 0) {
            await storage.cacheTorrentDetails(torrentId, detailedTorrent, null);
            
            // Update the torrent in our result
            for (const [accessKey, torrent] of Object.entries(basicTorrents)) {
              if (torrent.id === torrentId) {
                basicTorrents[accessKey] = detailedTorrent;
                break;
              }
            }
            
            console.log(`✅ TEST: Cached ${Object.keys(detailedTorrent.selectedFiles).length} files for ${detailedTorrent.name}`);
          }
        } catch (error) {
          console.error(`❌ TEST: Failed to fetch details for torrent ${torrentId}:`, error);
          // Continue with next torrent
        }
      }
      
      console.log(`✅ TEST: Priority fetch complete: ${testLimit} torrents processed`);
    }
    
    return basicTorrents;
  } catch (error) {
    console.error(`❌ TEST: Directory priority request failed:`, error);
    // Fall back to basic method
    return await storage.getDirectory(directory) || {};
  }
}