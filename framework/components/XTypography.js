import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-typography web component
export class XTypography extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();
		
		// Set display based on variant - strong should be inline
		const variant = this.getAttribute('variant');
		if (variant === 'strong') {
			this.style.display = 'inline';
		} else {
			this.style.display = 'block';
		}
	}
}
