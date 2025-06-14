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

## Environment Configuration

### Configuration Files
- **`.dev.vars`** - Local development secrets (git-ignored)
- **`wrangler.local.toml`** - Personal development and production configuration
- **`wrangler.toml`** - Template configuration for Deploy button

### Local Development Workflow
```bash
# 1. Set up local secrets
cp .dev.vars.example .dev.vars  # Create from template
# Edit .dev.vars with your Real-Debrid token: RD_TOKEN="your_token_here"

# 2. Start local development
wrangler dev --config wrangler.local.toml

# 3. Deploy to production
wrangler deploy --config wrangler.local.toml --env production
```

### Environment Variables by Environment

#### Local Development (default)
- Uses `.dev.vars` for secrets like `RD_TOKEN`, `STRM_TOKEN`, `USERNAME`, `PASSWORD`
- Local D1 database with faster refresh intervals for testing
- Smaller page sizes for quicker iteration

#### Production 
- Uses encrypted Cloudflare secrets set via `wrangler secret put RD_TOKEN --env production`
- Production D1 database with optimized settings
- Custom domain routing and cron triggers enabled

## Deployment Methods

### Deploy to Cloudflare Button
- Uses template `wrangler.toml` configuration
- Cloudflare runs `npx wrangler deploy` automatically
- For new users and one-click deployment

### Manual Deployment (Local Development)
- Uses `wrangler.local.toml` with environment configs
- **Two environments only**: Local Development + Production
- Local development uses `wrangler dev` with local D1 database
- Production deployment: `wrangler deploy --config wrangler.local.toml --env production`

### Environment Strategy
- **Local Development**: `wrangler dev` → Uses `.dev.vars` for secrets, local D1 storage
- **Production**: `wrangler deploy --env production` → Uses encrypted secrets, production D1 database
- **No staging environment** → Simplified workflow, reduced API costs and resource usage

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

#### Using Git Alias (Recommended)
```bash
# Use the custom git alias for quick releases
git zurg-release
git commit -m "Release X.Y.Z: Description of changes"
git push origin main
```

#### Manual Process
```bash
# Squash merge claude commits into clean release commit
git checkout main
git merge --squash claude
git commit -m "Release X.Y.Z: Description of changes"
git push origin main
```

**Git Alias Setup**: `git config --global alias.zurg-release '!f() { git checkout main && git merge --squash claude && echo "Ready to commit release. Run: git commit -m \"Release X.Y.Z: Description\""; }; f'`

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

### 2025-06-08 - Database Configuration Fix & Schema Application
- ❌ **ISSUE**: `D1_ERROR: no such table: cache_metadata` on both worker deployments
- ✅ **ROOT CAUSE**: Database ID changed and schema not applied to new database
- ✅ **FIXED**: Updated database ID to `af42ed0a-06bc-47e5-81a1-8c078e4286d7`
- ✅ **APPLIED**: Full schema.sql to zurg-serverless-private database
- ✅ **DEPLOYED**: Latest code to both workers:
  - `zurg-serverless` (main production): Version `0eb865cf-f249-4955-8165-c3e44c3968ce`
  - `zurg-serverless-private`: Version `d2cdc2f2-b6fc-44db-84ac-d14828d4d471`

#### Database Schema Applied:
- ✅ **14 queries executed**: All tables, indexes, and triggers created
- ✅ **6 tables created**: cache_metadata, torrents, directories, strm_cache, strm_mappings, cache_settings
- ✅ **Database size**: 0.08 MB with 25 rows written
- ✅ **Both workers connected**: Using same database with full schema

#### Working URLs:
- **Main Production**: https://serverless.andrewe.link/files/
- **Private Instance**: https://zurg-serverless-private.andrewe.workers.dev/files/

Both deployments now have proper database connectivity and should work without the cache_metadata table error.


- ✅ **DEPLOYED**: All latest changes successfully deployed to production
- ✅ **URL**: https://serverless.andrewe.link 
- ✅ **Version ID**: eaa8a4e1-dd72-4b2b-9fe6-75f811f5ef88
- ✅ **Database**: zurg-serverless-private (8dba8a7a-b18b-4fee-bfb0-148f5ba04944)
- ✅ **Features deployed**:
  - Deploy to Cloudflare button security fixes
  - Post-deployment setup instructions in README
  - Homepage Username & Password status display
  - Add Missing Secrets button functionality
  - Fixed duplicate method issue in storage.ts

#### Deployment Fixes Applied:
- **Database configuration**: Updated production database ID to use available database
- **Code cleanup**: Renamed duplicate `getUncachedTorrents()` to `getAllUncachedTorrents()`
- **Configuration**: Custom domain and cron triggers properly configured
- **Performance**: 10ms worker startup time, 178.22 KiB upload size

The production environment is now running the latest version with all the Deploy to Cloudflare improvements and homepage enhancements.


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

### 2025-06-11 - Proactive New Torrent Caching
- ✅ **Enhanced torrent list refresh**: Now detects new torrents and proactively fetches details for up to 5 newest ones
- ✅ **Improved media player experience**: Anticipates that media players (like Infuse) will immediately browse new torrent directories
- ✅ **Smart caching strategy**: Fetches details for 5 most recent new torrents during root browse, leaves rest for background processing
- ✅ **Performance optimization**: Reduces cascade of individual API calls when media players explore new content
- ✅ **Worker timeout safety**: Conservative limit of 5 torrents ensures execution stays well under 30-second limit

#### New API Call Pattern:
**For 13 new torrents discovered during root browse:**
- **Root browse**: 1 torrent list call + 5 torrent details calls = **6 total API calls**
- **Immediate availability**: 5 newest torrents ready for browsing without delays
- **Background processing**: 8 remaining torrents cached by hourly cron job
- **User experience**: Media players can immediately browse most recent content

#### Technical Implementation:
- **Detection**: Compares current torrent IDs with `getCachedTorrentIds()` to identify new torrents
- **Selection**: Takes first 5 torrents from new torrent list (most recent additions)
- **Caching**: Fetches full torrent details and updates directory map with file information
- **Error handling**: Failed fetches don't block the refresh process
- **Logging**: Clear feedback about proactive vs background caching

This change transforms "Zurg Serverless" from purely reactive caching to intelligently proactive caching for new content.

### 2025-06-11 - Fixed Cron Job Cache Population Issues
- ✅ **Fixed stale "In Progress" status**: Cron job now properly cleans up stale refresh progress before starting
- ✅ **Enhanced progress tracking**: Improved cache population with better error handling and completion tracking
- ✅ **Stale refresh cleanup**: Added `cleanupStaleRefreshProgress()` method to handle stuck refresh states
- ✅ **Reduced batch size**: Changed from 10 to 5 torrents per batch for better reliability
- ✅ **Better logging**: Added success/failure counts and detailed completion messages
- ✅ **Cron job protection**: Prevents multiple simultaneous cache refreshes and clears stale states
- ✅ **Admin endpoint**: Added `/admin/clear-stale-refresh` to manually clear stuck refresh status

#### Issues Resolved:
- **"In Progress" stuck for days**: Cron job creates proper refresh tracking and completion
- **Multiple refresh entries**: Cleanup prevents accumulation of stale progress records
- **Failed cron execution**: Better error handling and batch processing reliability
- **Timeout handling**: Stale refreshes older than 30 minutes are automatically cleared

#### New Admin Endpoints:
- `/admin/update-cache` - Manually trigger cache population
- `/admin/check-cache-progress` - Check cache progress and clear stuck refresh status

#### Technical Improvements:
- **Batch processing**: 5 torrents per batch with 1-second delays between batches
- **Progress tracking**: Real-time updates with current torrent name and counts
- **Error resilience**: Failed individual torrents don't stop the entire process
- **Completion guarantee**: All cache operations now properly mark as "completed" or "failed"

This fixes the persistent "In Progress" status that was preventing proper cache status display and ensures the hourly cron job works reliably.

### 2025-06-11 - Conservative API Rate Limiting for Cron Jobs
- ✅ **Implemented conservative API batching**: 5 torrents per batch, max 100 torrents per cron job
- ✅ **Adaptive delay strategy**: Fixed 20 seconds between all batches
- ✅ **Real-Debrid API protection**: Respects ~200 requests per 10 minutes rate limiting
- ✅ **Partial completion handling**: Properly tracks progress when hitting 100-torrent limit per cron job
- ✅ **Multi-hour processing**: Large torrent batches (1000+) spread across multiple cron cycles

#### API Rate Limiting Strategy:
```
Batch 1: 5 torrents → wait 20 seconds
Batch 2: 5 torrents → wait 20 seconds  
Batch 3: 5 torrents → wait 20 seconds
...
Batch 20: 5 torrents → done (100 total)
```

#### Performance Calculations:
- **Per cron job**: 100 torrents maximum in ~10 minutes
- **API calls**: 5 calls + 20s + 5 calls + 20s + ... = well under RD limits
- **Large scenarios**: 1000 new torrents = 10 hours to fully cache (completely reasonable)
- **Immediate access**: 5 newest torrents still cached instantly during root browse

#### Benefits:
- **Never hits RD rate limits** - conservative 20 second delays
- **Reliable execution** - stays well under Worker 10-minute timeout
- **Graceful scaling** - handles any number of new torrents over time
- **User experience** - immediate access to recent content, background processing for older content

This ensures "Zurg Serverless" can handle massive torrent library growth while being a good API citizen to Real-Debrid.


