#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Generating simple icons from assets/icon.png...');

// Check if assets/icon.png exists
const iconPath = path.join(__dirname, 'assets', 'icon.png');
if (!fs.existsSync(iconPath)) {
    console.error('❌ assets/icon.png not found!');
    process.exit(1);
}

// Android icon sizes for different densities
const androidSizes = {
    'ldpi': 36,
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192
};

// Create Android icons
console.log('📱 Generating Android icons...');
for (const [density, size] of Object.entries(androidSizes)) {
    const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', `mipmap-${density}`);
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'ic_launcher.png');
    
    try {
        // Use ImageMagick to resize the icon
        execSync(`convert "${iconPath}" -resize ${size}x${size} "${outputPath}"`, { stdio: 'pipe' });
        console.log(`✅ Created ${outputPath} (${size}x${size})`);
    } catch (error) {
        console.error(`❌ Failed to create ${outputPath}:`, error.message);
    }
}

console.log('✅ Simple icon generation complete!');
console.log('📝 Note: Run "npm run generate:assets" for splash screens and other assets.');
