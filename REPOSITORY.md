# Repository Summary

## 📁 Complete Repository Structure

```
zurg-serverless/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD
├── src/
│   ├── worker.ts              # Main Worker entry point
│   ├── types.ts               # TypeScript interfaces
│   ├── realdebrid.ts          # Real-Debrid API client
│   ├── storage.ts             # KV storage manager
│   ├── webdav.ts              # WebDAV XML generators
│   ├── handlers.ts            # Torrent refresh logic
│   ├── webdav-handlers.ts     # WebDAV request handlers
│   └── utils.ts               # Helper functions
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore rules
├── LICENSE                    # MIT License
├── README.md                  # Main documentation
├── SETUP.md                   # Detailed setup guide
├── deploy.json                # Deploy button configuration
├── package.json               # Node.js dependencies
├── test-local.sh              # Local testing script
├── tsconfig.json              # TypeScript configuration
└── wrangler.toml              # Cloudflare Workers configuration
```

## 🚀 Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/your-username/zurg-serverless
cd zurg-serverless
npm install
```

2. **Configure KV namespace**:
```bash
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview
# Update wrangler.toml with the returned namespace IDs
```

3. **Set your Real-Debrid token**:
```bash
wrangler secret put RD_TOKEN
# Enter your token from https://real-debrid.com/apitoken
```

4. **Test locally**:
```bash
./test-local.sh
# Or: npm run dev
```

5. **Deploy**:
```bash
npm run deploy
```

## 🎯 What This Implements

### ✅ Core Features Implemented
- **Dual WebDAV endpoints** (`/dav/` and `/infuse/`)
- **STRM-only file serving** (no direct video streaming)
- **Real-Debrid API integration** with rate limiting
- **Cloudflare KV storage** for torrent caching
- **15-second refresh interval** (configurable)
- **IP consistency** for unrestrict calls
- **TypeScript** for type safety
- **Serverless architecture** on Cloudflare Workers

### 🔧 Architecture Components
- **RealDebridClient**: API client with timeout and rate limiting
- **StorageManager**: KV operations for torrent and directory storage
- **WebDAVGenerator**: XML response generation for DAV and Infuse
- **Handlers**: Torrent refresh and WebDAV request processing

### 📡 API Endpoints
- `GET /` - Status page
- `PROPFIND /dav/` - Standard WebDAV root (includes root directory)
- `PROPFIND /infuse/` - Infuse-optimized root (no root directory)
- `PROPFIND /dav/__all__/` - Directory listings
- `PROPFIND /dav/__all__/{torrent}/` - STRM file listings

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RD_TOKEN` | ✅ | Real-Debrid API token |
| `RD_UNRESTRICT_IP` | ⚠️ | Fixed IP (prevents RD bans) |
| `STRM_TOKEN` | ❌ | STRM file protection |
| `REFRESH_INTERVAL_SECONDS` | ❌ | Refresh interval (default: 15) |
| `TORRENTS_PAGE_SIZE` | ❌ | API page size (default: 1000) |

## 🎮 Infuse Integration

1. **Add WebDAV Source in Infuse**:
   - Server: `your-worker.workers.dev`
   - Path: `/infuse/`
   - Port: `443` (HTTPS)

2. **Browse and Play**:
   - Navigate through your torrent library
   - Play STRM files directly
   - Automatic Real-Debrid link resolution

## 🛠️ Development Notes

### Rate Limiting
- Real-Debrid: 250 requests/min (general), 75 requests/min (torrents)
- Implemented exponential backoff

### KV Storage Schema
- `cache_metadata` - Refresh timestamps and checksums
- `torrent:{id}` - Individual torrent data
- `dir:{directory}` - Directory → torrent mappings

### WebDAV Differences
- **DAV**: Includes root directory entry, uses file timestamps
- **Infuse**: No root entry, uses torrent timestamps

This repository provides a complete, production-ready serverless Real-Debrid WebDAV server optimized for Infuse with STRM files.
