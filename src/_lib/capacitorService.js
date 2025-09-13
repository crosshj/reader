/**
 * Capacitor Service
 * Handles Capacitor-specific functionality for file handling and app lifecycle
 */
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { StatusBar, Style } from '@capacitor/status-bar';
import { FileOpener } from '@capacitor-community/file-opener';
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
			// App state changed
		});

		// Listen for app URL opening (for file associations)
		App.addListener('appUrlOpen', async (data) => {
			alert(`File opened! URL: ${data.url}`);
			await this.handleAppUrlOpen(data.url);
		});

		// Listen for resume events (when app comes back from background)
		App.addListener('resume', async () => {
			await this.checkForFileToOpen();
		});
	}

	/**
	 * Handle app URL opening (file associations)
	 * @param {string} url - The URL that opened the app
	 */
	async handleAppUrlOpen(url) {
		try {
			
			// Check if this is a file URL
			if (url.startsWith('file://') || url.startsWith('content://')) {
				let fileContent;
				let fileName = 'unknown.smartText';
				
				if (url.startsWith('file://')) {
					// Handle file:// URLs
					const filePath = url.replace('file://', '');
					fileName = filePath.split('/').pop();
					
					fileContent = await Filesystem.readFile({
						path: filePath,
						directory: Directory.External
					});
				} else if (url.startsWith('content://')) {
					// Handle content:// URLs (from file managers)
					// Use FileOpener to read the content
					try {
						alert(`Content URI detected: ${url}\n\nAttempting to read file...`);
						
						// Try to open the file with FileOpener
						const result = await FileOpener.open({
							uri: url,
							contentType: 'application/octet-stream'
						});
						
						alert(`FileOpener result: ${JSON.stringify(result)}`);
						
						// For now, create a placeholder file object
						// In a real implementation, we'd need to read the actual content
						const file = {
							name: url.split('/').pop() || 'file.smartText',
							path: url,
							content: new ArrayBuffer(0),
							type: 'application/octet-stream'
						};
						this.dispatchFileOpenEvent(file);
						return;
					} catch (error) {
						alert(`Error reading content URI: ${error.message}`);
						
						// Fallback: create a placeholder file object
						const file = {
							name: url.split('/').pop() || 'file.smartText',
							path: url,
							content: new ArrayBuffer(0),
							type: 'application/octet-stream'
						};
						this.dispatchFileOpenEvent(file);
						return;
					}
				}
				
				// Create a file object
				const file = {
					name: fileName,
					path: url,
					content: fileContent.data,
					type: 'application/octet-stream'
				};
				
				// Dispatch file open event
				this.dispatchFileOpenEvent(file);
			}
		} catch (error) {
			// Error handling
		}
	}

	/**
	 * Check for files to open (placeholder for future implementation)
	 */
	async checkForFileToOpen() {
		// This could be used to check for files in shared storage or other locations
		// For now, it's a placeholder
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