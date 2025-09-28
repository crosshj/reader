import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-content web component
export class XContent extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}
