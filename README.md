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

After deployment, you'll need to configure your secrets manually (see [Post-Deployment Setup](#post-deployment-setup) below).

## Post-Deployment Setup

**⚠️ Important**: After using the Deploy to Cloudflare button, you must manually configure your secrets for the application to work.

### Step 1: Add Required Secrets

1. **Go to your Worker settings**:
   - Visit [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Workers & Pages** → Your Worker → **Settings**

2. **Add your Real-Debrid API token**:
   - Under **Variables and Secrets**, click **Add**
   - Select type: **Secret**
   - Variable name: `RD_TOKEN`
   - Value: Your Real-Debrid API token ([get from here](https://real-debrid.com/apitoken))
   - Click **Deploy**

3. **Add Basic Authentication (optional)**:
   - Add another secret with name: `USERNAME` and your desired username
   - Add another secret with name: `PASSWORD` and your desired password
   - Add another secret with name: `STRM_TOKEN` (optional, for STRM file protection)
   - Click **Deploy**

### Step 2: Test Your Deployment

Visit your Worker URL (found in the dashboard) to verify it's working:
- You should see the Zurg Serverless homepage
- If you set USERNAME/PASSWORD, you'll be prompted for authentication
- Check the cache statistics to ensure Real-Debrid connection is working

### Alternative: Command Line Setup

If you prefer using Wrangler CLI:
```bash
# Clone the generated repository
git clone <your-new-repository-url>
cd <your-repository-name>

# Set secrets via command line
wrangler secret put RD_TOKEN
wrangler secret put USERNAME    # optional
wrangler secret put PASSWORD    # optional
wrangler secret put STRM_TOKEN  # optional
```

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
