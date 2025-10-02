import { Navigate } from '../framework.core.js';

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

		if (underline === 'none') {
			link.style.textDecoration = 'none';
		}

		link.addEventListener('click', () => {
			Navigate(href);
		});

		this.innerHTML = '';
		this.appendChild(link);
	}
}
