/**
 * Enhanced Safe Area Detection for Capacitor Apps
 * Optimized for edge-to-edge layout with native keyboard handling
 */
export function initializeSafeAreas() {
    return new Promise((resolve) => {
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
 * Prioritizes Capacitor StatusBar plugin for accuracy
 */
export function detectAndSetSafeAreas() {
    let statusBarHeight = 0;
    let navBarHeight = 0;
    let leftInset = 0;
    let rightInset = 0;

    // Method 1: Try Capacitor StatusBar plugin first (most reliable)
    if (window.Capacitor?.Plugins?.StatusBar) {
        window.Capacitor.Plugins.StatusBar.getInfo()
            .then(info => {
                if (info.visible) {
                    statusBarHeight = info.height || 24;
                }
                // Continue with other detection methods
                calculateSafeAreas();
            })
            .catch(error => {
                console.warn('StatusBar plugin error:', error);
                // Fallback to calculation methods
                calculateSafeAreas();
            });
    } else {
        calculateSafeAreas();
    }

    function calculateSafeAreas() {
        try {
            // Method 2: Calculate based on screen vs viewport difference
            const screenHeight = screen.height;
            const viewportHeight = window.innerHeight;
            const screenWidth = screen.width;
            const viewportWidth = window.innerWidth;

            // If viewport is smaller than screen, we have system UI
            if (viewportHeight < screenHeight) {
                const heightDiff = screenHeight - viewportHeight;
                // More accurate distribution for Android
                navBarHeight = Math.max(48, heightDiff * 0.6);
                if (statusBarHeight === 0) {
                    statusBarHeight = Math.max(24, heightDiff * 0.4);
                }
            }

            if (viewportWidth < screenWidth) {
                const widthDiff = screenWidth - viewportWidth;
                leftInset = widthDiff / 2;
                rightInset = widthDiff / 2;
            }

            // Method 3: Platform-specific fallbacks
            const platform = window.Capacitor?.getPlatform();
            if (platform === 'android') {
                statusBarHeight = statusBarHeight || 24;
                navBarHeight = navBarHeight || 48;
            } else if (platform === 'ios') {
                statusBarHeight = statusBarHeight || 44;
                navBarHeight = navBarHeight || 34;
            } else {
                // Web fallback
                statusBarHeight = statusBarHeight || 0;
                navBarHeight = navBarHeight || 0;
            }

            updateCSSVariables();
        } catch (error) {
            console.error('Error calculating safe areas:', error);
            // Use minimal fallback values
            updateCSSVariables();
        }
    }

    function updateCSSVariables() {
        try {
            document.documentElement.style.setProperty('--safe-area-inset-top', statusBarHeight + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-bottom', navBarHeight + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-left', leftInset + 'px');
            document.documentElement.style.setProperty('--safe-area-inset-right', rightInset + 'px');
            
        } catch (error) {
            console.error('Error setting CSS variables:', error);
        }
    }
}

/**
 * Debounce function to prevent excessive recalculations
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Setup event listeners for orientation changes with debouncing (only once)
let eventListenersAdded = false;

function setupEventListeners() {
    if (eventListenersAdded) return;
    
    const debouncedDetectSafeAreas = debounce(detectAndSetSafeAreas, 150);
    
    window.addEventListener('resize', debouncedDetectSafeAreas);
    window.addEventListener('orientationchange', debouncedDetectSafeAreas);
    
    // Also listen for viewport changes that might affect safe areas
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', debouncedDetectSafeAreas);
    }
    
    eventListenersAdded = true;
}

// Initialize event listeners
setupEventListeners();