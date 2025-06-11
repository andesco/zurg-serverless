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
  private db: D1Database;
  private rd: RealDebridClient;
  private readonly CACHE_TTL_DAYS = 7;
  private readonly CODE_LENGTH = 16;
  constructor(env: Env) {
    this.env = env;
    this.db = env.DB;
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
  async getOrCreateSTRMCode(directory: string, torrentId: string, filename: string, fileLink: string | null): Promise<string> {
    const existingMapping = await this.db
      .prepare('SELECT strm_code, expires_at FROM strm_mappings WHERE directory = ? AND torrent_id = ? AND filename = ?')
      .bind(directory, torrentId, filename)
      .first();
    if (existingMapping) {
      const now = Date.now();
      if (now < (existingMapping.expires_at as number)) {
        const cacheEntry = await this.db
          .prepare('SELECT * FROM strm_cache WHERE strm_code = ? AND expires_at > ?')
          .bind(existingMapping.strm_code, now)
          .first();
        if (cacheEntry) {
          return existingMapping.strm_code as string;
        }
      }
      await this.cleanupExpiredEntry(existingMapping.strm_code as string);
    }
    const strmCode = await this.generateUniqueCode();
    
    let downloadUrl: string;
    
    if (!fileLink) {
      // Use fallback for broken files
      console.log('STRM Cache - Using fallback for broken file:', filename);
      downloadUrl = `${this.env.BASE_URL || 'https://zurg.andrewe.dev'}/not_found.mp4`;
    } else {
      // Unrestrict valid links
      console.log('STRM Cache - Generating new unrestricted link for:', filename);
      const unrestrictedLink = await this.rd.unrestrictLink(fileLink);
      downloadUrl = unrestrictedLink.download;
    }
    
    const now = Date.now();
    const expiresAt = now + (this.CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);
    const cacheEntry: STRMCacheEntry = {
      downloadUrl,
      torrentId,
      filename,
      directory,
      createdAt: now,
      expiresAt
    };
    await this.db.batch([
      this.db.prepare(`
        INSERT INTO strm_cache (strm_code, download_url, torrent_id, filename, directory, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(strmCode, cacheEntry.downloadUrl, torrentId, filename, directory, now, expiresAt),
      this.db.prepare(`
        INSERT INTO strm_mappings (directory, torrent_id, filename, strm_code, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).bind(directory, torrentId, filename, strmCode, expiresAt)
    ]);
    console.log('STRM Cache - Created new entry:', {
      strmCode,
      filename,
      expiresAt: new Date(expiresAt).toISOString()
    });
    return strmCode;
  }
  async resolveSTRMCode(strmCode: string): Promise<string | null> {
    const cachedEntry = await this.db
      .prepare('SELECT * FROM strm_cache WHERE strm_code = ? AND expires_at > ?')
      .bind(strmCode, Date.now())
      .first();
    
    if (!cachedEntry) {
      console.log('STRM Cache - Code not found or expired:', strmCode);
      await this.cleanupExpiredEntry(strmCode);
      return null;
    }
    console.log('STRM Cache - Resolved code:', {
      strmCode,
      filename: cachedEntry.filename,
      remainingTime: Math.round(((cachedEntry.expires_at as number) - Date.now()) / (1000 * 60 * 60)) + 'h'
    });
    return cachedEntry.download_url as string;
  }

  // Get STRM info even if expired (for refresh purposes)
  async getSTRMInfo(strmCode: string): Promise<{ torrentId: string; filename: string; directory: string } | null> {
    const cachedEntry = await this.db
      .prepare('SELECT torrent_id, filename, directory FROM strm_cache WHERE strm_code = ?')
      .bind(strmCode)
      .first();
    
    if (!cachedEntry) {
      return null;
    }
    
    return {
      torrentId: cachedEntry.torrent_id as string,
      filename: cachedEntry.filename as string,
      directory: cachedEntry.directory as string
    };
  }
  private async generateUniqueCode(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;
    while (attempts < maxAttempts) {
      const code = this.generateCode();
      const existing = await this.db
        .prepare('SELECT strm_code FROM strm_cache WHERE strm_code = ?')
        .bind(code)
        .first();
      if (!existing) {
        return code;
      }
      attempts++;
    }
    throw new Error('Failed to generate unique STRM code after maximum attempts');
  }
  private async cleanupExpiredEntry(strmCode: string): Promise<void> {
    await this.db.batch([
      this.db.prepare('DELETE FROM strm_cache WHERE strm_code = ?').bind(strmCode),
      this.db.prepare('DELETE FROM strm_mappings WHERE strm_code = ?').bind(strmCode)
    ]);
  }
  async cleanupExpiredEntries(): Promise<void> {
    const now = Date.now();
    await this.db.batch([
      this.db.prepare('DELETE FROM strm_cache WHERE expires_at <= ?').bind(now),
      this.db.prepare('DELETE FROM strm_mappings WHERE expires_at <= ?').bind(now)
    ]);
    console.log('STRM Cache - Cleaned up expired entries');
  }
}