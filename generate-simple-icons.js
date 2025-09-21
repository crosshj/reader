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

// Remove any existing splash screens and create empty splash drawable
console.log('🗑️  Removing splash screens...');
try {
    execSync('find android/app/src/main/res -name "splash*" -delete', { stdio: 'pipe' });
    console.log('✅ Removed splash screen files');
} catch (error) {
    console.log('⚠️  Some splash screen cleanup failed (this is usually fine)');
}

// Create empty splash drawable to prevent errors
console.log('📄 Creating empty splash drawable...');
const splashDrawableContent = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@android:color/white" />
</shape>`;

const splashDrawablePath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'drawable', 'splash.xml');
fs.writeFileSync(splashDrawablePath, splashDrawableContent);
console.log('✅ Created empty splash drawable');

// Fix styles.xml to remove splash screen theme
console.log('🎨 Fixing Android styles.xml...');
const stylesPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'styles.xml');
if (fs.existsSync(stylesPath)) {
    let stylesContent = fs.readFileSync(stylesPath, 'utf8');
    // Replace Theme.SplashScreen with Theme.AppCompat.DayNight.NoActionBar
    stylesContent = stylesContent.replace(/parent="Theme\.SplashScreen"/g, 'parent="Theme.AppCompat.DayNight.NoActionBar"');
    // Replace splash drawable with transparent background
    stylesContent = stylesContent.replace(/android:background">@drawable\/splash/g, 'android:background">@android:color/transparent');
    fs.writeFileSync(stylesPath, stylesContent);
    console.log('✅ Fixed styles.xml to remove splash screen theme');
}

// Clean up any adaptive icon references
console.log('🧹 Cleaning up adaptive icon references...');
try {
    // Remove adaptive icon directories and files
    execSync('rm -rf android/app/src/main/res/mipmap-anydpi-v26', { stdio: 'pipe' });
    execSync('find android/app/src/main/res -name "*_foreground.png" -delete', { stdio: 'pipe' });
    execSync('find android/app/src/main/res -name "*_background.png" -delete', { stdio: 'pipe' });
    execSync('find android/app/src/main/res -name "*_round.png" -delete', { stdio: 'pipe' });
    console.log('✅ Cleaned up adaptive icon files');
} catch (error) {
    console.log('⚠️  Some cleanup operations failed (this is usually fine)');
}

console.log('✅ Simple icon generation complete!');
console.log('📝 App icons generated without adaptive/round variants. Splash screens disabled.');
