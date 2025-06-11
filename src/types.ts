export interface Env {
  DB: D1Database;
  RD_TOKEN: string;
  STRM_TOKEN?: string;
  API_ACCOUNT_ID?: string;
  BASE_URL?: string;
  REFRESH_INTERVAL_SECONDS?: string;
  API_TIMEOUT_SECONDS?: string;
  TORRENTS_PAGE_SIZE?: string;
  USERNAME?: string;
  PASSWORD?: string;
}

export interface RealDebridTorrent {
  id: string;
  filename: string;
  hash: string;
  bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string;
  added: string;
  ended?: string;
  speed?: number;
  seeders?: number;
}

export interface RealDebridTorrentInfo {
  id: string;
  filename: string;
  original_filename: string;
  hash: string;
  bytes: number;
  original_bytes: number;
  host: string;
  split: number;
  progress: number;
  status: string;
  added: string;
  files: RealDebridFile[];
  links: string[];
  ended?: string;
  speed?: number;
  seeders?: number;
}

export interface RealDebridFile {
  id: number;
  path: string;
  bytes: number;
  selected: number;
}

export interface RealDebridUser {
  id: number;
  username: string;
  email: string;
  points: number;
  locale: string;
  avatar: string;
  type: string;
  premium: number;
  expiration: string;
}

export interface RealDebridTrafficInfo {
  [hoster: string]: {
    left: number;
    bytes: number;
    links: number;
    limit: number;
    type: string; // "links" or "gigabytes"
    extra: number;
    reset: string; // "daily" etc
  };
}

export interface UnrestrictResponse {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  crc: number;
  download: string;
  streamable: number;
}

export interface TorrentFile {
  id: number;
  path: string;
  bytes: number;
  selected: number;
  link?: string;
  ended?: string;
  state: 'ok_file' | 'broken_file' | 'deleted_file';
}

export interface Torrent {
  id: string;
  name: string;
  originalName: string;
  hash: string;
  added: string;
  ended?: string;
  selectedFiles: { [filename: string]: TorrentFile };
  downloadedIDs: string[];
  state: 'ok_torrent' | 'broken_torrent';
  totalSize: number;
  cacheTimestamp?: number; // When this torrent was last cached
}

export interface DirectoryMap {
  [directory: string]: { [accessKey: string]: Torrent };
}

export interface CacheMetadata {
  lastRefresh: number;
  libraryChecksum: string;
  torrentIds?: string[];
}

export interface STRMContent {
  content: string;
  size: number;
}

export interface WebDAVResponse {
  xml: string;
  status: number;
}
