// Enhanced STRM handler with error video fallback
import { Env } from './types';
import { STRMCacheManager } from './strm-cache';
import { StorageManager } from './storage';

// Small base64-encoded error video (you can replace this with your not_found.mp4)
// This is a tiny 1-second black video with "Error" text - only ~5KB
const ERROR_VIDEO_BASE64 = `data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAuBtZGF0AAACrQYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE2NCByMzA5NSBiYWVlNDAwIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAyMSAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTEgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9MiBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0wIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MCA4eDhkY3Q9MCBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0wIHRocmVhZHM9MSBsb29rYWhlYWRfdGhyZWFkcz0xIHNsaWNlZF90aHJlYWRzPTAgbnI9MCBkZWNpbWF0ZT0xIGludGVybGFjZWQ9MCBibHVyYXlfY29tcGF0PTAgY29uc3RyYWluZWRfaW50cmE9MCBiZnJhbWVzPTAgd2VpZ2h0cD0wIGtleWludD0yNTAga2V5aW50X21pbj0xMCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yOC4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAABWmWIhAAz//727L4FNf2f0JcRLMXaSnA+KqSAgHc4vhJqjGGYYLyA==`;

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
      return createErrorVideoResponse('Invalid STRM code format');
    }

    const cacheManager = new STRMCacheManager(env);
    const downloadUrl = await cacheManager.resolveSTRMCode(strmCode);

    if (!downloadUrl) {
      console.log('STRM Download - Code not found or expired:', strmCode);
      
      // Try fallback regeneration
      const fallbackUrl = await trySTRMFallback(strmCode, env, storage);
      if (fallbackUrl) {
        console.log('STRM Download - Fallback successful, redirecting');
        return new Response(null, {
          status: 302,
          headers: {
            'Location': fallbackUrl,
            'Cache-Control': 'no-cache'
          }
        });
      }
      
      // Final fallback: serve error video
      return createErrorVideoResponse('Media file not available');
    }

    console.log('STRM Download - Redirecting to cached download URL');
    return new Response(null, {
      status: 302,
      headers: {
        'Location': downloadUrl,
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('STRM download error:', error);
    return createErrorVideoResponse('Service temporarily unavailable');
  }
}

async function trySTRMFallback(
  strmCode: string,
  env: Env,
  storage: StorageManager
): Promise<string | null> {
  try {
    console.log(`Attempting STRM fallback for ${strmCode}`);
    
    // Try to find the STRM mapping in the database
    const mapping = await storage.getSTRMMapping(strmCode);
    if (!mapping) {
      return null;
    }
    
    // Try to get torrent info and regenerate the download URL
    const torrent = await storage.getTorrentById(mapping.torrentId);
    if (!torrent) {
      return null;
    }
    
    const selectedFiles = JSON.parse(torrent.selectedFiles);
    const targetFile = selectedFiles.find((file: any) => 
      file.path.endsWith(mapping.filename.replace('.strm', ''))
    );
    
    if (!targetFile) {
      return null;
    }
    
    // Try to get a fresh download URL from Real-Debrid
    const response = await fetch(`https://api.real-debrid.com/rest/1.0/unrestrict/link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RD_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `link=${encodeURIComponent(targetFile.link)}`
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.download) {
        // Update cache with new URL
        const cacheManager = new STRMCacheManager(env);
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days
        await storage.updateSTRMCache(strmCode, data.download, expiresAt);
        
        return data.download;
      }
    }
    
    return null;
  } catch (error) {
    console.error('STRM fallback failed:', error);
    return null;
  }
}

function createErrorVideoResponse(message: string): Response {
  // Option 1: Serve embedded error video
  if (ERROR_VIDEO_BASE64) {
    // Convert base64 data URL to binary
    const base64Data = ERROR_VIDEO_BASE64.split(',')[1];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    return new Response(binaryData, {
      status: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': binaryData.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache error video for 1 hour
        'X-Error-Message': message
      }
    });
  }
  
  // Option 2: Redirect to external error video (if you host one somewhere)
  // return new Response(null, {
  //   status: 302,
  //   headers: {
  //     'Location': 'https://your-domain.com/error-videos/not_found.mp4',
  //     'Cache-Control': 'no-cache'
  //   }
  // });
  
  // Option 3: Return a simple error response (fallback)
  return new Response(message, { 
    status: 404,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Alternative: If you want to embed your actual not_found.mp4 file
// 1. Convert it to base64: `base64 -i not_found.mp4 -o not_found.base64`
// 2. Replace ERROR_VIDEO_BASE64 with: `data:video/mp4;base64,${base64Content}`
// 3. Make sure the file is under 25KB for optimal performance
