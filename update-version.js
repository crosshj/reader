const fs = require('fs');
const path = require('path');

// Read the current build.gradle file
const buildGradlePath = './android/app/build.gradle';
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// Extract current version code
const versionCodeMatch = buildGradle.match(/versionCode\s+(\d+)/);
const currentVersionCode = versionCodeMatch ? parseInt(versionCodeMatch[1]) : 1;

// Increment version code
const newVersionCode = currentVersionCode + 1;

// Update the version code in build.gradle
buildGradle = buildGradle.replace(
  /versionCode\s+\d+/,
  `versionCode ${newVersionCode}`
);

// Write the updated build.gradle
fs.writeFileSync(buildGradlePath, buildGradle);

console.log(`Updated version code from ${currentVersionCode} to ${newVersionCode}`);
