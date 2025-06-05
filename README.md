# Zurg Serverless

A modern, serverless Real-Debrid WebDAV server with HTML browser interface and .STRM file-based streaming, running on Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/debridmediamanager/zurg-serverless)

## ✨ Recent Improvements

- 🚀 **Deploy to Cloudflare button** - One-click deployment
- ⚡ **Rate-limited Real-Debrid API** - Prevents 429 errors and API overload
- 🔒 **WebDAV-safe security headers** - Enhanced security without breaking media players  
- 🎥 **Smart STRM fallback** - Serves error video when media files are unavailable
- 🛠️ **Dual configuration** - Supports both Deploy button and personal development

## Features

### 🎯 **Dual Interface**
- **HTML browser**: Modern web interface for browsing your media library
- **WebDAV endpoints**: Compatible with media players, optimized for Infuse

### ⚡ **Smart .STRM Streaming System**
- **STRM files only** - Each contains a short link (e.g., `/strm/ABCD1234WXYZ5678`)
- **Consistent URLs** - Links remain stable while redirecting to fresh Real-Debrid URLs
- **Intelligent caching** - 7-day URL caching with automatic regeneration
- **Error fallback** - Custom error video when media is unavailable

### 🌐 **Serverless Architecture**
- **Cloudflare Workers** - Global edge computing
- **Cloudflare D1** - Distributed SQLite database
- **Rate limiting** - Respects Real-Debrid API limits
- **Security headers** - Safe for WebDAV clients

## 🚀 Quick Deploy

### One-Click Deployment
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/debridmediamanager/zurg-serverless)

You'll be prompted for:
- **RD_TOKEN** (required) - Your Real-Debrid API token
- **USERNAME/PASSWORD** (optional) - Basic authentication
- **Custom domain** (optional) - Your own domain

### Manual Setup

```bash
git clone https://github.com/debridmediamanager/zurg-serverless
cd zurg-serverless
npm install
wrangler login
npm run dev
```

For production deployment:
```bash
npm run deploy
wrangler secret put RD_TOKEN
```

## 🎯 Usage

| Interface | URL | Purpose |
|-----------|-----|---------|
| **HTML Browser** | `https://your-worker.workers.dev/` | Web interface |
| **WebDAV (Standard)** | `https://your-worker.workers.dev/dav` | Standard WebDAV |
| **WebDAV (Infuse)** | `https://your-worker.workers.dev/infuse` | Optimized for Infuse |

## ⚙️ Configuration

### Required Secrets
```bash
wrangler secret put RD_TOKEN        # Your Real-Debrid API token
wrangler secret put USERNAME        # Optional: Basic auth username  
wrangler secret put PASSWORD        # Optional: Basic auth password
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `REFRESH_INTERVAL_SECONDS` | `15` | Torrent sync frequency |
| `TORRENTS_PAGE_SIZE` | `1000` | Real-Debrid API page size |
| `API_TIMEOUT_SECONDS` | `30` | Request timeout |
| `HIDE_BROKEN_TORRENTS` | `true` | Hide incomplete torrents |

## 🛠️ Development

### Personal Development Setup
For your own development and production deployments:

```bash
# Development
npm run dev                 # Local development  
npm run deploy-staging      # Deploy to staging
npm run deploy              # Deploy to production

# Template testing  
npm run dev-template        # Test Deploy button template
```

The project uses dual configuration:
- `wrangler.toml` - Clean template for Deploy button
- `wrangler.local.toml` - Personal development/production config

### Project Structure
```
src/
├── worker.ts           # Main Worker entry point
├── realdebrid.ts       # Rate-limited Real-Debrid client  
├── storage.ts          # D1 database operations
├── strm-handler.ts     # STRM URL resolution with fallback
├── security.ts         # WebDAV-safe security headers
├── webdav-handlers.ts  # WebDAV protocol handling
├── html-browser.ts     # HTML interface
└── types.ts            # TypeScript definitions
```

## 🔧 Performance & Reliability

- **Rate limiting** - 1-second intervals prevent Real-Debrid API errors
- **Intelligent fallback** - Automatic URL regeneration on cache miss  
- **Error handling** - Custom error video for unavailable media
- **Security headers** - Applied only to HTML endpoints, preserving WebDAV compatibility
- **Global caching** - Cloudflare's edge network for low latency

## 🐛 Troubleshooting

**Empty directory listings:**
- Verify Real-Debrid token is valid: `wrangler secret list`
- Check logs: `wrangler tail`

**WebDAV connection issues:**
- Ensure credentials are set if using authentication
- Try both `/dav` and `/infuse` endpoints

**Deploy button issues:**
- Check that your repository is public
- Verify `wrangler.toml` has correct structure

---

Built with ❤️ for the Zurg community
