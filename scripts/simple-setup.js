#!/usr/bin/env node

console.log('🎬 Zurg Serverless - Simple KV Setup');
console.log('===================================\n');

console.log('Please run these commands manually to avoid config conflicts:\n');

console.log('1️⃣ Create KV namespaces:');
console.log('   wrangler kv namespace create "KV"');
console.log('   wrangler kv namespace create "KV" --preview\n');

console.log('2️⃣ Copy the IDs from the output above\n');

console.log('3️⃣ Create wrangler.local.toml with this content:');
console.log('---');
console.log(`name = "zurg-serverless"
main = "src/worker.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

[vars]
BASE_URL = ""
REFRESH_INTERVAL_SECONDS = "15"
API_TIMEOUT_SECONDS = "30"
TORRENTS_PAGE_SIZE = "1000"
HIDE_BROKEN_TORRENTS = "true"
RD_TOKEN = ""
STRM_TOKEN = ""

[[kv_namespaces]]
binding = "KV"
id = "YOUR_PRODUCTION_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"`);
console.log('---\n');

console.log('4️⃣ Replace YOUR_PRODUCTION_ID_HERE and YOUR_PREVIEW_ID_HERE with actual IDs\n');

console.log('5️⃣ Then run:');
console.log('   npm run dev\n');

console.log('💡 This avoids config reading conflicts during setup');
