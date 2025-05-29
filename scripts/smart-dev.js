#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎬 Zurg Serverless - Smart Dev (D1)');
console.log('====================================\n');

const wranglerPath = path.join(process.cwd(), 'wrangler.toml');

// Check if D1 database is already configured
const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
const hasD1Section = wranglerContent.includes('[[d1_databases]]') && !wranglerContent.includes('# [[d1_databases]]');
const hasRealDbId = wranglerContent.match(/database_id = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}"/);

if (hasD1Section && hasRealDbId) {
  console.log('✅ D1 database already configured, starting dev server...');
  try {
    execSync('wrangler dev', { stdio: 'inherit' });
  } catch (error) {
    process.exit(error.status);
  }
  return;
}

console.log('🔧 D1 database not configured, setting up automatically...');

try {
  // Check if wrangler is available
  execSync('wrangler --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Wrangler CLI not found. Please install it first:');
  console.error('   npm install -g wrangler');
  process.exit(1);
}

try {
  // Check if user is logged in
  execSync('wrangler whoami', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Please log in to Cloudflare first:');
  console.error('   wrangler login');
  process.exit(1);
}

try {
  console.log('🗄️ Creating D1 database...');
  
  const databaseName = 'zurg-serverless-db';
  const output = execSync(`wrangler d1 create ${databaseName}`, { encoding: 'utf8' });
  
  // Extract database ID from output
  const dbMatch = output.match(/database_id = "([^"]+)"/);
  const databaseId = dbMatch ? dbMatch[1] : null;

  if (!databaseId) {
    throw new Error('Failed to extract database ID from wrangler output');
  }

  console.log(`✅ D1 database created: ${databaseId}`);
  
  // Uncomment and update D1 section in wrangler.toml
  let updatedContent = wranglerContent
    .replace('# [[d1_databases]]', '[[d1_databases]]')
    .replace('# binding = "DB"', 'binding = "DB"')
    .replace('# database_name = "zurg-serverless-db"', 'database_name = "zurg-serverless-db"')
    .replace('# database_id = "auto-created-on-first-run"', `database_id = "${databaseId}"`);
  
  fs.writeFileSync(wranglerPath, updatedContent);
  
  console.log('✅ Updated wrangler.toml with database ID');
  // Initialize schema
  const schemaPath = path.join(process.cwd(), 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    console.log('📋 Initializing database schema...');
    execSync(`wrangler d1 execute ${databaseName} --file schema.sql`, { stdio: 'inherit' });
    console.log('✅ Database schema initialized');
  } else {
    console.log('⚠️ schema.sql not found, skipping schema initialization');
  }
  
  console.log('🚀 Starting dev server...\n');

  // Now start the dev server
  execSync('wrangler dev', { stdio: 'inherit' });

} catch (error) {
  if (error.message && error.message.includes('More than one account available')) {
    console.error('❌ Multiple Cloudflare accounts detected.');
    console.error('Please specify which account to use:');
    console.error('');
    
    // Extract account info from error message
    const accountMatches = error.message.match(/`([^`]+)`: `([^`]+)`/g);
    if (accountMatches) {
      console.error('Available accounts:');
      accountMatches.forEach(match => {
        const [, name, id] = match.match(/`([^`]+)`: `([^`]+)`/);
        console.error(`  - ${name}: ${id}`);
      });
      console.error('');
      console.error('🎯 Set your account ID and try again:');
      console.error('   CLOUDFLARE_ACCOUNT_ID="your_account_id" npm run dev');
    }
  } else {
    console.error('❌ Setup failed:', error.message);
    console.error('');
    console.error('🔧 Manual setup:');
    console.error('1. wrangler login');
    console.error('2. wrangler d1 create zurg-serverless-db');
    console.error('3. Update database_id in wrangler.toml');
    console.error('4. wrangler d1 execute zurg-serverless-db --file schema.sql');
    console.error('5. npm run dev');
  }
  process.exit(1);
}