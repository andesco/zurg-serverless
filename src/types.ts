export interface Env {
  KV: KVNamespace;
  RD_TOKEN: string;
  RD_UNRESTRICT_IP?: string;
  STRM_TOKEN?: string;
  BASE_URL?: string;
  REFRESH_INTERVAL_SECONDS?: string;
  API_TIMEOUT_SECONDS?: string;
  TORRENTS_PAGE_SIZE?: string;
  HIDE_BROKEN_TORRENTS?: string;
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
}

export interface DirectoryMap {
  [directory: string]: { [accessKey: string]: Torrent };
}

export interface CacheMetadata {
  lastRefresh: number;
  libraryChecksum: string;
}

export interface STRMContent {
  content: string;
  size: number;
}

export interface WebDAVResponse {
  xml: string;
  status: number;
}
