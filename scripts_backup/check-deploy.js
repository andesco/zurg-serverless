#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Zurg Serverless - Deployment Check');
console.log('=====================================\n');

const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
const localWranglerPath = path.join(process.cwd(), 'wrangler.local.toml');

if (!fs.existsSync(wranglerPath)) {
  console.error('❌ wrangler.toml not found');
  process.exit(1);
}

const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
const hasLocalConfig = fs.existsSync(localWranglerPath);

// Check main config
const hasKvBinding = wranglerContent.includes('binding = "KV"');
const hasEmptyIds = wranglerContent.match(/id = ""\s/) && wranglerContent.match(/preview_id = ""\s/);

console.log('📋 Configuration Status:');
console.log(`✅ Main config (wrangler.toml): ${hasKvBinding ? 'CONFIGURED' : 'MISSING'}`);
console.log(`📝 Empty KV IDs (Deploy button ready): ${hasEmptyIds ? 'YES' : 'NO'}`);
console.log(`🔧 Local config (wrangler.local.toml): ${hasLocalConfig ? 'EXISTS' : 'MISSING'}`);

console.log('\n🎯 Deployment Options:');

if (hasEmptyIds) {
  console.log('✅ Option 1: "Deploy to Cloudflare" button');
  console.log('   → Uses automatic KV provisioning');
  console.log('   → No local setup required');
}

if (hasLocalConfig) {
  console.log('✅ Option 2: Manual deployment');
  console.log('   → Use: npm run deploy');
  console.log('   → Uses wrangler.local.toml (with real KV IDs)');
} else {
  console.log('⚠️  Option 2: Manual deployment');
  console.log('   → Run: npm run setup-kv first');
  console.log('   → Then: npm run deploy');
}

console.log('\n💡 Benefits of this approach:');
console.log('✅ wrangler.toml stays clean (no account-specific IDs committed)');
console.log('✅ Deploy button works out of the box');
console.log('✅ Local development isolated from public repo');

if (!hasLocalConfig) {
  console.log('\n🔧 To set up local development:');
  console.log('   npm run setup-kv');
}

console.log('\n✅ Deployment check complete!');

