const fs = require('fs');
const path = require('path');

// Icon sizes needed for Android
const androidSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 }
];

// Icon sizes needed for iOS
const iosSizes = [
  { name: 'AppIcon-20@2x', size: 40 },
  { name: 'AppIcon-20@3x', size: 60 },
  { name: 'AppIcon-29@2x', size: 58 },
  { name: 'AppIcon-29@3x', size: 87 },
  { name: 'AppIcon-40@2x', size: 80 },
  { name: 'AppIcon-40@3x', size: 120 },
  { name: 'AppIcon-60@2x', size: 120 },
  { name: 'AppIcon-60@3x', size: 180 },
  { name: 'AppIcon-76@2x', size: 152 },
  { name: 'AppIcon-83.5@2x', size: 167 },
  { name: 'AppIcon-1024', size: 1024 }
];

// Read the SVG file
const svgContent = fs.readFileSync('./public/reader-favicon.svg', 'utf8');

// Create a function to generate PNG from SVG (simplified version)
function generateIcon(svgContent, size, outputPath) {
  // For now, we'll create a simple HTML file that can be used to generate PNGs
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; background: transparent; }
    svg { width: ${size}px; height: ${size}px; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath.replace('.png', '.html'), html);
  console.log(`Generated ${outputPath.replace('.png', '.html')} for ${size}x${size}px`);
}

// Generate Android icons
console.log('Generating Android icons...');
androidSizes.forEach(({ name, size }) => {
  const androidDir = `./android/app/src/main/res/${name}`;
  if (!fs.existsSync(androidDir)) {
    fs.mkdirSync(androidDir, { recursive: true });
  }
  
  generateIcon(svgContent, size, `${androidDir}/ic_launcher.png`);
  generateIcon(svgContent, size, `${androidDir}/ic_launcher_round.png`);
  generateIcon(svgContent, size, `${androidDir}/ic_launcher_foreground.png`);
});

// Generate iOS icons
console.log('Generating iOS icons...');
iosSizes.forEach(({ name, size }) => {
  const iosDir = './ios/App/App/Assets.xcassets/AppIcon.appiconset';
  generateIcon(svgContent, size, `${iosDir}/${name}.png`);
});

console.log('Icon generation complete!');
console.log('Note: You\'ll need to convert the HTML files to PNG using a tool like Puppeteer or an online converter.');
console.log('Or use a tool like ImageMagick: convert icon.html icon.png');
