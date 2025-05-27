import { Env } from './types';
import { StorageManager } from './storage';
import { WebDAVGenerator } from './webdav';
import { HTMLBrowser } from './html-browser';
import { maybeRefreshTorrents } from './handlers';
import { handleWebDAVRequest, handleWebDAVGET } from './webdav-handlers';
import { handleSTRMDownload } from './strm-handler';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    console.log('=== WORKER STARTED ===');
    try {
      const url = new URL(request.url);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      
      console.log(`Request: ${request.method} ${url.pathname}`);
      console.log('Path segments:', pathSegments);
      console.log('Environment check - RD_TOKEN:', !!env.RD_TOKEN);
      console.log('Environment check - KV:', !!env.KV);
      
      if (pathSegments.length === 0) {
        console.log('=== ROOT ENDPOINT HANDLER ===');
        try {
          console.log('Building status text...');
          const statusText = [
            'Zurg Serverless - Real-Debrid WebDAV Server',
            '',
            'Status: OK',
            'Endpoints:',
            '- /dav/ (WebDAV)',
            '- /infuse/ (Infuse WebDAV)',
            '- /html/ (File Browser)',
            '- /strm/{downloadCode} (Streaming)',
            '',
            'Environment Check:',
            `- RD_TOKEN: ${env.RD_TOKEN ? 'SET' : 'MISSING'}`,
            `- KV: ${env.KV ? 'CONFIGURED' : 'MISSING'}`,
          ].join('\n');
          
          console.log('Status text built, creating response...');
          console.log('Status text length:', statusText.length);
          
          const response = new Response(statusText, { 
            status: 200,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
          
          console.log('Response created successfully');
          return response;
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

      if (!env.KV) {
        return new Response('Configuration Error: KV namespace not configured', { 
          status: 500,
          headers: { 'Content-Type': 'text/plain' }
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
    const html = htmlBrowser.generateRootPage(directories);
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
