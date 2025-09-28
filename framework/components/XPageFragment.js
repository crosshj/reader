import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-page-fragment web component
export class XPageFragment extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}
