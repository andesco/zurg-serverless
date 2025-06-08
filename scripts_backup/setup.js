#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Zurg Serverless...');

// File paths
const wranglerTomlPath = path.join(__dirname, '..', 'wrangler.toml');
const schemaPath = path.join(__dirname, '..', 'schema.sql');

try {
  // Check if wrangler.toml exists
  if (!fs.existsSync(wranglerTomlPath)) {
    console.error('❌ wrangler.toml not found. Please copy from wrangler.toml.example first.');
    process.exit(1);
  }

  // Read current wrangler.toml
  let wranglerContent = fs.readFileSync(wranglerTomlPath, 'utf8');
  
  // Check if database_id is already set
  const dbIdMatch = wranglerContent.match(/database_id\s*=\s*"([^"]+)"/);
  if (dbIdMatch && dbIdMatch[1] && dbIdMatch[1] !== '') {
    console.log('✅ D1 database already configured in wrangler.toml');
    
    // Still initialize schema if needed
    if (fs.existsSync(schemaPath)) {
      console.log('🔧 Initializing database schema...');
      try {
        execSync('wrangler d1 execute zurg-serverless-db --file schema.sql --remote', { stdio: 'inherit' });
        console.log('✅ Database schema initialized');
      } catch (error) {
        console.log('ℹ️  Schema may already be initialized (this is normal)');
      }
    }
    
    console.log('🎉 Setup complete! Run "npm run deploy" to deploy your worker.');
    return;
  }

  console.log('🔧 Creating D1 database...');
  
  // Create D1 database and capture output
  const createOutput = execSync('wrangler d1 create zurg-serverless-db', { encoding: 'utf8' });
  console.log(createOutput);
  
  // Extract database ID from output
  const dbIdRegex = /database_id\s*=\s*"([^"]+)"/;
  const match = createOutput.match(dbIdRegex);
  
  if (!match || !match[1]) {
    console.error('❌ Failed to extract database ID from wrangler output');
    console.log('Please manually copy the database_id from the output above into your wrangler.toml');
    process.exit(1);
  }
  
  const databaseId = match[1];
  console.log(`✅ Database created with ID: ${databaseId}`);
  
  // Update wrangler.toml with the database ID
  const updatedContent = wranglerContent.replace(
    /database_id\s*=\s*"[^"]*"/,
    `database_id = "${databaseId}"`
  );
  
  fs.writeFileSync(wranglerTomlPath, updatedContent);
  console.log('✅ Updated wrangler.toml with database ID');
  
  // Initialize database schema
  if (fs.existsSync(schemaPath)) {
    console.log('🔧 Initializing database schema...');
    execSync('wrangler d1 execute zurg-serverless-db --file schema.sql --remote', { stdio: 'inherit' });
    console.log('✅ Database schema initialized');
  }
  
  console.log('🎉 Setup complete! Run "npm run deploy" to deploy your worker.');
  
} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('\nTroubleshooting:');
  console.log('1. Make sure you\'re logged in: wrangler login');
  console.log('2. Make sure you copied wrangler.toml.example to wrangler.toml');
  console.log('3. Make sure you have the correct permissions in your Cloudflare account');
  process.exit(1);
}
