#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// File paths
const devVarsPath = path.join(__dirname, '..', '.dev.vars');
const wranglerTomlPath = path.join(__dirname, '..', 'wrangler.toml');

/**
 * Parse .dev.vars file into key-value pairs
 */
function parseDevVars() {
  if (!fs.existsSync(devVarsPath)) {
    console.log('⚠️  .dev.vars file not found');
    return {};
  }

  const content = fs.readFileSync(devVarsPath, 'utf8');
  const vars = {};
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        // Remove surrounding quotes if present
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        vars[key.trim()] = value;
      }
    }
  }
  
  return vars;
}

/**
 * Update wrangler.toml [vars] section with values from .dev.vars
 */
function updateWranglerVars() {
  console.log('🔧 Updating wrangler.toml with .dev.vars values...');
  
  const vars = parseDevVars();
  
  if (!fs.existsSync(wranglerTomlPath)) {
    console.error('❌ wrangler.toml not found');
    return;
  }

  let wranglerContent = fs.readFileSync(wranglerTomlPath, 'utf8');
  
  // Variables that should be updated from .dev.vars
  const varKeys = ['BASE_URL', 'REFRESH_INTERVAL_SECONDS', 'API_TIMEOUT_SECONDS', 
                   'TORRENTS_PAGE_SIZE', 'HIDE_BROKEN_TORRENTS', 'RD_TOKEN', 
                   'STRM_TOKEN', 'USERNAME', 'PASSWORD'];
  
  // Update each variable if it exists in .dev.vars
  for (const key of varKeys) {
    if (vars[key] !== undefined) {
      const pattern = new RegExp(`^(${key}\\s*=\\s*)"[^"]*"`, 'm');
      const replacement = `$1"${vars[key]}"`;
      
      if (pattern.test(wranglerContent)) {
        wranglerContent = wranglerContent.replace(pattern, replacement);
        console.log(`✅ Updated ${key} from .dev.vars`);
      }
    }
  }
  
  fs.writeFileSync(wranglerTomlPath, wranglerContent);
  console.log('🚀 wrangler.toml updated for deployment');
}

// Main execution
if (require.main === module) {
  updateWranglerVars();
}

module.exports = {
  updateWranglerVars,
  parseDevVars
};
