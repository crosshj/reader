import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-html web component
export class XHtml extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Get content from the content attribute or fallback to innerHTML
		let content = this.getAttribute('content') || this.innerHTML;

		// If content came from attribute, decode the escaped characters
		if (this.getAttribute('content')) {
			content = content
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&#10;/g, '\n')
				.replace(/\r/g, '\r')
				.replace(/&#9;/g, '\t');
		}

		if (!content.trim()) {
			this.innerHTML = '';
			return;
		}

		// Set the HTML content directly (no wrapper element)
		this.innerHTML = content;

		// Apply sx: styles if any
		this.applySxStyles();
	}
}
