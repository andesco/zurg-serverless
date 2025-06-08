import { RealDebridTorrentInfo, RealDebridUser, RealDebridTrafficInfo, Torrent, TorrentFile } from './types';

export function calculateTotalTrafficServed(traffic: RealDebridTrafficInfo): number {
  return Object.values(traffic).reduce((total, hoster) => {
    const bytes = hoster.bytes;
    // Handle potential undefined, null, or NaN values
    if (typeof bytes === 'number' && !isNaN(bytes) && bytes >= 0) {
      return total + bytes;
    }
    return total;
  }, 0);
}

export function formatTrafficServed(trafficBytes: number): string {
  // Handle edge cases
  if (!trafficBytes || isNaN(trafficBytes) || trafficBytes < 0) {
    return '0.0';
  }
  
  const trafficGB = trafficBytes / (1024 * 1024 * 1024);
  return trafficGB.toFixed(1);
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}

export function calculateDaysRemaining(expirationDate: string): number {
  const expiration = new Date(expirationDate);
  const now = new Date();
  const diffTime = expiration.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays); // Don't show negative days
}

export function convertToTorrent(info: RealDebridTorrentInfo): Torrent | null {
  if (!info.files || info.files.length === 0) {
    return null;
  }

  const selectedFiles: { [filename: string]: TorrentFile } = {};
  const selectedRDFiles = info.files.filter(f => f.selected === 1);
  
  if (selectedRDFiles.length === 0) {
    return null;
  }

  // Map files to links
  selectedRDFiles.forEach((file, index) => {
    const filename = file.path.split('/').pop() || file.path;
    const link = info.links[index] || '';
    
    selectedFiles[filename] = {
      id: file.id,
      path: file.path,
      bytes: file.bytes,
      selected: file.selected,
      link,
      ended: info.ended,
      state: link ? 'ok_file' : 'broken_file',
    };
  });

  return {
    id: info.id,
    name: info.filename,
    originalName: info.original_filename,
    hash: info.hash,
    added: info.added,
    ended: info.ended,
    selectedFiles,
    downloadedIDs: [info.id],
    state: Object.values(selectedFiles).some(f => f.state === 'broken_file') 
      ? 'broken_torrent' 
      : 'ok_torrent',
    totalSize: selectedRDFiles.reduce((sum, f) => sum + f.bytes, 0),
  };
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = [
    'mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v',
    'mpg', 'mpeg', '3gp', 'ogv', 'ts', 'm2ts', 'mts'
  ];
  
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? videoExtensions.includes(ext) : false;
}

export function generateAccessKey(torrent: Torrent): string {
  // Simple access key based on torrent name (similar to Zurg's GetKey)
  return torrent.name.replace(/[^a-zA-Z0-9\-_]/g, '_');
}
