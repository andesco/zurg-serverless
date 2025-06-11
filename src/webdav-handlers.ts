import { Env } from './types';
import { StorageManager } from './storage';
import { WebDAVGenerator } from './webdav';

export async function handleWebDAVRequest(
  request: Request,
  env: Env,
  storage: StorageManager,
  webdav: WebDAVGenerator,
  mountType: 'dav' | 'infuse'
): Promise<Response> {
  try {
    console.log(`=== WebDAV ${request.method} Request: ${mountType} ===`);
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    pathSegments.shift(); // Remove mount type
    
    // Handle Depth header (WebDAV requirement)
    const depth = request.headers.get('depth') || 'infinity';
    console.log('Path segments:', pathSegments, 'Depth:', depth);

    // Add WebDAV required headers
    const webdavHeaders = {
      'Content-Type': 'text/xml; charset=utf-8',
      'DAV': '1, 2',
      'MS-Author-Via': 'DAV',
      'Allow': 'GET, HEAD, POST, PUT, DELETE, OPTIONS, PROPFIND, PROPPATCH, MKCOL, MOVE, COPY, LOCK, UNLOCK'
    };

    if (pathSegments.length === 0) {
      console.log('Handling root directory request');
      const directories = await storage.getAllDirectories();
      const xml = mountType === 'dav' 
        ? webdav.generateDavRootResponse(directories)
        : webdav.generateInfuseRootResponse(directories);
      
      console.log('Generated XML length:', xml.length);
      console.log('Generated XML:', xml.substring(0, 200) + '...');
      
      return new Response(xml, {
        status: 207,
        headers: webdavHeaders
      });
    }

  if (pathSegments.length === 1) {
    // Torrent files listing (e.g., /dav/TorrentName/)
    const torrentName = decodeURIComponent(pathSegments[0]);
    
    // Fetch torrent details on demand
    const { fetchTorrentDetails } = await import('./handlers');
    const torrent = await fetchTorrentDetails(torrentName, env, storage);
    
    if (!torrent) {
      return new Response(`<?xml version="1.0" encoding="utf-8"?>
<d:error xmlns:d="DAV:">
  <d:resource-not-found/>
</d:error>`, { 
        status: 404,
        headers: webdavHeaders
      });
    }
    
    // Always generate STRM files for all files in torrent, regardless of link availability
    const xml = webdav.generateTorrentFilesResponse(torrent, mountType);
    
    return new Response(xml, {
      status: 207,
      headers: webdavHeaders
    });
  }

  if (pathSegments.length === 2) {
    // Torrent files listing (e.g., /dav/__all__/torrent_name/)
    const directory = decodeURIComponent(pathSegments[0]);
    const torrentName = decodeURIComponent(pathSegments[1]);
    
    const result = await storage.getTorrentByName(directory, torrentName);
    
    if (!result) {
      return new Response(`<?xml version="1.0" encoding="utf-8"?>
<d:error xmlns:d="DAV:">
  <d:resource-not-found/>
</d:error>`, { 
        status: 404,
        headers: webdavHeaders
      });
    }
    
    const { torrent } = result;
    const xml = await webdav.generateSTRMFilesResponse(directory, torrent, mountType);
    
    return new Response(xml, {
      status: 207,
      headers: webdavHeaders
    });
  }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('=== WebDAV Handler Error ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`WebDAV Error: ${errorMessage}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

export async function handleSTRMDownload(): Promise<Response> {
  return new Response('Not implemented yet', { status: 501 });
}

// Add this function to webdav-handlers.ts

export async function handleWebDAVGET(
  request: Request,
  env: Env,
  storage: StorageManager,
  webdav: WebDAVGenerator,
  mountType: 'dav' | 'infuse'
): Promise<Response> {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  pathSegments.shift(); // Remove mount type

  // Handle WebDAV root directory GET requests (like /dav/ or /infuse/)
  if (pathSegments.length === 0) {
    console.log('WebDAV GET - Root directory request, treating as PROPFIND');
    return await handleWebDAVRequest(request, env, storage, webdav, mountType);
  }

  // Handle directory GET requests (like /dav/__all__/)
  if (pathSegments.length === 1) {
    console.log('WebDAV GET - Directory request, treating as PROPFIND');
    return await handleWebDAVRequest(request, env, storage, webdav, mountType);
  }

  // Handle torrent directory GET requests (like /dav/__all__/TorrentName/)
  if (pathSegments.length === 2) {
    console.log('WebDAV GET - Torrent directory request, treating as PROPFIND');
    return await handleWebDAVRequest(request, env, storage, webdav, mountType);
  }

  if (pathSegments.length === 3) {
    // This might be a STRM file request: /dav/directory/torrent_name/file.strm
    const directory = decodeURIComponent(pathSegments[0]);
    const torrentName = decodeURIComponent(pathSegments[1]);
    const filename = decodeURIComponent(pathSegments[2]);

    if (filename.endsWith('.strm')) {
      // Get the original filename (remove .strm extension)
      const originalFilename = filename.slice(0, -5);
      
      // Get torrent and verify file exists
      const result = await storage.getTorrentByName(directory, torrentName);
      if (!result) {
        return new Response('Torrent not found', { status: 404 });
      }
      
      const { torrent } = result;

      // Find the actual file by matching the base name (since STRM removes the original extension)
      const actualFilename = Object.keys(torrent.selectedFiles).find(f => {
        // Remove extension from actual filename to compare with base
        const actualBase = f.lastIndexOf('.') !== -1 ? f.substring(0, f.lastIndexOf('.')) : f;
        return actualBase === originalFilename;
      });
      
      if (!actualFilename) {
        return new Response('File not found', { status: 404 });
      }

      const file = torrent.selectedFiles[actualFilename];
      if (file.state !== 'ok_file') {
        // File not in good state, but still generate STRM with fallback
        const strmContent = await webdav.generateSTRMContent(directory, torrent.id, actualFilename, null);
        
        return new Response(strmContent.content, {
          status: 200,
          headers: {
            'Content-Type': 'application/x-mpegurl; charset=utf-8',
            'Content-Length': strmContent.size.toString(),
            'Cache-Control': 'no-cache',
            'DAV': '1, 2'
          }
        });
      }

      // Try to get fresh download link if missing or expired
      let downloadLink = file.link;
      if (!downloadLink) {
        try {
          const { fetchFileDownloadLink } = await import('./handlers');
          downloadLink = await fetchFileDownloadLink(torrent.id, actualFilename, env, storage);
        } catch (error) {
          console.warn(`⚠️ Failed to fetch download link for ${actualFilename}:`, error);
          downloadLink = null;
        }
      }
      
      // Generate STRM content (with fallback if no valid link)
      let strmContent;
      try {
        strmContent = await webdav.generateSTRMContent(directory, torrent.id, actualFilename, downloadLink);
      } catch (error) {
        console.error(`Failed to generate STRM content for ${actualFilename}, using fallback:`, error);
        strmContent = await webdav.generateSTRMContent(directory, torrent.id, actualFilename, null);
      }
      
      return new Response(strmContent.content, {
        status: 200,
        headers: {
          'Content-Type': 'application/x-mpegurl; charset=utf-8',
          'Content-Length': strmContent.size.toString(),
          'Cache-Control': 'no-cache',
          'DAV': '1, 2'
        }
      });
    }
  }

  return new Response('Not Found', { status: 404 });
}
