// WebDAV-safe security headers that won't break media player clients
import { Env } from './types';

export function addWebDAVSafeSecurityHeaders(response: Response, request: Request, env: Env): Response {
  const url = new URL(request.url);
  const isWebDAV = url.pathname.startsWith('/dav') || url.pathname.startsWith('/infuse');
  const isHTML = url.pathname.startsWith('/html') || url.pathname === '/';
  
  const headers = new Headers(response.headers);
  
  // Always safe - these don't interfere with WebDAV clients
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Remove server fingerprinting
  headers.delete('Server');
  headers.set('X-Powered-By', 'Cloudflare Workers');
  
  if (isHTML) {
    // Only add these for HTML endpoints - they can break WebDAV clients
    headers.set('X-Frame-Options', 'DENY');
    headers.set('X-XSS-Protection', '1; mode=block');
    
    // Basic CSP for HTML only
    headers.set('Content-Security-Policy', 
      "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:");
    
    // HSTS only for HTML (some WebDAV clients don't like it)
    if (url.protocol === 'https:') {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
  }
  
  if (isWebDAV) {
    // WebDAV-specific headers that are safe and helpful
    headers.set('DAV', '1, 2');
    headers.set('MS-Author-Via', 'DAV');
    
    // Cache control for WebDAV - short cache for directory listings
    headers.set('Cache-Control', 'public, max-age=60');
  } else if (url.pathname.startsWith('/strm/')) {
    // STRM redirects should never be cached
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
