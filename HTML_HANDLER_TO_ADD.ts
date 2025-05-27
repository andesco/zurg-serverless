
// Add this function to the end of ~/Developer/zurg-serverless/src/worker.ts

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
    const accessKey = decodeURIComponent(htmlPath[1]);
    
    const torrent = await storage.getTorrent(accessKey);
    
    if (!torrent) {
      return new Response('Torrent not found', { status: 404 });
    }
    
    const html = htmlBrowser.generateTorrentPage(directory, torrent, accessKey);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  if (htmlPath.length === 3) {
    // STRM file content page
    const directory = decodeURIComponent(htmlPath[0]);
    const accessKey = decodeURIComponent(htmlPath[1]);
    const filename = decodeURIComponent(htmlPath[2]);
    
    if (!filename.endsWith('.strm')) {
      return new Response('Not a STRM file', { status: 400 });
    }
    
    const html = htmlBrowser.generateSTRMFilePage(directory, accessKey, filename);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}
