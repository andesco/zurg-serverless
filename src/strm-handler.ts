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
    const downloadUrl = await cacheManager.resolveSTRMCode(strmCode);

    if (!downloadUrl) {
      console.log('STRM Download - Code not found or expired:', strmCode);
      return new Response('STRM code not found or expired', { status: 404 });
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
    return new Response(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}
