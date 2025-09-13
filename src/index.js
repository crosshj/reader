import './index.css';
import { dispatchEvent } from './_lib/utils.js';
import { initializeSafeAreas } from './_lib/safeAreaService.js';

// Import Capacitor
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

// Import controllers
import { ApplicationController } from './Application/ApplicationController.js';
import { ReaderController } from './Reader/ReaderController.js';

async function startReader() {
	// Initialize Capacitor status bar for edge-to-edge
	if (Capacitor.isNativePlatform()) {
		try {
			await StatusBar.setStyle({ style: Style.Default });
			await StatusBar.setBackgroundColor({ color: 'transparent' });
			await StatusBar.setOverlaysWebView({ overlay: true });
		} catch (error) {
			console.warn('Failed to configure status bar:', error);
		}
	}

	// Initialize safe area detection - this must complete before rendering
	await initializeSafeAreas();

	// Initialize controllers
	const applicationController = new ApplicationController();
	const readerController = new ReaderController();

	// Add platform class for CSS targeting
	if (Capacitor.isNativePlatform()) {
		document.body.classList.add(`platform-${Capacitor.getPlatform()}`);
	}

	// Show content once styles are loaded
	document.body.classList.add('styles-loaded');

	// Handle file opening from system
	window.handleFileOpen = async (file) => {
		try {
			// Dispatch file open event
			dispatchEvent('ui:openFile', { file });
		} catch (error) {
			console.error('Error handling file open:', error);
		}
	};

	dispatchEvent('app:init');
}

// Start the reader when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', startReader);
} else {
	startReader();
}
