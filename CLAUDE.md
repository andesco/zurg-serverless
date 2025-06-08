# CLAUDE.md - Zurg Serverless Documentation

## Project Overview

**Zurg Serverless** is a Cloudflare Workers application that provides a serverless Real-Debrid WebDAV server for media streaming applications like Infuse. It converts Real-Debrid torrents into a browsable file structure and generates STRM files for seamless media playback.

## Architecture

### Core Technologies
- **Cloudflare Workers** - Serverless runtime environment
- **Cloudflare D1** - SQLite database for caching and metadata
- **Real-Debrid API** - Media source for torrents and downloads
- **WebDAV Protocol** - File system interface for media players
- **TypeScript** - Primary development language

### Key Components
1. **Worker.ts** - Main request handler and routing
2. **Storage.ts** - D1 database operations and caching layer
3. **WebDAV handlers** - Protocol implementation for media players
4. **HTML Browser** - Web interface for manual browsing
5. **STRM Handler** - Generates streaming files for media players
6. **Real-Debrid Client** - API integration

## Deployment Methods

### Deploy to Cloudflare Button
- Uses template `wrangler.toml` configuration
- Cloudflare runs `npx wrangler deploy` automatically
- For new users and one-click deployment

### Manual Deployment
- Uses `wrangler.local.toml` with environment configs
- Run `npm run deploy-local` for production
- Run `npm run deploy-staging` for staging
- For development and testing

## Project Structure

```
~/Developer/zurg-serverless/
├── src/
│   ├── worker.ts              # Main entry point
│   ├── storage.ts             # Database operations
│   ├── webdav-handlers.ts     # WebDAV protocol implementation
│   ├── html-browser.ts        # Web interface
│   ├── strm-handler.ts        # STRM file generation
│   ├── realdebrid.ts          # Real-Debrid API client
│   ├── handlers.ts            # Cache refresh and torrent fetching
│   └── types.ts               # TypeScript definitions
├── wrangler.toml              # Template configuration
├── wrangler.local.toml        # Personal deployment config
├── schema.sql                 # Base database schema
├── schema-migration-001.sql   # Adds torrent_ids column
├── schema-migration-002.sql   # Adds cache_settings table
└── package.json               # Dependencies and scripts
```

## Configuration

### Environment Variables
- `RD_TOKEN` - Real-Debrid API token (secret)
- `USERNAME` - Basic auth username (secret, optional)
- `PASSWORD` - Basic auth password (secret, optional)
- `BASE_URL` - Application base URL
- `REFRESH_INTERVAL_SECONDS` - Cache refresh frequency
- `API_TIMEOUT_SECONDS` - Real-Debrid API timeout
- `TORRENTS_PAGE_SIZE` - Number of torrents per API call
- `HIDE_BROKEN_TORRENTS` - Filter out broken torrents

### Database Configuration
- **Development**: `zurg-serverless-dev-db` (c123b8ff-c4ba-4c6b-8878-e8f035026b8d)
- **Production**: `zurg-serverless-prod-db` (711952e5-b009-4de8-bb26-03274cda8ad2)
- **Account ID**: 0a15c5f9d39350baa992ff9f48efc1c8 (Andrew Escobar)

## Database Schema

### Tables
1. **cache_metadata** - Main cache timing and metadata
   - `id`, `last_refresh`, `library_checksum`, `torrent_ids`
2. **cache_settings** - Key-value settings storage (formerly cache_metadata_kv)
3. **torrents** - Torrent details and file information
   - `access_key`, `id`, `name`, `selected_files` (JSON), `state`
4. **directories** - Directory to torrent mappings
5. **strm_cache** - STRM file download URLs
6. **strm_mappings** - STRM filename mappings

### Key Indexes
- `idx_torrents_state`, `idx_torrents_id`
- `idx_directories_directory`
- `idx_cache_settings_key`

## Deployment

### Commands
```bash
# Development
npm run dev                    # Local development server
npm run deploy-local           # Deploy to production (manual deployment)
npm run deploy-staging         # Deploy to staging

# Database management
npx wrangler d1 execute <db-name> --file=schema.sql
npx wrangler secret put RD_TOKEN --env production
```

### Environments
- **Dev**: http://localhost:8787 (local development)
- **Production**: https://serverless.andrewe.link
- **Staging**: https://zurg-serverless-staging.andrewe.workers.dev

## Core Functionality

### Cache Management
- **Lightweight Refresh**: Fetches torrent list (1 API call)
- **Progressive Caching**: Fetches 10 torrent details per request
- **Priority System**: New torrents → oldest cached → uncached
- **Cache Invalidation**: Force refresh with `?refresh` parameter

### File System Structure
```
/dav/          # WebDAV mount for Infuse
/infuse/       # Alternative WebDAV mount
/html/         # Web browser interface
/strm/         # STRM file downloads
```

### STRM File Generation
- Converts media files to `.strm` format
- Caches download URLs with expiration
- Handles media info extraction (title, year, season, episode)

## Common Issues & Solutions

### "No files available"
**Cause**: Empty `selectedFiles` in torrents table
**Fix**: 
1. Force cache refresh: visit `?refresh`
2. Check database for empty `selected_files` (length ≤ 5)
3. Verify Real-Debrid API token

### Database Errors
**Common**: "no such column: torrent_ids"
**Fix**: Apply migrations in order:
1. `schema.sql` (base schema)
2. `schema-migration-001.sql` (adds torrent_ids)
3. `schema-migration-002.sql` (adds cache_settings)

### Environment Conflicts
**Issue**: Multiple environments sharing same database
**Fix**: Use separate database IDs for dev/staging/production

## Git Workflow Strategy

### Branch Structure
- **`claude` branch**: Local development with detailed commit history
- **`main` branch**: Public releases with clean, grouped commits

### Release Process
When asked to "commit to main", "push to origin main", or "ready a release":

```bash
# Squash merge claude commits into clean release commit
git checkout main
git merge --squash claude
git commit -m "Release X.Y.Z: Description of changes"
git push origin main
```

### Benefits
- **Local `claude`**: Preserves all development commits and history
- **Public `main`**: Clean release history (every ~10 commits becomes 1 release)
- **No history loss**: Both detailed and summary histories maintained

### Example Timeline
- 200 commits in `claude` → 20 release commits in `main`
- Each release commit represents a group of related changes
- Full development context preserved locally

### Debugging
- Check Worker logs in Cloudflare dashboard
- Use `console.log` statements in code
- Monitor D1 database queries and performance
- Test WebDAV with clients like Infuse or VLC

### 2025-06-06 - UI and WebDAV Improvements
- ✅ Fixed HTML browser to only show "__all__" directory (cleaner interface)
- ✅ Replaced "Media directory" with actual item counts ("5 items", "1 item")
- ✅ Added cache statistics to homepage (cached vs uncached torrents)
- ✅ Fixed view toggle buttons (grid/list) with list as default
- ✅ Removed localStorage dependency (not available in Workers)
- ✅ WebDAV filtering: Only shows torrents with file details to prevent empty folders
- ✅ Added `getCacheStatistics()` method for quick cache status
- ✅ Updated `getDirectory()` with WebDAV filtering parameter

### Directory Organization Fix
- ✅ Added `extractDirectoryName()` function to parse show names from torrents
- ✅ Fixed hardcoded "__all__" directory issue - now creates proper show directories
- ✅ Maintains backward compatibility with "__all__" directory


### 2025-06-06 - Removed "__all__" Top-Level Directory
- ✅ Eliminated need for "__all__" folder in HTML browser - shows show directories directly
- ✅ Updated WebDAV endpoints to show show directories at root level
- ✅ Modified `getAllDirectories()` to filter out "__all__" and internal directories
- ✅ Maintained internal "__all__" for backward compatibility and internal lookups
- ✅ Cleaner user experience: `/dav/Black Mirror/` instead of `/dav/__all__/Black Mirror/`

### File System Structure Update
```
Old structure:
/dav/__all__/               # All torrents
/html/__all__/              # HTML browser

New structure:
/dav/Black Mirror/          # Direct show access
/dav/Planet Earth III/      # Direct show access
/html/Black Mirror/         # HTML browser direct access
```


### 2025-06-06 - Grid/List Toggle Buttons Fixed (Again)
- ✅ Restored grid/list toggle buttons (#grid-btn and #list-btn) to root page
- ✅ Added proper grid and list view support for directory cards
- ✅ Ensured list view is default (`currentViewMode = 'list'`)
- ✅ Toggle buttons now work on both root page and directory pages

### ⚠️ IMPORTANT REMINDER FOR FUTURE CHANGES
**NEVER REMOVE THE GRID/LIST TOGGLE BUTTONS**
- Always preserve `#grid-btn` and `#list-btn` elements
- List view is always the default (`#list-btn` default)
- Both root page and directory pages must have these toggles
- Toggle functionality is in `setViewMode()` function - don't remove
- Always test that both grid and list views work after UI changes


### 2025-06-06 - Complete Restructure: On-Demand API System
- ✅ **MAJOR CHANGE**: Removed directory grouping, now using exact torrent names as folders
- ✅ **MAJOR CHANGE**: Implemented on-demand API fetching system
- ✅ **MAJOR CHANGE**: Eliminated progressive caching in favor of individual torrent requests

#### New API Call Strategy:
- **Root level** (`/html/`, `/dav/`, `/files/`): Calls Real-Debrid torrents list API
- **Individual torrent** (`/dav/TorrentName/`): Calls Real-Debrid torrent details API for that specific torrent only  
- **STRM file access**: Only calls API for that specific torrent if cache expired (7 days)

#### New URL Structure:
- **WebDAV**: `/dav/Exact.Torrent.Name.S01/file.strm` & `/infuse/Exact.Torrent.Name.S01/file.strm`
- **HTML Files**: `/files/Exact.Torrent.Name.S01/Exact.File.Name.S01E01/Exact.File.Name.S01E01.strm`

#### Database Changes:
- ✅ Added `cache_timestamp` column to torrents table
- ✅ Cleared all existing directory structure
- ✅ Added `saveTorrentDetails()` method for individual torrent caching
- ✅ Cache expiration: 7 days for torrent details and download links

#### New Files Browser:
- ✅ Added `/files/` endpoint with new HTML interface
- ✅ Three-level structure: `/files/` → `/files/TorrentName/` → `/files/TorrentName/FileName/`
- ✅ File details page with download buttons and metadata
- ✅ Direct STRM file downloads

#### Performance Improvements:
- 🚀 **Much faster browsing**: Only fetches data for requested torrents
- 🚀 **Efficient WebDAV**: No unnecessary API calls when browsing
- 🚀 **Smart caching**: 7-day cache prevents redundant API requests

#### Breaking Changes:
- ⚠️ **URL structure completely changed**
- ⚠️ **No more show-based grouping** 
- ⚠️ **Progressive caching disabled**
- ⚠️ **Database wiped and rebuilt**


### 2025-06-06 - Final Cleanup: Removed `/html/` Endpoint
- ✅ **Removed `/html/` endpoint entirely** (was duplicate of `/files/`)
- ✅ **Added complete functionality to `/files/`**:
  - Search/filtering functionality (`handleSearch()`)
  - Grid/List toggle buttons (`#grid-btn` and `#list-btn`) with list as default
  - Separate grid and list view layouts
  - Mobile-friendly headers and breadcrumbs
- ✅ **Updated sidebar navigation**:
  - Removed "HTML File Browser" 
  - Changed "WebDAV for Infuse" to orange color (#ea580c) and same server icon
- ✅ **Cleaned up worker.ts** by removing obsolete `handleHTMLRequest` function

### Final Endpoint Structure
- **`/` (Root)**: Homepage with status and navigation
- **`/files/`**: Complete HTML file browser with search & toggle functionality
- **`/dav/`**: WebDAV endpoint (standard)
- **`/infuse/`**: WebDAV endpoint (Infuse, orange-themed)
- **`/strm/`**: STRM download endpoint

### ⚠️ IMPORTANT REMINDER PRESERVED
**NEVER REMOVE THE GRID/LIST TOGGLE BUTTONS**
- Always preserve `#grid-btn` and `#list-btn` elements
- List view is always the default (`#list-btn` default)
- Both root page and directory pages must have these toggles
- Toggle functionality is in `setViewMode()` function - don't remove


### 2025-06-06 - Cache Statistics Display Fix
- ✅ **Fixed cache statistics display format**: Changed from confusing "X detailed, Y pending (Z total)" to clear "X cached, Y pending, Z duplicates"
- ✅ **Added duplicate detection**: Now properly counts unique torrent IDs vs total database entries
- ✅ **Improved cache accuracy**: Better detection of cached vs pending torrents using `cache_timestamp` and file details
- ✅ **Database migration**: Added `cache_timestamp` column with schema-migration-003.sql
- ✅ **Fixed cache statistics logic**: Now accounts for the on-demand caching system properly

#### Cache Statistics Logic:
- **Cached**: Torrents with detailed file information OR cache_timestamp set
- **Pending**: Unique torrents without detailed cache data  
- **Duplicates**: Extra database entries for the same torrent ID (RD library duplicates)
- **Total**: Count of unique torrents (not total database entries)

#### Example Display:
```
73 torrents
1 cached, 65 pending, 7 duplicates
```

### 2025-06-08 - Homepage: Username & Password Status + Add Missing Secrets Button
- ✅ **Added "Username & Password:" status display** below "Real Debrid Token:" on homepage
- ✅ **Joint status logic**: Shows "✓ Configured" (green) if both USERNAME and PASSWORD are set, "○ Optional" (yellow) if either is missing
- ✅ **Added "Add Missing Secrets" button** when RD_TOKEN is missing (required secret)
- ✅ **Button styling**: Matches existing design with external link icon and btn-outline styling
- ✅ **Direct link**: Button points to Cloudflare docs for adding environment variables via dashboard
- ✅ **Improved user experience**: Clear visual indication of configuration status and direct path to fix missing secrets

#### Implementation Details:
- **Status logic**: `hasAuth = hasUsername && hasPassword` - both must be present for "Configured" status
- **Button trigger**: Shows when `missingSecrets = !hasToken || !hasUsername || !hasPassword` (any of the three missing)
- **Color coding**: Green (configured), Yellow (optional/missing), Red (required missing)
- **URL**: Links to `https://developers.cloudflare.com/workers/configuration/environment-variables/#add-environment-variables-via-the-dashboard`

This enhancement provides immediate visual feedback about configuration status and a direct path to resolve missing secrets after Deploy to Cloudflare button usage.


- ❌ **DISCOVERED**: Deploy to Cloudflare button can ONLY create plaintext environment variables, NOT secrets
- ❌ **ISSUE**: Sensitive data (RD_TOKEN, USERNAME, PASSWORD) was being deployed as visible plaintext
- ✅ **FIXED**: Removed all sensitive variables from `deploy.json`
- ✅ **SOLUTION**: Users must manually configure secrets post-deployment
- ✅ **Updated deploy.json**:
  - Removed: RD_TOKEN, USERNAME, PASSWORD, STRM_TOKEN (sensitive)
  - Kept: Non-sensitive configuration variables only
  - Changed success_url to redirect to setup instructions
- ✅ **Updated README.md**: Added comprehensive "Post-Deployment Setup" section with step-by-step instructions
- ✅ **Security improvement**: No sensitive data exposed as plaintext environment variables

#### Deploy to Cloudflare Button Limitation:
The Deploy to Cloudflare button is designed for quick deployment of applications but has a fundamental limitation: it can only create plaintext environment variables, not encrypted secrets. This is a known Cloudflare limitation, not a bug in our configuration.

**Before**: Users clicked deploy → saw sensitive API tokens as plaintext variables ❌
**After**: Users click deploy → follow clear setup instructions to add secrets properly ✅

#### New Deployment Flow:
1. User clicks Deploy to Cloudflare button
2. Cloudflare deploys with non-sensitive configuration only  
3. User redirected to README#post-deployment-setup
4. User manually adds secrets via dashboard or CLI
5. Application works securely with encrypted secrets

This approach ensures security while maintaining the convenience of one-click deployment for the application structure and non-sensitive configuration.


