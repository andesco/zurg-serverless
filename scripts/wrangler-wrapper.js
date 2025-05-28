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
} else if (command === 'deploy') {
  console.log('🚀 Deployment: Using main configuration for automatic KV provisioning');
  try {
    execSync(`wrangler ${command}`, { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status);
  }
} else {
  console.log('⚠️  Local configuration not found');
  console.log('🎯 For local development:');
  console.log('  Run: npm run setup-kv');
  console.log('');
  console.log('🎯 For deployment:');
  console.log('  Use: npm run deploy-main');
  console.log('  Or: "Deploy to Cloudflare" button');
  console.log('');
  console.log('💡 Recommended for development: npm run setup-kv');
  process.exit(1);
}
