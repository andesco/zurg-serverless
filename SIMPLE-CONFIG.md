# Simple Configuration

This project now uses a straightforward approach with just `wrangler.toml`.

## Setup

1. **Copy the template:**
   ```bash
   cp wrangler.toml.example wrangler.toml
   ```

2. **Edit `wrangler.toml` with your actual values:**
   ```toml
   RD_TOKEN = "your_real_debrid_token_here"
   USERNAME = "your_username"
   PASSWORD = "your_password"
   database_id = "your_database_id_here"
   ```

## Usage

- **Development:** `npm run dev`
- **Deployment:** `npm run deploy`

## Security Note

⚠️ **`wrangler.toml` is in `.gitignore` to prevent accidental token leaks!**

Always double-check before committing:
```bash
git status  # Make sure wrangler.toml is not listed
```

## Authentication URLs

When `USERNAME` and `PASSWORD` are set:
- **WebDAV Standard:** `https://username:password@your-worker.workers.dev/dav`
- **WebDAV for Infuse:** `https://username:password@your-worker.workers.dev/infuse`
- **HTML Browser:** `https://username:password@your-worker.workers.dev/html`
