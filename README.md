# Zurg Serverless

A modern, serverless Real-Debrid WebDAV server with HTML browser interface and .STRM file-based streaming, running on Cloudflare Workers.

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-serverless)

## Features

### Dual Interface
- **File Browser**: web interface for browsing your media library
- **WebDAV endpoints**: compatible with media players, optimized for Infuse

### Smart Streaming System
- **.strm files only**: each contains a short link (e.g., `/strm/ABCD1234WXYZ5678`)
- **consistent URLs**: links remain stable while redirecting to up-to-date Real Debrid download links
- **intelligent caching**: 7-day URL caching with automatic regeneration
- **error fallback**: .STRM redirects to an error video when media is unavailable.

### Serverless Architecture
- **Cloudflare Workers**: Global edge computing
- **Cloudflare D1**: Distributed SQLite database

## Quick Deploy

### One-Click Deployment
[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-serverless)

You will be prompted for:
- `RD_TOKEN` your Real Debrid API token
- `USERNAME` and `PASSWORD` for basic authentication (optional)
- custom domain or subdomain (optional)

### Manual Setup

```bash
git clone https://github.com/andesco/zurg-serverless
cd zurg-serverless
npm install
wrangler login
npm run dev
```

For production deployment:
```bash
npm run deploy-local
wrangler secret put RD_TOKEN
wrangler secret put USERNAME
wrangler secret put PASSWORD
```

## Usage

| Interface | URL | Purpose |
|-----------|-----|---------|
| **File Browser** | `https://your-worker.workers.dev/` | web interface |
| **WebDAV** | `https://your-worker.workers.dev/dav` | standard endpoint|
| **WebDAV for Infuse** | `https://your-worker.workers.dev/infuse` | optimized endpoint |

## Configuration

### Required Secrets
```bash
wrangler secret put RD_TOKEN        # your Real Debrid API token
wrangler secret put USERNAME        # optional: basic auth. username
wrangler secret put PASSWORD        # optional: basic auth. password
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `REFRESH_INTERVAL_SECONDS` | `15` | Torrent sync frequency |
| `TORRENTS_PAGE_SIZE` | `1000` | Real-Debrid API page size |
| `API_TIMEOUT_SECONDS` | `30` | Request timeout |

## Development

```bash
npm run dev                 # local development
npm run deploy-staging      # deploy to staging
npm run deploy-local        # deploy to production
```

The project uses both:
- a `wrangler.toml` template to support [Deploy to Cloudflare](https://developers.cloudflare.com/workers/platform/deploy-buttons/); and
- a `wrangler.local.toml` for development & command-line deployment.

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

### Troubleshooting

**Empty directory listings:**
- verify Real-Debrid token is valid: `wrangler secret list`
- check logs: `wrangler tail`

### Update Error Video

The error video was generated using [FFmpeg](https://ffmpeg.org):

```bash not_found.mp4
read -p "error message to display via streaming video:" error_message \
  && error_message=${error_message:-media file not found}
ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=10 \
  -vf "drawtext=fontfile=/path/to/font.ttf:text='${error_message}':fontsize=96:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -t 10 -pix_fmt yuv420p -movflags +faststart not_found.mp4
  ```
