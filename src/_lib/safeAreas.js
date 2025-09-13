/**
 * Initialize safe area detection and return a promise
 * This must complete before the app starts rendering
 */
export function initializeSafeAreas() {
    return new Promise((resolve) => {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                detectAndSetSafeAreas();
                resolve();
            });
        } else {
            detectAndSetSafeAreas();
            resolve();
        }
    });
}

/**
 * Detect safe area insets using multiple methods and set CSS variables
 */
function detectAndSetSafeAreas() {
    let statusBarHeight = 0;
    let navBarHeight = 0;
    let leftInset = 0;
    let rightInset = 0;

    // Method 1: Try CSS environment variables
    const statusBarEnv = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)');
    const navBarEnv = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)');
    const leftEnv = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)');
    const rightEnv = getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)');

    console.log('CSS env values:', { statusBarEnv, navBarEnv, leftEnv, rightEnv });

    // Method 2: Try Capacitor StatusBar plugin
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
        try {
            window.Capacitor.Plugins.StatusBar.getInfo().then(info => {
                console.log('StatusBar info:', info);
                if (info.visible) {
                    statusBarHeight = info.height || 24;
                    updateCSSVariables();
                }
            });
        } catch (e) {
            console.log('StatusBar plugin error:', e);
        }
    }

    // Method 3: Calculate based on screen vs viewport difference
    const screenHeight = screen.height;
    const viewportHeight = window.innerHeight;
    const screenWidth = screen.width;
    const viewportWidth = window.innerWidth;

    // If viewport is smaller than screen, we have system UI
    if (viewportHeight < screenHeight) {
        const heightDiff = screenHeight - viewportHeight;
        // Assume bottom nav bar takes more space than top status bar
        navBarHeight = Math.max(48, heightDiff * 0.7);
        statusBarHeight = Math.max(24, heightDiff * 0.3);
    }

    if (viewportWidth < screenWidth) {
        const widthDiff = screenWidth - viewportWidth;
        leftInset = widthDiff / 2;
        rightInset = widthDiff / 2;
    }

    // Method 4: Use fallback values
    if (statusBarHeight === 0) statusBarHeight = 24;
    if (navBarHeight === 0) navBarHeight = 48;

    // Update CSS custom properties
    function updateCSSVariables() {
        document.documentElement.style.setProperty('--safe-area-inset-top', statusBarHeight + 'px');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', navBarHeight + 'px');
        document.documentElement.style.setProperty('--safe-area-inset-left', leftInset + 'px');
        document.documentElement.style.setProperty('--safe-area-inset-right', rightInset + 'px');
        
        console.log('Safe area insets set:', {
            top: statusBarHeight,
            bottom: navBarHeight,
            left: leftInset,
            right: rightInset
        });
    }

    updateCSSVariables();

    // Setup event listeners for orientation changes
    window.addEventListener('resize', () => {
        setTimeout(() => detectAndSetSafeAreas(), 100);
    });
    
    window.addEventListener('orientationchange', () => {
        setTimeout(() => detectAndSetSafeAreas(), 100);
    });
}
