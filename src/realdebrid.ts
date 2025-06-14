import {
  Env,
  RealDebridTorrent,
  RealDebridTorrentInfo,
  RealDebridUser,
  RealDebridTrafficInfo,
  UnrestrictResponse,
} from './types';

export class RealDebridClient {
  private token: string;
  private timeout: number;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second between requests (60/min max)

  constructor(env: Env) {
    this.token = env.RD_TOKEN;
    this.timeout = parseInt(env.API_TIMEOUT_SECONDS || '30') * 1000;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    return this.queueRequest(() => this.executeRequest<T>(url, options));
  }

  private async queueRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minRequestInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
        );
      }

      const requestFn = this.requestQueue.shift();
      if (requestFn) {
        this.lastRequestTime = Date.now();
        await requestFn();
      }
    }

    this.isProcessing = false;
  }

  private async executeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      console.log(`[RD_API] ${url}`);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers,
        },
        signal: controller.signal,
      });

      // Log IP tracking info for debugging
      const cfRay = response.headers.get('cf-ray');
      const cfIp = response.headers.get('cf-connecting-ip');
      console.log(`[RD_API] ${url} - Status: ${response.status}, CF-Ray: ${cfRay}, CF-IP: ${cfIp}`);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn('[RD_API] Rate limited, retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          return this.executeRequest<T>(url, options);
        }
        throw new Error(`RD API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async getUserInfo(): Promise<RealDebridUser> {
    const url = 'https://api.real-debrid.com/rest/1.0/user';
    return this.makeRequest<RealDebridUser>(url);
  }

  async getTrafficInfo(): Promise<RealDebridTrafficInfo> {
    const url = 'https://api.real-debrid.com/rest/1.0/traffic';
    return this.makeRequest<RealDebridTrafficInfo>(url);
  }

  async getTorrents(page: number = 1, limit: number = 1000): Promise<RealDebridTorrent[]> {
    const url = `https://api.real-debrid.com/rest/1.0/torrents?page=${page}&limit=${limit}`;
    return this.makeRequest<RealDebridTorrent[]>(url);
  }

  async getTorrentInfo(id: string): Promise<RealDebridTorrentInfo> {
    const url = `https://api.real-debrid.com/rest/1.0/torrents/info/${id}`;
    return this.makeRequest<RealDebridTorrentInfo>(url);
  }

  async unrestrictLink(link: string): Promise<UnrestrictResponse> {
    const formData = new URLSearchParams();
    formData.append('link', link);

    return this.makeRequest<UnrestrictResponse>(
      'https://api.real-debrid.com/rest/1.0/unrestrict/link',
      {
        method: 'POST',
        body: formData,
      }
    );
  }
}
