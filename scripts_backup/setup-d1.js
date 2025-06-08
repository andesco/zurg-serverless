#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const DATABASE_NAME = 'zurg-serverless-db';

async function main() {
  console.log('🚀 Setting up Zurg Serverless with D1 Database...\n');
  
  try {
    console.log('🗄️ Creating D1 database...');
    const child = spawn('wrangler', ['d1', 'create', DATABASE_NAME], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Database created successfully');
        console.log('\nNext steps:');
        console.log('1. Update database_id in wrangler.toml with the ID shown above');
        console.log('2. Run: wrangler d1 execute zurg-serverless-db --file schema.sql');
        console.log('3. Set your RD token: wrangler secret put RD_TOKEN');
        console.log('4. Deploy: npm run deploy');
      } else {
        console.error('❌ Database creation failed');
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}