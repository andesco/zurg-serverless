import { Env, RealDebridUser, RealDebridTrafficInfo } from './types';
import { StorageManager } from './storage';
import { WebDAVGenerator } from './webdav';
import { HTMLBrowser } from './html-browser';
import { maybeRefreshTorrents } from './handlers';
import { handleWebDAVRequest, handleWebDAVGET } from './webdav-handlers';
import { handleSTRMDownload } from './strm-handler';
import { RealDebridClient } from './realdebrid';
import { formatPoints, calculateDaysRemaining, calculateTotalTrafficServed, formatTrafficServed } from './utils';

function checkBasicAuth(request: Request, env: Env): Response | null {
  // If no USERNAME or PASSWORD is configured, skip authentication
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
    // Decode the base64 credentials
    const base64Credentials = authHeader.substring(6); // Remove 'Basic ' prefix
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');

    // Check credentials
    if (username !== env.USERNAME || password !== env.PASSWORD) {
      return new Response('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Zurg Serverless"',
          'Content-Type': 'text/plain'
        }
      });
    }

    // Authentication successful
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
  
  // Get user info for Real Debrid Account block
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

  // Use HTMLBrowser to generate the home page with the same styling
  const htmlBrowser = new HTMLBrowser(env, request);
  return await htmlBrowser.generateHomePage(userInfo);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('=== WORKER STARTED ===');
    try {
      // Check basic authentication first
      const authResponse = checkBasicAuth(request, env);
      if (authResponse) {
        return authResponse;
      }

      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      console.log(`Request: ${request.method} ${url.pathname}`);
      console.log('Path segments:', pathSegments);
      console.log('Environment check - RD_TOKEN:', !!env.RD_TOKEN);
      console.log('Environment check - DB:', !!env.DB);
      
      if (pathSegments.length === 0) {
        console.log('=== ROOT ENDPOINT HANDLER ===');
        try {
          console.log('Building status page...');
          
          // Generate HTML status page instead of text
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

      // Handle STRM download requests
      if (pathSegments[0] === 'strm' && pathSegments.length === 2) {
        const strmCode = pathSegments[1];
        await maybeRefreshTorrents(env);
        const storage = new StorageManager(env);
        return await handleSTRMDownload(strmCode, env, storage);
      }

      const mountType = pathSegments[0] as 'dav' | 'infuse' | 'html';
      
      if (mountType !== 'dav' && mountType !== 'infuse' && mountType !== 'html') {
        return new Response('Not Found', { status: 404 });
      }

      if (!env.RD_TOKEN) {
        return new Response('Configuration Error: RD_TOKEN not set', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
        });
      }

      if (!env.DB) {
        return new Response(`
<!DOCTYPE html>
<html>
<head>
  <title>Zurg Serverless - Setup Required</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .container { text-align: center; }
    .error { background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .setup { background: #efe; border: 1px solid #cfc; padding: 20px; border-radius: 8px; margin: 20px 0; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 4px; text-align: left; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏗️ Zurg Serverless</h1>
    <div class="error">
      <h2>⚠️ Database Not Configured</h2>
      <p>D1 database binding is not available. The database needs to be created and configured.</p>
    </div>
    
    <div class="setup">
      <h2>🚀 Quick Setup</h2>
      <p>Stop the current dev server and run:</p>
      <pre><code>npm run dev</code></pre>
      <p>This will automatically create and configure your D1 database.</p>
    </div>
    
    <div class="setup">
      <h2>🔧 Manual Setup</h2>
      <p>Or create the database manually:</p>
      <pre><code>npm run setup-d1</code></pre>
      <p>Then restart with <code>wrangler dev</code></p>
    </div>
    
    <div style="margin-top: 40px; color: #666; font-size: 14px;">
      <p>For more information, see the project README.</p>
    </div>
  </div>
</body>
</html>`, { 
          status: 503,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      await maybeRefreshTorrents(env);
      const storage = new StorageManager(env);
      const webdav = new WebDAVGenerator(env, request);

      // Handle HTML browser requests
      if (mountType === 'html') {
        const htmlBrowser = new HTMLBrowser(env, request);
        return await handleHTMLRequest(pathSegments, storage, htmlBrowser);
      }

      if (request.method === 'PROPFIND') {
        console.log('Handling WebDAV PROPFIND request...');
        try {
          return await handleWebDAVRequest(request, env, storage, webdav, mountType);
        } catch (webdavError) {
          console.error('WebDAV PROPFIND error:', webdavError);
          return new Response(`WebDAV Error: ${webdavError instanceof Error ? webdavError.message : 'Unknown'}`, { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      if (request.method === 'OPTIONS') {
        console.log('Handling WebDAV OPTIONS request...');
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
        console.log('Handling WebDAV GET request...');
        try {
          return await handleWebDAVGET(request, env, storage, webdav, mountType);
        } catch (webdavError) {
          console.error('WebDAV GET error:', webdavError);
          return new Response(`WebDAV Error: ${webdavError instanceof Error ? webdavError.message : 'Unknown'}`, { 
            status: 500,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }

      return new Response('Method Not Allowed', { status: 405 });
    } catch (error) {
      console.error('=== WORKER ERROR ===');
      console.error('Worker error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
    }
  },
};


async function handleHTMLRequest(pathSegments: string[], storage: StorageManager, htmlBrowser: HTMLBrowser): Promise<Response> {
  // Remove 'html' from pathSegments
  const htmlPath = pathSegments.slice(1);
  
  if (htmlPath.length === 0) {
    // Root HTML page - show directories
    const directories = await storage.getAllDirectories();
    const html = await htmlBrowser.generateRootPage(directories);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (htmlPath.length === 1) {
    // Directory page - show torrents in directory
    const directory = decodeURIComponent(htmlPath[0]);
    const torrents = await storage.getDirectory(directory);
    
    if (!torrents) {
      return new Response('Directory not found', { status: 404 });
    }
    
    const html = htmlBrowser.generateDirectoryPage(directory, torrents);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (htmlPath.length === 2) {
    // Torrent page - show STRM files in torrent
    const directory = decodeURIComponent(htmlPath[0]);
    const torrentName = decodeURIComponent(htmlPath[1]);
    
    const result = await storage.getTorrentByName(directory, torrentName);
    
    if (!result) {
      return new Response('Torrent not found', { status: 404 });
    }
    
    const { torrent } = result;
    const html = htmlBrowser.generateTorrentPage(directory, torrent, torrentName);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (htmlPath.length === 3) {
    // STRM file content page
    const directory = decodeURIComponent(htmlPath[0]);
    const torrentName = decodeURIComponent(htmlPath[1]);
    const filename = decodeURIComponent(htmlPath[2]);
    
    if (!filename.endsWith('.strm')) {
      return new Response('Not a STRM file', { status: 400 });
    }
    
    const result = await storage.getTorrentByName(directory, torrentName);
    
    if (!result) {
      return new Response('Torrent not found', { status: 404 });
    }
    
    const { torrent } = result;
    const html = await htmlBrowser.generateSTRMFilePage(directory, torrentName, filename, torrent);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}
