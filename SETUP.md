# Setup Guide

## 1. Get Real-Debrid API Token

1. Go to [Real-Debrid API page](https://real-debrid.com/apitoken)
2. Log in with your Real-Debrid account
3. Copy the API token

## 2. Deploy to Cloudflare

### Option A: One-Click Deploy (Recommended)

1. Click the "Deploy to Cloudflare Workers" button in README
2. Sign in to your Cloudflare account
3. Follow the deployment wizard

### Option B: Manual Deploy

1. **Clone repository**:
```bash
git clone https://github.com/your-username/zurg-serverless
cd zurg-serverless
npm install
```

2. **Login to Cloudflare**:
```bash
npx wrangler login
```

3. **Create KV namespace**:
```bash
npx wrangler kv:namespace create "KV"
npx wrangler kv:namespace create "KV" --preview
```

4. **Update wrangler.toml** with the namespace IDs returned

5. **Set secrets**:
```bash
npx wrangler secret put RD_TOKEN
# Enter your Real-Debrid token when prompted

# Optional but recommended:
npx wrangler secret put RD_UNRESTRICT_IP
# Enter your dedicated IP address
```

6. **Deploy**:
```bash
npm run deploy
```

## 3. Get Dedicated IP (Recommended)

### Why You Need This
Real-Debrid bans accounts if different IP addresses unrestrict links simultaneously. Cloudflare Workers use dynamic IPs, which can trigger this protection.

### Solutions

#### Option A: Cloudflare Reserved IP
- Contact Cloudflare support for a reserved IP
- Configure in Workers settings

#### Option B: Proxy Server
Set up a simple proxy on a VPS:

```bash
# On your VPS (replace with your worker URL)
npm install -g http-proxy-cli
http-proxy-cli --port 8080 --target https://your-worker.workers.dev
```

Set `RD_UNRESTRICT_IP` to your VPS IP address.

#### Option C: Single User Only
If you're the only user, you can skip this step. Monitor for account suspensions.

## 4. Configure Infuse

1. **Open Infuse** on your device
2. **Add Network Share**:
   - Protocol: WebDAV
   - Address: `your-worker.workers.dev`
   - Path: `/infuse/`
   - Username/Password: (leave blank unless configured)
3. **Save and Browse**

## 5. Test Setup

1. **Visit your worker URL** in a browser
2. **Check WebDAV endpoints**:
   - `https://your-worker.workers.dev/dav/`
   - `https://your-worker.workers.dev/infuse/`
3. **Monitor logs**: `npx wrangler tail`

## Troubleshooting

### Empty Directory Listings
- Verify RD_TOKEN is correct
- Check that torrents are 100% downloaded in Real-Debrid
- Ensure KV namespace is properly configured

### "Account Suspended" Errors
- Set RD_UNRESTRICT_IP immediately
- Wait 24 hours for suspension to lift
- Contact Real-Debrid support if needed

### Slow Performance
- Increase TORRENTS_PAGE_SIZE for large libraries
- Reduce REFRESH_INTERVAL_SECONDS if needed
- Check Cloudflare KV quotas

### Worker Errors
- Check `npx wrangler tail` for logs
- Verify all secrets are set correctly
- Test locally with `npm run dev`
