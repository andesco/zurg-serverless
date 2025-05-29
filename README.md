# Zurg Serverless

A modern, serverless Real Debrid WebDAV server with modern HTML browser (work in progress) and .STRM file-based streaming, running as a Cloudflare Worker.

## Features

### 🎯 **Dual Interface**
- **HTML browser**: [shadcn/ui](https://github.com/shadcn-ui/ui) interface for browsing a media library
- **WebDAV endpoints**: WebDAV enpoint for use with media players, with specific support for Infuse

### ⚡ **Smart .STRM Streaming System**
- **.STRM files only**
  - each `.strm` file contains a short link: `/strm/ABCD1234WXYZ5678`)
  - short link remains consistent but redirect to up-to-date download links
  - download links are created or updated on-demand
  - download links are maintained in a D1 database
  - 7-Day caching of download links to reduce API calls
  
### 🌐 **Serverless Architecture**
- **Cloudflare Worker** serverless function
- **Cloudflare D1** database

## 🚀 Quick Setup

### Prerequisites
- Node.js v20+ (required for wrangler)
- Cloudflare account

### First Deployments:

```zsh
git clone https://github.com/andesco/zurg-serverless
cd zurg-serverless
npm install
wrangler login
```

**Option 1: Automatic Setup (Recommended)**
```zsh
npm run dev
```
- detect your Cloudflare account
- create required D1 database, initialize database schema:
  ```wrangler d1 create zurg-serverless-db```
  ```wrangler d1 execute zurg-serverless-db --file schema.sql```
- update configuration
- start dev server

**Option 2: Manual Approach**

```zsh
wrangler dev
```

This manual approach (work in progress) has further instructions.

### Production Deployment:

```zsh
npm run deploy
wrangler secret put RD_TOKEN
```




---


</details>



## Usage

**HTML Browser**:
```https://worker.user.workers.dev/```

**WebDAV standard**:
```https://worker.user.workers.dev/dav```

**Infuse:**
```https://worker.user.workers.dev/infuse```


## ⚙️ Configuration


### 🔐 Environment Variables

You can save these as plaintext environment variables in the Cloudflare Worker’s Settings, or use:

```wrangler secret put RD_TOKEN```

| Secret | Required | Description |
|--------|----------|-------------|
| `RD_TOKEN` | yes | Real-Debrid API token |
| `STRM_TOKEN` |   | optional secondary token for STRM files |


| Variable | Default | Description |
|----------|---------|-------------|
| `REFRESH_INTERVAL_SECONDS` | `15` | How often to sync torrents |
| `TORRENTS_PAGE_SIZE` | `1000` | Torrents per Real-Debrid API call |
| `API_TIMEOUT_SECONDS` | `30` | Request timeout for Real-Debrid API |
| `HIDE_BROKEN_TORRENTS` | `true` | Hide incomplete torrents |

## LLM  discovery

### **WebDAV**
- `PROPFIND /dav/` standard WebDAV (includes root directory)
- `GET /dav/{path}` download STRM files
- `OPTIONS /dav/` WebDAV capabilities

### **Streaming**
- `GET /strm/{16-char-code}` streaming URLs (redirect to Real Debrid cache)

### **Status**
- `GET /` - Worker status and quick access links



## 📁 Project Structure

```
src/
├── worker.ts           # 🚀 Main Cloudflare Worker entry point
├── types.ts            # 📝 TypeScript interfaces
├── realdebrid.ts       # 🔗 Real Debrid API client
├── storage.ts          # 💾 D1 storage operations
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
- **Intelligent Caching** - 7-day STRM codes
- **Exponential Backoff** - Automatic retry with rate limit respect
- **Batched Operations** - Efficient D1 usage patterns

## 🐛 Troubleshooting

#### RD_TOKEN is undefined

```zsh
wrangler secret list
wrangler secret put RD_TOKEN
```

#### Invalid configuration
- check `wrangler.toml` has valid D1 namespace IDs (not placeholder text)
- ensure sensitive data uses `wrangler secret put`, not `[vars]`
- verify `binding = "D1"` matches code expectations

### **Empty Directory Listings**
- check Real-Debrid token: valid and active?
- check logs: `wrangler tail` for error details

