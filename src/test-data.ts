// Test data for local development only
// This file is used to inject test broken torrents for demonstrating error handling

export function getTestBrokenTorrent() {
  // Only add test data in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return {
    id: 'TEST_BROKEN_TORRENT_123',
    name: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
    originalName: 'Test.Broken.Movie.2024.1080p.WEB-DL.x264',
    hash: 'abcdef1234567890abcdef1234567890abcdef12',
    added: new Date().toISOString(),
    ended: new Date().toISOString(),
    selectedFiles: {
      '1': {
        id: 'broken_file_1',
        path: '/Test.Broken.Movie.2024.1080p.WEB-DL.x264.mp4',
        bytes: 2147483648, // 2GB
        selected: 1,
        link: '', // Empty link = broken
        state: 'broken_file' as const
      },
      '2': {
        id: 'broken_file_2', 
        path: '/Test.Broken.Movie.2024.Sample.mp4',
        bytes: 52428800, // 50MB
        selected: 1,
        link: '', // Empty link = broken
        state: 'broken_file' as const
      }
    },
    downloadedIDs: ['TEST_BROKEN_TORRENT_123'],
    state: 'broken_torrent' as const,
    totalSize: 2199912448, // ~2.05GB
    cacheTimestamp: Date.now()
  };
}
