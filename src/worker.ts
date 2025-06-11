import { Env, RealDebridUser, RealDebridTrafficInfo } from './types';
import { StorageManager } from './storage';
import { WebDAVGenerator } from './webdav';
import { HTMLBrowser } from './html-browser';
import { maybeRefreshTorrents, handleSTRMPriorityRequest, handleDirectoryPriorityRequest, handleTorrentPriorityRequest, testDirectoryPriorityRequest } from './handlers';
import { handleWebDAVRequest, handleWebDAVGET } from './webdav-handlers';
import { handleSTRMDownload } from './strm-handler';
import { RealDebridClient } from './realdebrid';
import { formatPoints, calculateDaysRemaining, calculateTotalTrafficServed, formatTrafficServed, convertToTorrent } from './utils';
import { populateAllTorrentDetails, maybePopulateCache } from './cache-population';

function checkBasicAuth(request: Request, env: Env): Response | null {
  if (!env.USERNAME || !env.PASSWORD) {
    return null;
  }

  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new Response('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Zurg Serverless"',
        'Content-Type': 'text/plain'
      }
    });
  }

  try {
    const base64Credentials = authHeader.substring(6);
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    if (username !== env.USERNAME || password !== env.PASSWORD) {
      return new Response('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Zurg Serverless"',
          'Content-Type': 'text/plain'
        }
      });
    }

    return null;
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response('Authentication failed', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Zurg Serverless"',
        'Content-Type': 'text/plain'
      }
    });
  }
}
async function generateStatusPage(env: Env, request: Request): Promise<string> {
  console.log('=== GENERATING STATUS PAGE ===');
  
  let userInfo = null;
  if (env.RD_TOKEN) {
    try {
      const rd = new RealDebridClient(env);
      const [user, traffic] = await Promise.all([
        rd.getUserInfo(),
        rd.getTrafficInfo()
      ]);
      userInfo = { user, traffic };
    } catch (error) {
      console.error('Failed to fetch RD user/traffic info:', error);
    }
  }

  const htmlBrowser = new HTMLBrowser(env, request);
  return await htmlBrowser.generateHomePage(userInfo);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    console.log('=== WORKER STARTED ===');
    try {
      const authResponse = checkBasicAuth(request, env);
      if (authResponse) {
        return authResponse;
      }

      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      console.log(`Request: ${request.method} ${url.pathname}`);
      console.log('Path segments:', pathSegments);
      
      if (pathSegments.length === 0) {
        console.log('=== ROOT ENDPOINT HANDLER ===');
        try {
          const html = await generateStatusPage(env, request);
          return new Response(html, { 
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        } catch (error) {
          console.error('Error in root handler:', error);
          return new Response(`Error: ${error}`, { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      if (pathSegments[0] === 'admin' && pathSegments[1] === 'update-cache') {
        console.log('Manual cache population triggered');
        await populateAllTorrentDetails(env);
        return new Response('Cache population started', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Admin endpoint to check cache progress and clear stale status
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'check-cache-progress') {
        console.log('Checking cache progress and clearing stale refresh status');
        const storage = new StorageManager(env);
        await storage.cleanupStaleRefreshProgress();
        
        // Also force complete any "running" status
        const currentStatus = await storage.getCacheRefreshStatus();
        if (currentStatus && currentStatus.status === 'running') {
          await storage.completeCacheRefresh(currentStatus.id, false, 'Manually cleared via admin endpoint');
        }
        
        return new Response('Cache progress checked and stale status cleared', { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      // Test endpoint to check IP addresses for RD API calls
      if (pathSegments[0] === 'admin' && pathSegments[1] === 'test-ip-addresses') {
        console.log('Testing IP addresses for RD API calls');
        const rd = new RealDebridClient(env);
        
        // Make multiple API calls and log IP addresses
        const results = [];
        for (let i = 0; i < 10; i++) {
          try {
            console.log(`Making API call ${i + 1}/10...`);
            const response = await fetch('https://real-debrid.com/api/v1/user', {
              headers: { 'Authorization': `Bearer ${env.RD_TOKEN}` }
            });
            
            // Log request details
            const result = {
              call: i + 1,
              status: response.status,
              cfRay: response.headers.get('cf-ray'),
              cfConnectingIp: request.headers.get('cf-connecting-ip'),
              xForwardedFor: request.headers.get('x-forwarded-for'),
              timestamp: new Date().toISOString()
            };
            
            results.push(result);
            console.log(`Call ${i + 1}: Status ${response.status}, CF-Ray: ${result.cfRay}`);
            
            // Wait 2 seconds between calls
            if (i < 9) {
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (error) {
            console.error(`API call ${i + 1} failed:`, error);
            results.push({
              call: i + 1,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        return new Response(JSON.stringify(results, null, 2), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // New progress-tracked cache refresh endpoint
      if (pathSegments[0] === 'refresh-cache') {
        if (request.method !== 'POST') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        console.log('Starting background cache refresh...');
        try {
          const storage = new StorageManager(env);
          
          // Check if refresh is already running
          const currentStatus = await storage.getCacheRefreshStatus();
          if (currentStatus && currentStatus.status === 'running') {
            // Check if the refresh is stale (older than 10 minutes with no progress)
            const now = Date.now();
            const isStale = (now - currentStatus.started_at) > (10 * 60 * 1000) && 
                           currentStatus.processed_torrents === 0;
            
            if (isStale) {
              console.log(`Clearing stale refresh: ${currentStatus.id}`);
              await storage.completeCacheRefresh(currentStatus.id, false, 'Cleared stale refresh');
            } else {
              const minutesAgo = Math.round((now - currentStatus.started_at) / (60 * 1000));
              return new Response(JSON.stringify({
                success: false,
                message: 'Cache refresh already in progress',
                refreshId: currentStatus.id,
                details: `Started ${minutesAgo} minutes ago, processed ${currentStatus.processed_torrents}/${currentStatus.total_torrents} torrents`,
                progress: currentStatus.total_torrents > 0 ? Math.round((currentStatus.processed_torrents / currentStatus.total_torrents) * 100) : 0
              }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }
          
          // Start background refresh using waitUntil
          const uncachedTorrents = await storage.getAllUncachedTorrents();
          const refreshId = await storage.startCacheRefresh(uncachedTorrents.length);
          
          // Background processing - don't wait for completion
          if (ctx && ctx.waitUntil) {
            ctx.waitUntil((async () => {
              try {
                await populateAllTorrentDetails(env, refreshId);
              } catch (error) {
                console.error('Background cache refresh failed:', error);
              }
            })());
          } else {
            // Fallback: start the process without waitUntil (it will still work)
            console.warn('ctx.waitUntil not available, starting refresh without background protection');
            populateAllTorrentDetails(env, refreshId).catch(error => {
              console.error('Cache refresh failed:', error);
            });
          }
          
          return new Response(JSON.stringify({
            success: true,
            message: 'Cache refresh started',
            refreshId,
            totalTorrents: uncachedTorrents.length
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('Failed to start cache refresh:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to start cache refresh',
            error: errorMessage,
            details: error instanceof Error ? error.stack : undefined
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Cache refresh status endpoint
      if (pathSegments[0] === 'refresh-status') {
        if (request.method !== 'GET') {
          return new Response('Method not allowed', { status: 405 });
        }
        
        try {
          const storage = new StorageManager(env);
          const url = new URL(request.url);
          const refreshId = url.searchParams.get('id');
          
          const status = await storage.getCacheRefreshStatus(refreshId ? parseInt(refreshId) : undefined);
          
          if (!status) {
            return new Response(JSON.stringify({
              success: false,
              message: 'No refresh status found'
            }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          return new Response(JSON.stringify({
            success: true,
            ...status,
            progress: status.total_torrents > 0 ? Math.round((status.processed_torrents / status.total_torrents) * 100) : 0
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('Failed to get refresh status:', error);
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to get refresh status',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      if (pathSegments[0] === 'test-rd-webdav') {
        const { testRDWebDAV } = await import('./rd-webdav-test');
        const result = await testRDWebDAV(env);
        return new Response(result, { 
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      if (pathSegments[0] === 'strm' && pathSegments.length === 2) {
        const strmCode = pathSegments[1];
        await maybeRefreshTorrents(env);
        const storage = new StorageManager(env);
        return await handleSTRMDownload(strmCode, env, storage);
      }
      const mountType = pathSegments[0] as 'dav' | 'infuse' | 'files';
      
      if (mountType !== 'dav' && mountType !== 'infuse' && mountType !== 'files') {
        return new Response('Not Found', { status: 404 });
      }

      if (!env.RD_TOKEN) {
        return new Response('Configuration Error: RD_TOKEN not set', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      if (!env.DB) {
        return new Response('Database not configured', { 
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      await maybeRefreshTorrents(env);
      await maybePopulateCache(env);
      const storage = new StorageManager(env);
      const webdav = new WebDAVGenerator(env, request);

      if (mountType === 'files') {
        const htmlBrowser = new HTMLBrowser(env, request);
        return await handleFilesRequest(pathSegments, storage, htmlBrowser, request, env);
      }

      if (request.method === 'PROPFIND') {
        return await handleWebDAVRequest(request, env, storage, webdav, mountType);
      }

      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: {
            'DAV': '1, 2',
            'MS-Author-Via': 'DAV',
            'Allow': 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, MOVE, COPY, LOCK, UNLOCK',
            'Content-Length': '0'
          }
        });
      }

      if (request.method === 'GET') {
        return await handleWebDAVGET(request, env, storage, webdav, mountType);
      }

      return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
      console.error('Worker error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log('=== CRON JOB: Cache population ===');
    try {
      const storage = new StorageManager(env);
      
      // Clean up any stale refresh progress first
      await storage.cleanupStaleRefreshProgress();
      
      // Check if there's already a refresh in progress
      const currentStatus = await storage.getCacheRefreshStatus();
      if (currentStatus && currentStatus.status === 'running') {
        // Check if the refresh is stale (older than 30 minutes with no progress)
        const now = Date.now();
        const isStale = (now - currentStatus.started_at) > (30 * 60 * 1000);
        
        if (isStale) {
          console.log(`Clearing stale refresh from cron: ${currentStatus.id}`);
          await storage.completeCacheRefresh(currentStatus.id, false, 'Cleared stale refresh (cron timeout)');
        } else {
          console.log('Cache refresh already in progress, skipping cron job');
          return;
        }
      }
      
      // Start cache population
      await populateAllTorrentDetails(env);
      console.log('✅ Scheduled cache population complete');
    } catch (error) {
      console.error('❌ Scheduled cache population failed:', error);
    }
  }
};

async function handleFilesRequest(pathSegments: string[], storage: StorageManager, htmlBrowser: HTMLBrowser, request: Request, env: Env): Promise<Response> {
  console.log('=== Files Request Handler ===');
  const filesPath = pathSegments.slice(1);
  
  if (filesPath.length === 0) {
    await maybeRefreshTorrents(env);
    const directories = await storage.getAllDirectories();
    const html = await htmlBrowser.generateFilesRootPage(directories);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (filesPath.length === 1) {
    const torrentName = decodeURIComponent(filesPath[0]);
    const { fetchTorrentDetails } = await import('./handlers');
    const torrent = await fetchTorrentDetails(torrentName, env, storage);
    
    if (!torrent) {
      return new Response(htmlBrowser.generateErrorPage('Torrent Not Found', 
        `The torrent "${torrentName}" was not found.`), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    const html = await htmlBrowser.generateTorrentFilesPage(torrentName, torrent);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (filesPath.length === 2) {
    const torrentName = decodeURIComponent(filesPath[0]);
    const fileName = decodeURIComponent(filesPath[1]);
    const { fetchTorrentDetails, fetchFileDownloadLink } = await import('./handlers');
    const torrent = await fetchTorrentDetails(torrentName, env, storage);
    
    if (!torrent) {
      return new Response(htmlBrowser.generateErrorPage('Torrent Not Found', 
        `The torrent "${torrentName}" was not found.`), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    const file = torrent.selectedFiles[fileName];
    if (!file) {
      return new Response(htmlBrowser.generateErrorPage('File Not Found', 
        `The file "${fileName}" was not found in torrent "${torrentName}".`), {
        status: 404,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      });
    }
    
    // Fetch fresh download link when viewing file details (one of the 3 allowed scenarios)
    if (!file.link) {
      console.log(`🔗 Fetching fresh download link for file details view: ${fileName}`);
      const freshLink = await fetchFileDownloadLink(torrent.id, fileName, env, storage);
      if (freshLink) {
        file.link = freshLink;
      }
    }
    
    const html = await htmlBrowser.generateFileDetailsPage(torrentName, fileName, file);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  if (filesPath.length === 3 && filesPath[2].endsWith('.strm')) {
    const torrentName = decodeURIComponent(filesPath[0]);
    const fileName = decodeURIComponent(filesPath[1]);
    const strmFileName = decodeURIComponent(filesPath[2]);
    
    const { fetchTorrentDetails, fetchFileDownloadLink } = await import('./handlers');
    const torrent = await fetchTorrentDetails(torrentName, env, storage);
    
    if (!torrent) {
      return new Response('Torrent not found', { status: 404 });
    }
    
    const file = torrent.selectedFiles[fileName];
    if (!file) {
      return new Response('File not found', { status: 404 });
    }
    
    // Try to get fresh download link if missing, but proceed regardless
    let downloadLink = file.link;
    if (!downloadLink) {
      console.log(`🔗 Fetching fresh download link for STRM download: ${fileName}`);
      try {
        downloadLink = await fetchFileDownloadLink(torrent.id, fileName, env, storage);
      } catch (error) {
        console.warn(`⚠️ Failed to fetch download link for ${fileName}:`, error);
        downloadLink = null;
      }
    }
    
    // Always generate STRM content (with fallback if no valid link)
    const webdav = new (await import('./webdav')).WebDAVGenerator(env, request);
    let strmContent;
    try {
      strmContent = await webdav.generateSTRMContent(torrentName, torrent.id, fileName, downloadLink);
    } catch (error) {
      console.error(`Failed to generate STRM content for ${fileName}, using fallback:`, error);
      strmContent = await webdav.generateSTRMContent(torrentName, torrent.id, fileName, null);
    }
    
    return new Response(strmContent.content, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${strmFileName}"`,
        'Content-Length': strmContent.size.toString()
      }
    });
  }

  return new Response(htmlBrowser.generateErrorPage('Not Found', 
    'The requested page was not found.'), {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
