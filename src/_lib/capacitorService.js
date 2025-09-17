/**
 * Capacitor Service
 * Handles Capacitor-specific functionality for file handling and app lifecycle
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { initializeSafeAreas } from './safeAreas.js';

export class CapacitorService {
	constructor() {
		this.isNative = Capacitor.isNativePlatform();
		this.platform = Capacitor.getPlatform();
		
		// Only setup Capacitor-specific functionality on native platforms
		if (this.platform !== 'web') {
			this.setupAppListeners();
		}
	}

	/**
	 * Initialize Capacitor UI components (status bar, safe areas, and platform class)
	 */
	async initializeUI() {
		// Only initialize Capacitor UI on native platforms
		if (this.platform !== 'web') {
			// Initialize status bar if on native platform (before safe area detection)
			if (this.isNative) {
				try {
					await StatusBar.setStyle({ style: Style.Default });
					await StatusBar.setBackgroundColor({ color: 'transparent' });
					await StatusBar.setOverlaysWebView({ overlay: true });
				} catch (error) {
					console.warn('Failed to configure status bar:', error);
				}
			}

			// Add platform class for CSS targeting
			this.addPlatformClass();

			// Initialize safe area detection after status bar is configured
			await initializeSafeAreas();
		} else {
			// On web, just add platform class (no safe areas needed)
			this.addPlatformClass();
		}
	}


	/**
	 * Setup Capacitor app listeners for file handling
	 */
	setupAppListeners() {
		// Only setup listeners on native platforms
		if (this.platform === 'web') {
			return;
		}

		// Listen for app state changes
		App.addListener('appStateChange', ({ isActive }) => {
			// App state changed
		});

		// Listen for resume events (when app comes back from background)
		App.addListener('resume', async () => {
			// App resumed from background - no specific action needed
		});
	}



	/**
	 * Check if running on native platform
	 * @returns {boolean}
	 */
	isNativePlatform() {
		return this.platform !== 'web';
	}

	/**
	 * Get current platform
	 * @returns {string}
	 */
	getPlatform() {
		return this.platform;
	}

	/**
	 * Add platform class to document body
	 */
	addPlatformClass() {
		if (this.isNative) {
			document.body.classList.add(`platform-${this.platform}`);
		}
	}
}