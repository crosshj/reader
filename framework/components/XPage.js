import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-page web component
export class XPage extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}
