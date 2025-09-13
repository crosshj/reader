/**
 * Capacitor Service
 * Handles Capacitor-specific functionality for file handling and app lifecycle
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { initializeSafeAreas } from './safeAreas.js';

export class CapacitorService {
	constructor() {
		this.isNative = Capacitor.isNativePlatform();
		this.platform = Capacitor.getPlatform();
		this.setupAppListeners();
	}

	/**
	 * Initialize Capacitor UI components (status bar, safe areas, and platform class)
	 */
	async initializeUI() {
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
	}

	/**
	 * Setup Capacitor app listeners for file handling
	 */
	setupAppListeners() {
		if (!this.isNative) {
			return;
		}

		// Listen for app state changes
		App.addListener('appStateChange', ({ isActive }) => {
			console.log('App state changed. Is active?', isActive);
		});

		// Listen for app URL opening (for file associations)
		App.addListener('appUrlOpen', async (data) => {
			console.log('App opened with URL:', data.url);
			await this.handleAppUrlOpen(data.url);
		});

		// Listen for resume events (when app comes back from background)
		App.addListener('resume', async () => {
			console.log('App resumed');
			await this.checkForFileToOpen();
		});
	}

	/**
	 * Handle app URL opening (file associations)
	 * @param {string} url - The URL that opened the app
	 */
	async handleAppUrlOpen(url) {
		try {
			console.log('Handling app URL open:', url);
			
			// Check if this is a file URL
			if (url.startsWith('file://') || url.startsWith('content://')) {
				// Extract file path from URL
				let filePath = url;
				if (url.startsWith('file://')) {
					filePath = url.replace('file://', '');
				}
				
				// Read the file content
				const fileContent = await Filesystem.readFile({
					path: filePath,
					directory: Directory.External
				});
				
				// Create a file object
				const file = {
					name: filePath.split('/').pop(),
					path: filePath,
					content: fileContent.data,
					type: 'text/plain'
				};
				
				// Dispatch file open event
				this.dispatchFileOpenEvent(file);
			}
		} catch (error) {
			console.error('Error handling app URL open:', error);
		}
	}

	/**
	 * Check for files to open (placeholder for future implementation)
	 */
	async checkForFileToOpen() {
		// This could be used to check for files in shared storage or other locations
		// For now, it's a placeholder
		console.log('Checking for files to open...');
	}

	/**
	 * Dispatch file open event to the application
	 * @param {Object} file - File object to open
	 */
	dispatchFileOpenEvent(file) {
		// Import dispatchEvent dynamically to avoid circular dependencies
		import('../_lib/utils.js').then(({ dispatchEvent }) => {
			dispatchEvent('ui:openFile', { file });
		});
	}

	/**
	 * Check if running on native platform
	 * @returns {boolean}
	 */
	isNativePlatform() {
		return this.isNative;
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
