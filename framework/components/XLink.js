import { setState } from '../framework.core.js';

// Define x-link web component
export class XLink extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const href = this.getAttribute('href');
		const underline = this.getAttribute('underline');

		// Create a link element
		const link = document.createElement('a');
		link.href = href ? `#${href}` : '#';
		link.innerHTML = this.innerHTML;

		// Apply underline styling
		if (underline === 'none') {
			link.style.textDecoration = 'none';
		}

		// Listen for hash changes to update centralized state
		link.addEventListener('click', () => {
			// Update centralized state when clicked
			if (href) {
				setState('currentPath', href);
				// Dispatch navigation event
				window.dispatchEvent(
					new CustomEvent('navigate', {
						detail: { path: href },
					})
				);
			}
		});

		this.innerHTML = '';
		this.appendChild(link);
	}
}
