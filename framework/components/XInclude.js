import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState } from '../framework.core.js';
import { cleanServerHTML } from './cleanServerHTML.js';

// Define x-include web component
export class XInclude extends BaseUIComponent {
	constructor() {
		super();
		// Add a static counter to track instances
		if (!XInclude.instanceCount) {
			XInclude.instanceCount = 0;
		}
		XInclude.instanceCount++;
		this.instanceId = XInclude.instanceCount;
	}

	// Helper function to resolve relative paths
	resolvePath(href, basePath) {
		if (
			href.startsWith('http://') ||
			href.startsWith('https://') ||
			href.startsWith('/')
		) {
			// Absolute URL or absolute path - use as is
			return href;
		}

		// Relative path - resolve against base path
		const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
		return baseDir + href;
	}

	// Helper function to get the current page path
	getCurrentPagePath() {
		// Check if we have a centralized state with current page path
		const currentPath = getState('currentPath');
		if (currentPath) {
			return currentPath;
		}

		// Fallback: try to get from the URL or default to fragments root
		const url = new URL(window.location.href);
		const pathname = url.pathname;

		// If we're loading a file directly (like standard.html),
		// we need to determine the correct base path
		if (pathname.endsWith('.html')) {
			// If it's a file in fragments/, use that directory
			if (pathname.includes('fragments/')) {
				return pathname.substring(pathname.indexOf('fragments/'));
			}
			// If it's a test file or other file, assume fragments/ is the base
			return 'fragments/';
		}

		// For directory paths, use as is
		if (pathname.includes('fragments/')) {
			return pathname.substring(pathname.indexOf('fragments/'));
		}

		return 'fragments/';
	}

	async connectedCallback() {
		const href = this.getAttribute('href');
		if (!href) {
			console.warn('x-include: no href attribute provided');
			return;
		}

		// Set background color as a style attribute on the x-include element
		this.setAttribute(
			'style',
			'background-color: var(--palettePrimaryMain, #1976d2);'
		);

		try {
			// Resolve the path relative to the current page
			const currentPagePath = this.getCurrentPagePath();
			const resolvedPath = this.resolvePath(href, currentPagePath);

			const response = await fetch(resolvedPath);
			if (!response.ok) {
				throw new Error(
					`Failed to load include: ${response.status} ${response.statusText}`
				);
			}
			const content = await response.text();
			const cleanedContent = cleanServerHTML(content);

			// Just update innerHTML - the browser handles the rest
			this.innerHTML = cleanedContent;

			// Apply sx: styles if any
			this.applySxStyles();
		} catch (error) {
			console.error('Error loading include:', error);
			this.innerHTML = html`<div style="padding: 20px; color: red;">
				Error loading include: ${error.message}
			</div>`;
		}
	}
}
