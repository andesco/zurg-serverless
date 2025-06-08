// Test Real-Debrid WebDAV structure
export async function testRDWebDAV(env: Env): Promise<string> {
  try {
    const auth = btoa('andreweicloud:OYXIEI4W3UWSU');
    
    // Explore /torrents folder
    const response = await fetch('https://dav.real-debrid.com/torrents', {
      method: 'PROPFIND',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Depth': '1',
        'Content-Type': 'application/xml'
      },
      body: `<?xml version="1.0" encoding="utf-8"?>
        <propfind xmlns="DAV:">
          <prop>
            <resourcetype/>
            <getcontentlength/>
            <getlastmodified/>
            <displayname/>
          </prop>
        </propfind>`
    });

    const text = await response.text();
    
    return `Status: ${response.status}\nTorrents folder structure:\n${text.substring(0, 3000)}`;
    
  } catch (error) {
    return `Error: ${error}`;
  }
}
