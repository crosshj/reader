# Reader App

[![Build Android APK](https://github.com/crosshj/reader/actions/workflows/build-android.yml/badge.svg)](https://github.com/crosshj/reader/actions/workflows/build-android.yml)

A basic Capacitor app for cross-platform mobile development with automated Android APK builds.

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- For iOS development: Xcode (macOS only)
- For Android development: Android Studio

### Development

1. **Web Development**
   ```bash
   npm run dev
   ```
   Open `www/index.html` in your web browser to test the app.

2. **Sync Changes**
   ```bash
   npm run sync
   ```
   This copies your web assets to the native platforms.

3. **Run on iOS** (macOS only)
   ```bash
   npm run open:ios
   # or
   npm run run:ios
   ```

4. **Run on Android**
   ```bash
   npm run open:android
   # or
   npm run run:android
   ```

## Project Structure

```
reader/
├── www/                    # Web assets (HTML, CSS, JS)
│   ├── index.html         # Main app page
│   ├── style.css          # App styling
│   └── app.js             # App logic
├── android/               # Android native project
├── ios/                   # iOS native project
├── .github/workflows/     # GitHub Actions
├── capacitor.config.json  # Capacitor configuration
└── package.json          # Dependencies and scripts
```

## Features

- Basic HTML/CSS/JS structure
- Capacitor platform detection
- Cross-platform mobile support
- Modern, responsive UI

## 🤖 Automated Builds

This project includes GitHub Actions for automated Android APK builds:

### Automatic Builds
- **On every push** to `main` or `alpha` branches
- **On pull requests** to `main` branch
- **Manual trigger** via GitHub Actions tab

### Download APK
1. Go to the [Actions tab](https://github.com/crosshj/reader/actions) in your repository
2. Click on the latest successful workflow run
3. Download the APK from the "Artifacts" section
4. Install on your Android device

### Manual Build Trigger
1. Go to Actions → "Build Android APK"
2. Click "Run workflow"
3. Select branch and click "Run workflow"

## 📱 Local Development

### Web Development
```bash
# Open www/index.html in your web browser to test the app
open www/index.html
# or
npm run dev
```

### Android Development
```bash
# Sync changes
npm run sync

# Build APK locally (requires Android SDK)
npm run build:android

# Open in Android Studio
npm run open:android
```

## Next Steps

- Add more Capacitor plugins as needed
- Implement your app's specific functionality
- Customize the UI and styling
- Add native device features
- Set up code signing for production releases

