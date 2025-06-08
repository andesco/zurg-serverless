#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎬 Zurg Serverless - CLI Setup');
console.log('==============================\n');

// Check if CLOUDFLARE_ACCOUNT_ID is set
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!accountId) {
  console.log('🏢 Multiple Cloudflare accounts detected.');
  console.log('Please set your account ID first:\n');
  
  console.log('🎯 Run this command with your account ID:');
  console.log('   CLOUDFLARE_ACCOUNT_ID="your_account_id" npm run setup');
  console.log('\n💡 For example:');
  console.log('   CLOUDFLARE_ACCOUNT_ID="0a15c5f9d39350baa992ff9f48efc1c8" npm run setup');
  console.log('\n📋 Available accounts from your error message:');
  console.log('   - Andrew Escobar: 0a15c5f9d39350baa992ff9f48efc1c8');
  console.log('   - Canadian Film in the Schools: 50067c54b56bc8d20441611cc6ecf105');
  console.log('   - And others...');
  process.exit(1);
}

console.log(`🏢 Using account ID: ${accountId}`);

try {
  // Check if wrangler is available
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Wrangler CLI not found. Please install it first:');
  console.error('   npm install -g wrangler');
  process.exit(1);
}

try {
  console.log('📦 Creating KV namespaces...');

  // Generate unique suffix for this project instance
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const namespaceName = `zurg-serverless-cache-${randomSuffix}`;

  // Create production KV namespace
  console.log(`Creating production KV namespace: ${namespaceName}...`);
  const prodOutput = execSync(`wrangler kv namespace create "${namespaceName}"`, { 
    encoding: 'utf8',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId }
  });
  const prodMatch = prodOutput.match(/id = "([^"]+)"/);
  const prodId = prodMatch ? prodMatch[1] : null;

  // Create preview KV namespace
  console.log(`Creating preview KV namespace: ${namespaceName}-preview...`);
  const previewOutput = execSync(`wrangler kv namespace create "${namespaceName}" --preview`, { 
    encoding: 'utf8',
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId }
  });
  const previewMatch = previewOutput.match(/preview_id = "([^"]+)"/);
  const previewId = previewMatch ? previewMatch[1] : null;

  if (!prodId || !previewId) {
    throw new Error('Failed to extract namespace IDs from wrangler output');
  }

  console.log(`✅ Production KV namespace: ${prodId}`);
  console.log(`✅ Preview KV namespace: ${previewId}`);

  // Update wrangler.toml with real IDs
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  // Replace empty IDs with real ones
  wranglerContent = wranglerContent.replace(
    /(binding = "KV"\s*\n)id = ""\s*\npreview_id = ""/,
    `$1id = "${prodId}"\npreview_id = "${previewId}"`
  );

  fs.writeFileSync(wranglerPath, wranglerContent);
  console.log('✅ Updated wrangler.toml with KV namespace IDs');

  console.log('\n🎉 Setup complete!');
  console.log('\n🚀 Next steps:');
  console.log('1. Set your environment variables: npm run setup-dev');
  console.log('2. Start development: npm run dev');
  console.log('3. Deploy: npm run deploy');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.error('\n🔧 Manual steps:');
  console.error(`1. CLOUDFLARE_ACCOUNT_ID="${accountId}" wrangler kv namespace create "KV"`);
  console.error(`2. CLOUDFLARE_ACCOUNT_ID="${accountId}" wrangler kv namespace create "KV" --preview`);
  console.error('3. Update wrangler.toml with the returned IDs');
  process.exit(1);
}
