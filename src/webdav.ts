import { Env, Torrent, STRMContent } from './types';
import { STRMCacheManager } from './strm-cache';

export class WebDAVGenerator {
  private env: Env;
  private baseURL: string;

  constructor(env: Env, request: Request) {
    this.env = env;
    this.baseURL = env.BASE_URL || new URL(request.url).origin;
  }

  // STRM file utilities - always generates STRM files, uses fallback if no valid link
  async generateSTRMContent(directory: string, torrentKey: string, filename: string, fileLink: string | null): Promise<STRMContent> {
    // Use the cache manager to get or create a short STRM code
    const cacheManager = new STRMCacheManager(this.env);
    
    // If no valid file link, use fallback URL
    const effectiveLink = fileLink || `${this.baseURL}/not_found.mp4`;
    const strmCode = await cacheManager.getOrCreateSTRMCode(directory, torrentKey, filename, effectiveLink);
    
    console.log('STRM Content Generation:', { directory, torrentKey, filename, strmCode, hasValidLink: !!fileLink });
    
    // STRM content should point to our short /strm/ endpoint
    const url = `${this.baseURL}/strm/${strmCode}`;
    
    const content = url;
    const size = new TextEncoder().encode(content).length;
    
    console.log('STRM Content Generated:', { url, size });
    
    return { content, size };
  }

  generateSTRMFilename(filename: string): string {
    const ext = filename.lastIndexOf('.');
    if (ext !== -1) {
      return filename.substring(0, ext) + '.strm';
    }
    return filename + '.strm';
  }

  // DAV XML generators
  generateDavRootResponse(directories: string[]): string {
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">`;
    
    // Include root directory for DAV
    xml += this.generateDirectoryEntry('/', '');
    
    for (const dir of directories.filter(d => !d.startsWith('int__'))) {
      xml += this.generateDirectoryEntry(dir + '/', '');
    }
    
    xml += `
</d:multistatus>`;
    return xml;
  }

  generateInfuseRootResponse(directories: string[]): string {
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">`;
    
    // No root directory for Infuse
    for (const dir of directories.filter(d => !d.startsWith('int__'))) {
      xml += this.generateDirectoryEntry(dir + '/', '');
    }
    
    xml += `
</d:multistatus>`;
    return xml;
  }

  generateDirectoryResponse(torrents: { [key: string]: Torrent }, mountType: 'dav' | 'infuse'): string {
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">`;
    
    for (const [accessKey, torrent] of Object.entries(torrents)) {
      const timestamp = mountType === 'dav' ? (torrent.ended || torrent.added) : torrent.added;
      xml += this.generateDirectoryEntry(torrent.name + '/', timestamp);
    }
    
    xml += `
</d:multistatus>`;
    return xml;
  }

  async generateSTRMFilesResponse(
    directory: string, 
    torrent: Torrent, 
    mountType: 'dav' | 'infuse'
  ): Promise<string> {
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">`;
    
    for (const [filename, file] of Object.entries(torrent.selectedFiles)) {
      if (file.state !== 'ok_file' || !file.link) continue;
      
      const strmFilename = this.generateSTRMFilename(filename);
      const strmContent = await this.generateSTRMContent(directory, torrent.id, filename, file.link);
      const timestamp = mountType === 'dav' ? (file.ended || torrent.added) : torrent.added;
      
      xml += this.generateFileEntry(strmFilename, strmContent.size, timestamp);
    }
    
    xml += `
</d:multistatus>`;
    return xml;
  }

  private generateDirectoryEntry(name: string, timestamp: string): string {
    const lastModified = timestamp || new Date().toISOString();
    const href = this.xmlEscape(name.endsWith('/') ? name : name + '/');
    
    return `
    <d:response>
      <d:href>${href}</d:href>
      <d:propstat>
        <d:prop>
          <d:resourcetype><d:collection/></d:resourcetype>
          <d:getlastmodified>${lastModified}</d:getlastmodified>
          <d:creationdate>${lastModified}</d:creationdate>
          <d:displayname>${this.xmlEscape(name.replace(/\/$/, ''))}</d:displayname>
          <d:supportedlock>
            <d:lockentry>
              <d:lockscope><d:shared/></d:lockscope>
              <d:locktype><d:write/></d:locktype>
            </d:lockentry>
          </d:supportedlock>
        </d:prop>
        <d:status>HTTP/1.1 200 OK</d:status>
      </d:propstat>
    </d:response>`;
  }

  private generateFileEntry(name: string, size: number, timestamp: string): string {
    const lastModified = timestamp || new Date().toISOString();
    const href = this.xmlEscape(name);
    
    return `
    <d:response>
      <d:href>${href}</d:href>
      <d:propstat>
        <d:prop>
          <d:getcontentlength>${size}</d:getcontentlength>
          <d:getlastmodified>${lastModified}</d:getlastmodified>
          <d:creationdate>${lastModified}</d:creationdate>
          <d:displayname>${this.xmlEscape(name)}</d:displayname>
          <d:getcontenttype>application/x-mpegurl</d:getcontenttype>
          <d:getetag>"${this.generateETag(name, size, lastModified)}"</d:getetag>
          <d:supportedlock>
            <d:lockentry>
              <d:lockscope><d:shared/></d:lockscope>
              <d:locktype><d:write/></d:locktype>
            </d:lockentry>
          </d:supportedlock>
        </d:prop>
        <d:status>HTTP/1.1 200 OK</d:status>
      </d:propstat>
    </d:response>`;
  }

  private generateETag(name: string, size: number, timestamp: string): string {
    // Simple ETag generation based on name, size, and timestamp
    const hash = Array.from(name + size + timestamp)
      .reduce((hash, char) => (hash << 5) + hash + char.charCodeAt(0), 0)
      .toString(16);
    return hash;
  }

  private xmlEscape(str: string): string {
    return str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case "'": return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Generate WebDAV response for files within a single torrent
  generateTorrentFilesResponse(torrent: Torrent, mountType: 'dav' | 'infuse'): string {
    const files = Object.entries(torrent.selectedFiles)
      .filter(([_, file]) => file.state === 'ok_file')
      .map(([filename, file]) => {
        const strmFilename = this.generateSTRMFilename(filename);
        return `
          <d:response>
            <d:href>${this.escapeXml(`/${mountType}/${encodeURIComponent(torrent.name)}/${encodeURIComponent(strmFilename)}`)}</d:href>
            <d:propstat>
              <d:prop>
                <d:displayname>${this.escapeXml(strmFilename)}</d:displayname>
                <d:getcontentlength>${this.escapeXml(strmFilename.length.toString())}</d:getcontentlength>
                <d:getcontenttype>application/x-stream</d:getcontenttype>
                <d:getlastmodified>${new Date(file.ended || torrent.added).toUTCString()}</d:getlastmodified>
                <d:resourcetype/>
              </d:prop>
              <d:status>HTTP/1.1 200 OK</d:status>
            </d:propstat>
          </d:response>`;
      }).join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<d:multistatus xmlns:d="DAV:">
  <d:response>
    <d:href>${this.escapeXml(`/${mountType}/${encodeURIComponent(torrent.name)}/`)}</d:href>
    <d:propstat>
      <d:prop>
        <d:displayname>${this.escapeXml(torrent.name)}</d:displayname>
        <d:resourcetype>
          <d:collection/>
        </d:resourcetype>
        <d:getlastmodified>${new Date(torrent.added).toUTCString()}</d:getlastmodified>
      </d:prop>
      <d:status>HTTP/1.1 200 OK</d:status>
    </d:propstat>
  </d:response>
  ${files}
</d:multistatus>`;
  }
}
