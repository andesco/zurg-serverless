#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const localConfigPath = path.join(process.cwd(), 'wrangler.local.toml');
const hasLocalConfig = fs.existsSync(localConfigPath);

const args = process.argv.slice(2);
const command = args[0] || 'dev';

if (hasLocalConfig) {
  console.log('🔧 Using local configuration (wrangler.local.toml)');
  try {
    execSync(`wrangler ${command} --config wrangler.local.toml`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status);
  }
} else {
  console.log('⚠️  Local configuration not found');
  console.log('🎯 Options:');
  console.log('  1. Run: npm run setup-kv (for local development)');
  console.log('  2. Use: npm run dev-main (uses main config - requires real KV IDs)');
  console.log('  3. Use "Deploy to Cloudflare" button for automatic setup');
  console.log('');
  console.log('💡 Recommended: npm run setup-kv');
  process.exit(1);
}
