# 🎬 Zurg Serverless

A modern, serverless Real-Debrid WebDAV server with beautiful HTML browser and optimized STRM streaming, running on Cloudflare Workers.

## ✨ Features

### 🎯 **Dual Interface**
- **📱 Modern HTML Browser** - Beautiful shadcn/ui interface for browsing your media library
- **🔗 WebDAV Endpoints** - Full compatibility with Infuse and other WebDAV media players

### ⚡ **Smart STRM System**
- **Short URLs** - 16-character streaming codes (e.g. `/strm/ABCD1234WXYZ5678`)
- **7-Day Caching** - Intelligent Real-Debrid link caching reduces API calls
- **Human-Readable Paths** - Browse by torrent names, not cryptic IDs

### 🌐 **Serverless Architecture**
- **Global Edge Deployment** - Sub-100ms response times worldwide
- **Pay-Per-Request** - No idle costs, scales automatically
- **IP Consistency** - Prevents Real-Debrid account suspensions

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
4. **Complete setup** - One simple command:

#### 🎯 Automated Setup (Recommended)
```bash
# One command to set up everything:
npm run setup
```
This will:
- ✅ Create KV namespaces automatically
- ✅ Update wrangler.toml with correct IDs
- ✅ Guide you through the process

#### 🔐 Set Your Environment Variables
After setup, configure your tokens in the Cloudflare dashboard:
1. Go to **Workers & Pages** → **Your Worker** → **Settings** → **Variables**
2. Fill in the pre-defined variables:
   - `RD_TOKEN` - Your Real-Debrid API token (required)
   - `RD_UNRESTRICT_IP` - Your dedicated IP (recommended)
   - Other optional settings as needed

#### 🚀 Deploy
```bash
npm run deploy
```

**Done!** Your WebDAV server is live at `https://your-worker.workers.dev/`

---

<details>
<summary>🔧 Manual Setup (Alternative)</summary>

If you prefer manual setup:

```bash
# Create KV namespace for caching
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# Update wrangler.toml with the returned IDs
# Set secrets via CLI
wrangler secret put RD_TOKEN
wrangler secret put RD_UNRESTRICT_IP  # optional but recommended

# Deploy
wrangler deploy
```

</details>

> **⚠️ Security Note**: Never put sensitive tokens like `RD_TOKEN` in the `[vars]` section of `wrangler.toml`. Always use `wrangler secret put` for sensitive data.

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
# Replace YOUR_KV_NAMESPACE_ID and YOUR_PREVIEW_KV_NAMESPACE_ID with actual values
```

3. **Configure secrets** (IMPORTANT - Use secrets, not vars):
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

### 🔐 Secrets vs Variables

**⚠️ CRITICAL**: Sensitive data must use `wrangler secret put`, never `[vars]` in wrangler.toml

| Data Type | Method | Reason |
|-----------|--------|---------|
| `RD_TOKEN` | `wrangler secret put RD_TOKEN` | ✅ Encrypted, hidden from dashboard |
| `RD_UNRESTRICT_IP` | `wrangler secret put RD_UNRESTRICT_IP` | ✅ Encrypted, hidden from dashboard |
| `STRM_TOKEN` | `wrangler secret put STRM_TOKEN` | ✅ Encrypted, hidden from dashboard |
| `REFRESH_INTERVAL_SECONDS` | `[vars]` in wrangler.toml | ✅ Public, non-sensitive configuration |

### 🔐 Secrets (via `wrangler secret put`)

| Secret | Required | Description |
|--------|----------|-------------|
| `RD_TOKEN` | ✅ | Real-Debrid API token |
| `RD_UNRESTRICT_IP` | ⚠️ | Fixed IP for link generation (prevents bans) |
| `STRM_TOKEN` | ❌ | Optional protection token for STRM files |

### 📝 Environment Variables (in `wrangler.toml` `[vars]`)

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

**Flow:**
1. **Browse** → HTML interface or WebDAV client
2. **Cache** → Torrent data stored in KV for 15 seconds
3. **Stream** → Short codes cached for 7 days
4. **Redirect** → Direct streaming from Real-Debrid

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

### Real-Debrid API Limits
- **General API**: 250 requests/minute
- **Torrents API**: 75 requests/minute
- **Unrestrict API**: ~1000 requests/hour

### Worker Limits (Free Tier)
- **Requests**: 100,000/day
- **CPU Time**: 10ms per request
- **KV Operations**: 1,000/day

### Optimization Features
- **Intelligent Caching** - 7-day STRM codes, 15-second torrent cache
- **Exponential Backoff** - Automatic retry with rate limit respect
- **Batched Operations** - Efficient KV usage patterns

## 🐛 Troubleshooting

### 🚀 **Deployment Issues**

#### "KV namespace not found"
```bash
# Check your KV namespace exists:
wrangler kv:namespace list

# If missing, create it:
wrangler kv:namespace create "KV"
wrangler kv:namespace create "KV" --preview

# Update wrangler.toml with the returned IDs
```

#### "RD_TOKEN is undefined"
```bash
# Verify secret is set:
wrangler secret list

# If missing, set it:
wrangler secret put RD_TOKEN
```

#### "Invalid configuration"
- ✅ Check `wrangler.toml` has valid KV namespace IDs (not placeholder text)
- ✅ Ensure sensitive data uses `wrangler secret put`, not `[vars]`
- ✅ Verify `binding = "KV"` matches code expectations

### 🔐 **Account Suspended / IP Bans**
```bash
# Set a dedicated IP address
wrangler secret put RD_UNRESTRICT_IP
# Enter your dedicated IP: 192.168.1.100
```

### 📂 **Empty Directory Listings**
- ✅ Check Real-Debrid token: Valid and active?
- ✅ Verify torrents: Are they 100% downloaded?
- ✅ Check logs: `wrangler tail` for error details

### 🎥 **STRM Files Not Working**
- ✅ Test short URL: Click STRM content in HTML browser
- ✅ Check cache: URLs valid for 7 days only
- ✅ Verify file state: Must be "ok_file" status

### ⚡ **Performance Issues**
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
