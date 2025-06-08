# Release Notes

## v1.0.0 (June 8, 2025)

## v1.1.0 (June 8, 2025)

### Major Features
- **On-demand API system**: Eliminated progressive caching, now fetches data only when requested
- **Smart episode ordering**: TV episodes properly sorted by season/episode numbers  
- **Lazy download link fetching**: Download URLs only fetched when actually needed
- **Enhanced file browser**: New `/files/` endpoint with search, filtering, and grid/list toggle

### UI/UX Improvements  
- **Consistent blue theming**: Applied across all file interfaces
- **Better navigation**: Proper href links for improved accessibility and mobile experience
- **Cache statistics**: Visual display of cached vs pending torrents with duplicate detection
- **Mobile-optimized**: Better responsive design and touch interactions

### Performance Optimizations
- **Faster browsing**: Only 1 API call needed to browse a 50-episode season
- **7-day caching**: Torrent details and download links cached for optimal performance
- **Smart preservation**: Existing valid download links never unnecessarily refreshed
- **Reduced API calls**: ~90% reduction in Real-Debrid API usage

### Technical Changes
- **Database schema updates**: Added `cache_timestamp` column and improved indexing
- **New URL structure**: Direct torrent access (`/dav/Exact.Torrent.Name/`)
- **STRM handling**: Enhanced with automatic fresh link fetching for expired codes
- **Error handling**: Better fallback mechanisms and user feedback

### Developer Experience
- **Process monitoring**: Added scripts to prevent workerd process leaks
- **Safe development**: New npm scripts for clean dev environment management
- **Better documentation**: Enhanced CLAUDE.md with detailed architecture notes

### Breaking Changes
- URL structure completely changed from show-based grouping to exact torrent names
- Removed `/html/` endpoint (replaced by `/files/`)
- Progressive caching system disabled in favor of on-demand fetching

### Bug Fixes
- Fixed cache statistics calculation accuracy
- Resolved WebDAV empty folder issues
- Eliminated runaway workerd processes
- Fixed grid/list toggle persistence issues

---

## Installation & Upgrade

For new installations:
```bash
git clone https://github.com/andesco/zurg-serverless
cd zurg-serverless
npm install
wrangler login
npm run dev
```

For existing users:
```bash
git pull
npm install
# Apply database migrations
wrangler d1 execute zurg-serverless-prod-db --file=schema-migration-003.sql
npm run deploy
```
