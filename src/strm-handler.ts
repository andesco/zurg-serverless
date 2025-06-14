import { Env } from './types';
import { STRMCacheManager } from './strm-cache';
import { StorageManager } from './storage';

export async function handleSTRMDownload(
  strmCode: string,
  env: Env,
  storage: StorageManager
): Promise<Response> {
  try {
    console.log('STRM Download - Code requested:', strmCode);
    
    // Validate code format (16 characters, alphanumeric)
    if (!/^[A-Z0-9]{16}$/.test(strmCode)) {
      console.log('STRM Download - Invalid code format:', strmCode);
      return new Response('Invalid STRM code format', { status: 400 });
    }

    const cacheManager = new STRMCacheManager(env);
    let downloadUrl = await cacheManager.resolveSTRMCode(strmCode);

    if (!downloadUrl) {
      console.log('STRM Download - Code not found or expired, trying to fetch fresh link:', strmCode);
      
      // Try to get the torrent and file info from the STRM mapping
      const strmInfo = await cacheManager.getSTRMInfo(strmCode);
      if (strmInfo) {
        console.log(`🔗 Fetching fresh download link for expired STRM: ${strmInfo.filename}`);
        
        try {
          // Fetch fresh download link (one of the 3 allowed scenarios)
          const { fetchFileDownloadLink } = await import('./handlers');
          const freshLink = await fetchFileDownloadLink(strmInfo.torrentId, strmInfo.filename, env, storage);
          
          if (freshLink) {
            // Update the STRM cache with fresh link
            const newCode = await cacheManager.getOrCreateSTRMCode(
              strmInfo.directory, 
              strmInfo.torrentId, 
              strmInfo.filename, 
              freshLink
            );
            downloadUrl = freshLink;
            console.log(`✅ Updated STRM cache with fresh download link`);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to fetch fresh download link: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue to fallback below
        }
      }
      
      if (!downloadUrl) {
        console.log('STRM Download - Using fallback for unavailable link:', strmCode);
        downloadUrl = `${env.BASE_URL || 'https://zurg.andrewe.dev'}/not_found.mp4`;
      }
    }

    console.log('STRM Download - Redirecting to download URL');

    return new Response(null, {
      status: 302,
      headers: {
        'Location': downloadUrl,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('STRM download error:', error);
    return new Response(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
