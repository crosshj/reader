#!/usr/bin/env node

/**
 * Build all plugins in the plugins directory
 * This script will find all plugin directories and build them
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PLUGINS_DIR = path.dirname(new URL(import.meta.url).pathname);
const ROOT_DIR = path.dirname(PLUGINS_DIR);

console.log('🔧 Building all plugins...');
console.log('📁 Plugins directory:', PLUGINS_DIR);

// Find all plugin directories
const pluginDirs = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name)
  .filter(name => !name.startsWith('.')); // Skip hidden directories

if (pluginDirs.length === 0) {
  console.log('ℹ️  No plugins found to build');
  process.exit(0);
}

console.log(`📦 Found ${pluginDirs.length} plugin(s):`, pluginDirs.join(', '));

let successCount = 0;
let errorCount = 0;

// Build each plugin
for (const pluginDir of pluginDirs) {
  const pluginPath = path.join(PLUGINS_DIR, pluginDir);
  const packageJsonPath = path.join(pluginPath, 'package.json');
  
  // Check if it's a valid plugin (has package.json)
  if (!fs.existsSync(packageJsonPath)) {
    console.log(`⚠️  Skipping ${pluginDir}: No package.json found`);
    continue;
  }
  
  console.log(`\n🔨 Building ${pluginDir}...`);
  
  try {
    // Change to plugin directory and build
    process.chdir(pluginPath);
    
    // Install dependencies if node_modules doesn't exist
    if (!fs.existsSync('node_modules')) {
      console.log(`📥 Installing dependencies for ${pluginDir}...`);
      execSync('npm ci', { stdio: 'inherit' });
    }
    
    // Build the plugin
    console.log(`🔨 Building ${pluginDir}...`);
    execSync('npm run build', { stdio: 'inherit' });
    
    console.log(`✅ Successfully built ${pluginDir}`);
    successCount++;
    
  } catch (error) {
    console.error(`❌ Failed to build ${pluginDir}:`, error.message);
    errorCount++;
  } finally {
    // Return to root directory
    process.chdir(ROOT_DIR);
  }
}

// Summary
console.log('\n📊 Build Summary:');
console.log(`✅ Successful: ${successCount}`);
console.log(`❌ Failed: ${errorCount}`);

if (errorCount > 0) {
  console.log('\n💥 Some plugins failed to build. Check the errors above.');
  process.exit(1);
} else {
  console.log('\n🎉 All plugins built successfully!');
  process.exit(0);
}
