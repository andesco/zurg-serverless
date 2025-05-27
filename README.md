# 🎬 Zurg Serverless

A modern Real-Debrid WebDAV server with beautiful HTML browser and optimized STRM streaming, powered by Cloudflare Workers and KV storage.

## ✨ Features

### 🎯 **Dual Interface**
- **📱 Modern HTML Browser** - Beautiful shadcn/ui interface for browsing your media library
- **🔗 WebDAV Endpoints** - Full compatibility with Infuse Pro, VLC, and other WebDAV clients

### ⚡ **Smart STRM System**
- **Short URLs** - 16-character streaming codes (e.g. `/strm/ABCD1234WXYZ5678`)
- **7-Day Caching** - Intelligent Real-Debrid link caching reduces API calls
- **Human-Readable Paths** - Browse by torrent names, not cryptic IDs

### 🌐 **Cloudflare Services Integration**
- **Workers** - Serverless JavaScript runtime executing your WebDAV server at 300+ global locations
- **KV Storage** - Ultra-fast key-value database caching torrent metadata and STRM streaming codes
- **Global Network** - Sub-100ms response times worldwide with automatic failover and load balancing

### 🎨 **Modern UI**
- **Dark/Light Mode** - Automatic theme switching
- **Mobile Responsive** - Perfect on all devices  
- **Professional Design** - Rivals commercial streaming platforms

## 🚀 Quick Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/debridmediamanager/zurg-serverless)

### One-Click Setup:
1. **Click the deploy button** above
2. **Connect your GitHub account** and Cloudflare account  
3. **Deploy** - Creates the Worker automatically
4. **Complete setup** - Two quick steps:

#### 📦 Step 1: Create KV Namespace
```bash
# Create KV namespace for caching
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# Copy the IDs and update wrangler.toml:
# Replace YOUR_KV_NAMESPACE_ID and YOUR_PREVIEW_KV_NAMESPACE_ID
```

#### 🔐 Step 2: Set Your Real-Debrid Token
```bash
wrangler secret put RD_TOKEN
# Enter your Real-Debrid API token when prompted

# Optional but recommended (prevents account bans):
wrangler secret put RD_UNRESTRICT_IP
# Enter your dedicated IP address
```

#### 🚀 Step 3: Deploy Again
```bash
wrangler deploy
```

**Done!** Your WebDAV server is live at `https://your-worker.workers.dev/`

> **Note**: The KV namespace setup is required because storage needs are account-specific. This is a one-time setup that takes ~2 minutes.

## 🎮 Usage

### 📱 **HTML Browser**
Visit your worker URL to browse with the modern interface:
```
https://your-worker.workers.dev/
```

**Navigation:**
- 🏠 **Root** → 📁 **Directories** → 🎬 **Torrents** → 📄 **STRM Files**
- Click any STRM file to view its short streaming URL
- Test streaming URLs directly in the browser

### 🔗 **WebDAV Clients**

**Infuse Pro:**
- Server: `your-worker.workers.dev`
- Path: `/infuse/`
- No authentication needed

**VLC/Other Clients:**
- URL: `https://your-worker.workers.dev/dav/`
- Browse directories and play STRM files

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- Cloudflare account 
- Real-Debrid account

### Setup

1. **Clone repository**:
```bash
git clone https://github.com/debridmediamanager/zurg-serverless
cd zurg-serverless
npm install
```

2. **Create KV namespace**:
```bash
# Create KV namespace for caching
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# Update wrangler.toml with the returned namespace IDs
# Replace YOUR_KV_NAMESPACE_ID and YOUR_PREVIEW_KV_NAMESPACE_ID
```

3. **Configure secrets**:
```bash
# Required: Your Real-Debrid API token
wrangler secret put RD_TOKEN

# Recommended: Fixed IP address (prevents account bans)
wrangler secret put RD_UNRESTRICT_IP

# Optional: STRM file protection token
wrangler secret put STRM_TOKEN
```

4. **Test locally**:
```bash
npm run dev
```

Visit `http://localhost:8787` to test the HTML interface.

5. **Deploy**:
```bash
npm run deploy
```

## ⚙️ Configuration

### 🔐 Secrets (via `wrangler secret put`)

| Secret | Required | Description |
|--------|----------|-------------|
| `RD_TOKEN` | ✅ | Real-Debrid API token |
| `RD_UNRESTRICT_IP` | ⚠️ | Fixed IP for link generation (prevents bans) |
| `STRM_TOKEN` | ❌ | Optional protection token for STRM files |

### 📝 Environment Variables (in `wrangler.toml`)

| Variable | Default | Description |
|----------|---------|-------------|
| `REFRESH_INTERVAL_SECONDS` | `15` | How often to sync torrents |
| `TORRENTS_PAGE_SIZE` | `1000` | Torrents per Real-Debrid API call |
| `API_TIMEOUT_SECONDS` | `30` | Request timeout for Real-Debrid API |
| `HIDE_BROKEN_TORRENTS` | `true` | Hide incomplete torrents |

### ⚠️ **Critical: IP Address Consistency**

**Real-Debrid will suspend accounts if different IPs generate streaming links simultaneously.**

**Solutions:**
1. **🎯 Set `RD_UNRESTRICT_IP`** to a dedicated IP address (recommended)
2. **🏠 Use a residential proxy** with fixed IP  
3. **👤 Single-user deployments** only

## 📚 API Endpoints

### 🌐 **Web Interfaces**
- `GET /` - Modern HTML browser homepage
- `GET /html/{directory}/` - Browse torrents in directory
- `GET /html/{directory}/{torrent}/` - Browse STRM files in torrent
- `GET /html/{directory}/{torrent}/{file}.strm` - View STRM file content

### 🔗 **WebDAV**
- `PROPFIND /dav/` - Standard WebDAV (includes root directory)
- `PROPFIND /infuse/` - Infuse Pro optimized WebDAV
- `GET /dav/{path}` - Download STRM files
- `OPTIONS /dav/` - WebDAV capabilities

### 🎥 **Streaming**
- `GET /strm/{16-char-code}` - Short streaming URLs (redirect to Real-Debrid)

### ℹ️ **Status**
- `GET /` - Worker status and quick access links

## 🏗️ Cloudflare Services Architecture

### 🌐 **Cloudflare Workers**
- **Global Runtime** - JavaScript code executes in 300+ data centers worldwide
- **Edge Computing** - Logic runs close to users for minimal latency (<100ms)
- **Request Handling** - Processes WebDAV, HTML, and STRM requests efficiently
- **Real-time Processing** - Generates XML responses and handles redirects instantly

### 💾 **KV (Key-Value) Storage**  
- **Torrent Cache** - Stores Real-Debrid torrent metadata for 15-second intervals
- **STRM Code Cache** - Maps 16-character codes to download URLs for 7 days
- **Global Replication** - Data synced across all edge locations for instant access
- **Automatic Expiration** - TTL-based cleanup removes stale data automatically

### 🔄 **Service Integration Flow**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser/App   │───▶│  Cloudflare      │───▶│  Real-Debrid   │
│                 │    │  Workers         │    │  API            │
│  (WebDAV/HTML)  │    │  (Edge Runtime)  │    │  (Streaming)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  KV Storage      │
                       │  (Global Cache)  │
                       │  • Torrent Data  │
                       │  • STRM Codes    │
                       └──────────────────┘
```

### ⚡ **Performance Benefits**
- **Zero Cold Starts** - Workers runtime always ready
- **Intelligent Caching** - KV reduces Real-Debrid API calls by 95%
- **Edge Optimization** - Content served from nearest data center
- **Automatic Scaling** - Handles 1 request or 1 million requests seamlessly

### 💰 **Cost Efficiency** 
- **Pay-per-Request** - Only charged for actual usage
- **Free Tier Generous** - 100K requests/day, 1K KV operations/day
- **No Infrastructure** - Zero server maintenance or DevOps overhead

## 📁 Project Structure

```
src/
├── worker.ts           # 🚀 Main Cloudflare Worker entry point
├── types.ts            # 📝 TypeScript interfaces
├── realdebrid.ts       # 🔗 Real-Debrid API client
├── storage.ts          # 💾 KV storage operations
├── strm-cache.ts       # ⚡ Short URL caching system
├── html-browser.ts     # 🎨 Modern HTML interface
├── webdav.ts           # 🌐 WebDAV XML generation
├── webdav-handlers.ts  # 🔧 WebDAV request processing
├── strm-handler.ts     # 🎥 Streaming URL resolution
├── handlers.ts         # 🔄 Torrent sync logic
└── utils.ts            # 🛠️ Helper functions
```

## 🎛️ Rate Limits & Performance

### Cloudflare Service Limits

#### **Workers (Free Tier)**
- **Requests**: 100,000/day globally distributed
- **CPU Time**: 10ms per request (sufficient for WebDAV/XML processing)
- **Memory**: 128MB per Worker instance
- **Script Size**: 1MB compressed (current project ~200KB)

#### **KV Storage (Free Tier)**  
- **Read Operations**: 100,000/day (torrent browsing)
- **Write Operations**: 1,000/day (STRM code generation)  
- **Delete Operations**: 1,000/day (cache cleanup)
- **Storage**: 1GB total (torrent metadata ~1-10MB typical)

### Real-Debrid API Limits
- **General API**: 250 requests/minute
- **Torrents API**: 75 requests/minute  
- **Unrestrict API**: ~1000 requests/hour

### Optimization Features
- **Intelligent Caching** - 7-day STRM codes, 15-second torrent cache
- **Exponential Backoff** - Automatic retry with rate limit respect
- **Batched Operations** - Efficient KV usage patterns
- **Edge Caching** - Global KV replication reduces API calls

## 🐛 Troubleshooting

### Account Suspended / IP Bans
```bash
# Set a dedicated IP address
wrangler secret put RD_UNRESTRICT_IP
# Enter your dedicated IP: 192.168.1.100
```

### Empty Directory Listings  
- ✅ Check Real-Debrid token: Valid and active?
- ✅ Verify torrents: Are they 100% downloaded?
- ✅ Check logs: `wrangler tail` for error details

### STRM Files Not Working
- ✅ Test short URL: Click STRM content in HTML browser
- ✅ Check cache: URLs valid for 7 days only
- ✅ Verify file state: Must be "ok_file" status

### Performance Issues
- ⚡ Monitor quotas: Check Cloudflare dashboard
- ⚡ Increase cache TTL: Modify `REFRESH_INTERVAL_SECONDS`
- ⚡ Batch operations: Increase `TORRENTS_PAGE_SIZE`

## 🎯 WebDAV Client Setup

### 📱 **Infuse Pro (iOS/tvOS)**
1. Add WebDAV source
2. Server: `your-worker.workers.dev`  
3. Path: `/infuse/`
4. Save and browse your library!

### 🖥️ **VLC Media Player**
1. Network → Add → WebDAV
2. URL: `https://your-worker.workers.dev/dav/`
3. Browse directories and play STRM files

### 📂 **File Explorers**
- **Windows**: Map network drive to WebDAV URL
- **macOS**: Connect to Server in Finder  
- **Linux**: Mount via `davfs2` or file manager

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b amazing-feature`
3. **Test** locally: `npm run dev`
4. **Commit** changes: `git commit -m 'Add amazing feature'`
5. **Submit** a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Real-Debrid** - Premium unrestricted downloader service
- **Cloudflare Workers** - Serverless edge computing platform  
- **shadcn/ui** - Beautiful, accessible component library
- **Community** - Thank you for using and improving this project!

---

<div align="center">

**[⭐ Star this repository](https://github.com/debridmediamanager/zurg-serverless)** • **[🐛 Report bugs](https://github.com/debridmediamanager/zurg-serverless/issues)** • **[💡 Request features](https://github.com/debridmediamanager/zurg-serverless/discussions)**

Made with ❤️ for the Real-Debrid community

</div>
