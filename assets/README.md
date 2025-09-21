# App Assets

This directory contains the source assets for generating app icons and splash screens.

## Structure

```
assets/
├── icon.png              # Main app icon (1024x1024 recommended)
├── logo.png              # Logo (fallback to icon.png if not found)
├── logo-dark.png         # Dark mode logo
├── icon-foreground.png   # Android adaptive icon foreground
├── icon-background.png   # Android adaptive icon background
├── splash.png            # Splash screen
├── splash-dark.png       # Dark mode splash screen
├── ios/
│   ├── icon.png          # iOS-specific icon
│   ├── splash.png        # iOS-specific splash
│   └── splash-dark.png   # iOS-specific dark splash
├── android/
│   ├── icon.png          # Android-specific icon
│   ├── icon-foreground.png # Android-specific foreground
│   ├── icon-background.png # Android-specific background
│   ├── splash.png        # Android-specific splash
│   ├── splash-dark.png   # Android-specific dark splash
│   └── notification.png  # Android notification icon
└── README.md             # This file
```

## Usage

### Basic Usage (Simple Icons Only)

1. Replace `assets/icon.png` with your new icon (1024x1024 PNG recommended)
2. Run the simple icon generation:
   ```bash
   npm run generate:simple-icons
   ```

### Simple Icons Only (No Adaptive/Round Icons)

If you want only simple icons without adaptive or round variants:

1. Replace `assets/icon.png` with your new icon (1024x1024 PNG recommended)
2. Run the simple icon generation:
   ```bash
   npm run generate:simple-icons
   ```
   This will generate:
   - Simple Android icons (no adaptive/round variants)
   - Remove splash screens (app starts directly)
   - Clean up any adaptive icon references

3. For iOS and PWA assets, you can manually run:
   ```bash
   npx @capacitor/assets generate
   ```
   (Note: This will create adaptive icons and splash screens that you'll need to clean up)

### Advanced Usage (Custom Assets)

You can provide specific assets for different platforms and use cases:

- **`icon.png`** - Main app icon (used for everything if other files don't exist)
- **`logo.png`** - Logo (fallback to icon.png if not found)
- **`splash.png`** - Splash screen (fallback to icon.png if not found)
- **`icon-foreground.png`** - Android adaptive icon foreground
- **`icon-background.png`** - Android adaptive icon background
- **`splash-dark.png`** - Dark mode splash screen
- **`logo-dark.png`** - Dark mode logo

### Platform-Specific Assets

- **`ios/`** - iOS-specific assets (overrides global assets)
- **`android/`** - Android-specific assets (overrides global assets)

### Supported Formats

- PNG (recommended)
- WebP
- JPG/JPEG
- SVG

### What Gets Generated

- **Android**: Icons for all density levels (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- **iOS**: App Store icon and splash screens
- **PWA**: Web app icons and Apple splash screens
- **Dark Mode**: Automatic dark mode variants for splash screens

### Requirements

- Source image should be 1024x1024 pixels or larger
- PNG format with transparency
- Square aspect ratio works best
- The tool will automatically resize and optimize for each platform

## Tools Used

- **Custom script** (`generate-simple-icons.js`) - Generates simple Android icons only
- **ImageMagick** - For image resizing and processing
- **Manual cleanup** - Removes adaptive icons, round icons, and splash screens
