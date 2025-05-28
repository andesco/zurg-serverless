#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎬 Zurg Serverless - KV Namespace Setup');
console.log('=====================================\n');

// Check if wrangler is available
try {
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Wrangler CLI not found. Please install it first:');
  console.error('   npm install -g wrangler');
  console.error('   OR install locally: npm install wrangler --save-dev');
  process.exit(1);
}

console.log('📦 Creating KV namespaces...');

try {
  // Create production KV namespace
  console.log('Creating production KV namespace...');
  const prodOutput = execSync('wrangler kv:namespace create "KV"', { encoding: 'utf8' });
  const prodMatch = prodOutput.match(/id = "([^"]+)"/);
  const prodId = prodMatch ? prodMatch[1] : null;

  // Create preview KV namespace
  console.log('Creating preview KV namespace...');
  const previewOutput = execSync('wrangler kv:namespace create "KV" --preview', { encoding: 'utf8' });
  const previewMatch = previewOutput.match(/preview_id = "([^"]+)"/);
  const previewId = previewMatch ? previewMatch[1] : null;

  if (!prodId || !previewId) {
    throw new Error('Failed to extract namespace IDs from wrangler output');
  }

  console.log(`✅ Production KV namespace created: ${prodId}`);
  console.log(`✅ Preview KV namespace created: ${previewId}`);

  // Update wrangler.toml
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ wrangler.toml not found in current directory');
    process.exit(1);
  }

  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  // Replace the empty id and preview_id values
  wranglerContent = wranglerContent.replace(
    /(\[\[kv_namespaces\]\]\s*binding = "KV"\s*)id = ""\s*preview_id = ""/,
    `$1id = "${prodId}"\npreview_id = "${previewId}"`
  );

  fs.writeFileSync(wranglerPath, wranglerContent);
  console.log('✅ wrangler.toml updated with KV namespace IDs');

  console.log('\n🎉 KV setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Set your environment variables in Cloudflare dashboard');
  console.log('2. Deploy with: npm run deploy');
  console.log('3. Your Zurg Serverless instance will be ready!');

} catch (error) {
  console.error('❌ Error setting up KV namespaces:', error.message);
  console.error('\n🔧 Manual setup fallback:');
  console.error('   wrangler kv:namespace create "KV"');
  console.error('   wrangler kv:namespace create "KV" --preview');
  console.error('   Then manually update the IDs in wrangler.toml');
  process.exit(1);
}
