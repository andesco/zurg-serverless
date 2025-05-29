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

  constructor(env: Env) {
    this.token = env.RD_TOKEN;
    this.timeout = parseInt(env.API_TIMEOUT_SECONDS || '30') * 1000;
  }

  private async makeRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers,
        },
        signal: controller.signal,
      });

      if (!response.ok) {
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
