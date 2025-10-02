import { BaseUIComponent } from './BaseUIComponent.js';
import { html } from '../framework.utils.js';
import { getState, subscribeToState } from '../framework.core.js';

// Define x-navbar web component
export class XNavbar extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();
		
		// Subscribe to activePath changes to update the title
		this.unsubscribe = subscribeToState('activePath', () => {
			this.updateTitle();
		});

		// Set initial title
		this.updateTitle();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	updateTitle() {
		const activePath = getState('activePath') || '';
		let title = 'Navigation';

		// Map activePath to display title
		if (activePath === '/' || activePath === '') {
			title = 'Home';
		} else if (activePath === '/issues') {
			title = 'Issues';
		} else if (activePath === '/wiki') {
			title = 'Wiki';
		} else if (activePath === '/files') {
			title = 'Files';
		} else if (activePath === '/settings') {
			title = 'Settings';
		} else if (activePath.startsWith('/')) {
			// Extract title from path for other pages
			const pathName = activePath.substring(1); // Remove leading slash
			// Add spaces around forward slashes and remove x- prefix for better readability
			let formattedPath = pathName.replace(/\//g, ' / ');
			// Remove x- prefix from component names
			formattedPath = formattedPath.replace(/x-/g, '');
			title = formattedPath.charAt(0).toUpperCase() + formattedPath.slice(1);
		}

		// Store the original content for the right side actions
		const originalContent = this.innerHTML;

		// Create navbar structure with dark grey header
		this.innerHTML = html`
			<div class="navbar-header">
				<x-typography variant="h1"> ${title} </x-typography>
				<div class="navbar-right">
					<div class="navbar-actions">${originalContent}</div>
				</div>
			</div>
		`;
	}
}
