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

// Check if user is logged in
try {
  execSync('wrangler whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Please log in to Cloudflare first:');
  console.error('   wrangler login');
  process.exit(1);
}

console.log('📦 Creating KV namespaces...');

try {
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

  // Create local wrangler config (not committed to git)
  const wranglerPath = path.join(process.cwd(), 'wrangler.toml');
  const localWranglerPath = path.join(process.cwd(), 'wrangler.local.toml');
  
  if (!fs.existsSync(wranglerPath)) {
    console.error('❌ wrangler.toml not found in current directory');
    process.exit(1);
  }

  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
  
  // Replace the empty id and preview_id values with actual IDs
  const kvPattern = /(binding = "KV"\s*\n)id = ""\s*\npreview_id = ""/;
  wranglerContent = wranglerContent.replace(
    kvPattern,
    `$1id = "${prodId}"\npreview_id = "${previewId}"`
  );

  // Verify the replacement worked
  if (!wranglerContent.includes(prodId)) {
    console.error('❌ Failed to update configuration with KV namespace IDs');
    console.error('Please manually create wrangler.local.toml with:');
    console.error(`id = "${prodId}"`);
    console.error(`preview_id = "${previewId}"`);
    process.exit(1);
  }

  // Write to LOCAL config file (gitignored)
  fs.writeFileSync(localWranglerPath, wranglerContent);
  console.log('✅ wrangler.local.toml created with KV namespace IDs');
  console.log('📝 Note: wrangler.toml remains unchanged (ready for Deploy button)');

  console.log('\n🎉 KV setup complete!');
  console.log('\n📋 What was created:');
  console.log('✅ Production KV namespace');
  console.log('✅ Preview KV namespace');
  console.log('✅ wrangler.local.toml (gitignored, contains your KV IDs)');
  console.log('\n📝 Note: wrangler.toml unchanged - ready for Deploy button');
  console.log('\n🚀 Next steps:');
  console.log('1. Set environment variables: npm run setup-dev');
  console.log('2. Start development: npm run dev');
  console.log('3. Deploy manually: npm run deploy');

} catch (error) {
  console.error('❌ Error setting up KV namespaces:', error.message);
  console.error('\n🔧 Manual setup fallback:');
  console.error('   wrangler kv namespace create "KV"');
  console.error('   wrangler kv namespace create "KV" --preview');
  console.error('   Then manually update the IDs in wrangler.local.toml');
  process.exit(1);
}
