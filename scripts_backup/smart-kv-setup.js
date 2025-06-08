#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎬 Zurg Serverless - Smart KV Setup');
console.log('===================================\n');

const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
const backupPath = path.join(process.cwd(), 'wrangler.toml.backup');
const localConfigPath = path.join(process.cwd(), 'wrangler.local.toml');

// Check if wrangler is available
try {
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Wrangler CLI not found. Please install it first:');
  console.error('   npm install -g wrangler');
  process.exit(1);
}

// Check if user is logged in
try {
  execSync('wrangler whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Please log in to Cloudflare first:');
  console.error('   wrangler login');
  process.exit(1);
}

try {
  console.log('🔄 Temporarily moving wrangler.toml to avoid config conflicts...');
  
  // Backup the original config
  if (fs.existsSync(wranglerPath)) {
    fs.renameSync(wranglerPath, backupPath);
  }

  console.log('📦 Creating KV namespaces...');

  // Create production KV namespace
  console.log('Creating production KV namespace...');
  const prodOutput = execSync('wrangler kv namespace create "KV"', { encoding: 'utf8' });
  const prodMatch = prodOutput.match(/id = "([^"]+)"/);
  const prodId = prodMatch ? prodMatch[1] : null;

  // Create preview KV namespace
  console.log('Creating preview KV namespace...');
  const previewOutput = execSync('wrangler kv namespace create "KV" --preview', { encoding: 'utf8' });
  const previewMatch = previewOutput.match(/preview_id = "([^"]+)"/);
  const previewId = previewMatch ? previewMatch[1] : null;

  if (!prodId || !previewId) {
    throw new Error('Failed to extract namespace IDs from wrangler output');
  }

  console.log(`✅ Production KV namespace created: ${prodId}`);
  console.log(`✅ Preview KV namespace created: ${previewId}`);

  // Restore the original config
  console.log('🔄 Restoring original wrangler.toml...');
  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, wranglerPath);
  }

  // Create local config with real IDs
  console.log('📝 Creating wrangler.local.toml with real KV IDs...');
  
  const localConfig = `name = "zurg-serverless"
main = "src/worker.ts"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# Environment variables (non-sensitive)
[vars]
BASE_URL = ""
REFRESH_INTERVAL_SECONDS = "15"
API_TIMEOUT_SECONDS = "30"
TORRENTS_PAGE_SIZE = "1000"
HIDE_BROKEN_TORRENTS = "true"
RD_TOKEN = ""
STRM_TOKEN = ""

# KV Namespace with real IDs
[[kv_namespaces]]
binding = "KV"
id = "${prodId}"
preview_id = "${previewId}"

# Secrets are set via: wrangler secret put SECRET_NAME
`;

  fs.writeFileSync(localConfigPath, localConfig);
  console.log('✅ wrangler.local.toml created with real KV namespace IDs');

  console.log('\n🎉 KV setup complete!');
  console.log('\n📋 What was created:');
  console.log('✅ Production KV namespace');
  console.log('✅ Preview KV namespace');
  console.log('✅ wrangler.local.toml (gitignored, contains your KV IDs)');
  console.log('\n📝 Note: wrangler.toml unchanged - ready for Deploy button');
  console.log('\n🚀 Next steps:');
  console.log('1. Set environment variables: npm run setup-dev');
  console.log('2. Start development: npm run dev');

} catch (error) {
  // Restore the original config if something went wrong
  if (fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, wranglerPath);
    console.log('🔄 Restored original wrangler.toml');
  }
  
  console.error('❌ Error setting up KV namespaces:', error.message);
  console.error('\n🔧 Manual setup fallback:');
  console.error('1. Temporarily rename wrangler.toml');
  console.error('2. Run: wrangler kv namespace create "KV"');
  console.error('3. Run: wrangler kv namespace create "KV" --preview');
  console.error('4. Restore wrangler.toml');
  console.error('5. Create wrangler.local.toml with the IDs');
  process.exit(1);
}
