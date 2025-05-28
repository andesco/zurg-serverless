import { Env } from './types';
import { RealDebridClient } from './realdebrid';

export interface STRMCacheEntry {
  downloadUrl: string;
  torrentId: string;
  filename: string;
  directory: string;
  createdAt: number;
  expiresAt: number;
}

export class STRMCacheManager {
  private env: Env;
  private rd: RealDebridClient;
  private readonly CACHE_TTL_DAYS = 7;
  private readonly CODE_LENGTH = 16;
  
  constructor(env: Env) {
    this.env = env;
    this.rd = new RealDebridClient(env);
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < this.CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async getOrCreateSTRMCode(
    directory: string, 
    torrentId: string, 
    filename: string, 
    fileLink: string
  ): Promise<string> {
    const cacheKey = `strm_mapping:${directory}:${torrentId}:${filename}`;
    const existingMapping = await this.env.KV.get(cacheKey);
    
    if (existingMapping) {
      const strmCode = existingMapping;
      const cachedEntry = await this.env.KV.get(`strm_cache:${strmCode}`);
      
      if (cachedEntry) {
        const entry: STRMCacheEntry = JSON.parse(cachedEntry);
        
        if (Date.now() < entry.expiresAt) {
          return strmCode;
        } else {
          await this.env.KV.delete(`strm_cache:${strmCode}`);
          await this.env.KV.delete(cacheKey);
        }
      }
    }

    const strmCode = await this.generateUniqueCode();
    
    console.log('STRM Cache - Generating new unrestricted link for:', filename);
    const unrestrictedLink = await this.rd.unrestrictLink(fileLink);
    
    const now = Date.now();
    const expiresAt = now + (this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    
    const cacheEntry: STRMCacheEntry = {
      downloadUrl: unrestrictedLink.download,
      torrentId,
      filename,
      directory,
      createdAt: now,
      expiresAt
    };

    const ttlSeconds = this.CACHE_TTL_DAYS * 24 * 60 * 60;
    await this.env.KV.put(`strm_cache:${strmCode}`, JSON.stringify(cacheEntry), {
      expirationTtl: ttlSeconds
    });
    
    await this.env.KV.put(cacheKey, strmCode, {
      expirationTtl: ttlSeconds
    });

    console.log('STRM Cache - Created new entry:', {
      strmCode,
      filename,
      expiresAt: new Date(expiresAt).toISOString()
    });

    return strmCode;
  }
  async resolveSTRMCode(strmCode: string): Promise<string | null> {
    const cachedEntry = await this.env.KV.get(`strm_cache:${strmCode}`);
    
    if (!cachedEntry) {
      console.log('STRM Cache - Code not found:', strmCode);
      return null;
    }

    const entry: STRMCacheEntry = JSON.parse(cachedEntry);
    
    if (Date.now() >= entry.expiresAt) {
      console.log('STRM Cache - Code expired:', strmCode);
      
      await this.env.KV.delete(`strm_cache:${strmCode}`);
      const mappingKey = `strm_mapping:${entry.directory}:${entry.torrentId}:${entry.filename}`;
      await this.env.KV.delete(mappingKey);
      
      return null;
    }

    console.log('STRM Cache - Resolved code:', {
      strmCode,
      filename: entry.filename,
      remainingTime: Math.round((entry.expiresAt - Date.now()) / (1000 * 60 * 60)) + 'h'
    });

    return entry.downloadUrl;
  }
  private async generateUniqueCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const code = this.generateCode();
      const existing = await this.env.KV.get(`strm_cache:${code}`);
      
      if (!existing) {
        return code;
      }
      
      attempts++;
    }
    
    throw new Error('Failed to generate unique STRM code after maximum attempts');
  }

  async cleanupExpiredEntries(): Promise<void> {
    console.log('STRM Cache - Cleanup called (TTL-based expiration handles most cleanup automatically)');
  }
}