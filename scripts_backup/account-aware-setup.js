#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎬 Zurg Serverless - Account-Aware KV Setup');
console.log('==========================================\n');

// Check if CLOUDFLARE_ACCOUNT_ID is set
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

if (!accountId) {
  console.log('🏢 Multiple Cloudflare accounts detected.');
  console.log('Please set your account ID first:\n');
  
  console.log('Available accounts:');
  console.log('- Andrew Escobar: 0a15c5f9d39350baa992ff9f48efc1c8');
  console.log('- Canadian Film in the Schools: 50067c54b56bc8d20441611cc6ecf105');
  console.log('- Co-operative Management Education Co-operative: d8c9cddc1b759d38ff165fadb3ea38b5');
  console.log('- Directors\' Forum Co-operative: 2e500a64ed3d1db63bfc5715ac09127a');
  console.log('- Ontario Co-operative Association: 5572b5f64774e08b03a09942eef81020');
  console.log('- Rob Duffy: 21a9a6f154c5b9cb3f62539af60d7dc3\n');
  
  console.log('🎯 Choose the account you want to use for this project and run:');
  console.log('   CLOUDFLARE_ACCOUNT_ID="your_account_id_here" npm run setup-kv');
  console.log('\n💡 For example:');
  console.log('   CLOUDFLARE_ACCOUNT_ID="0a15c5f9d39350baa992ff9f48efc1c8" npm run setup-kv');
  process.exit(1);
}

console.log(`🏢 Using account ID: ${accountId}`);
console.log('🔄 Proceeding with KV namespace creation...\n');

// Continue with the rest of the smart setup script...
