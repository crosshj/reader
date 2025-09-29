import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-button web component
export class XButton extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		const label = this.getAttribute('label');
		const href = this.getAttribute('href');
		const icon = this.getAttribute('icon');
		const iconPosition = this.getAttribute('iconPosition') || 'left';
		const variant = this.getAttribute('variant') || 'primary';
		const size = this.getAttribute('size') || 'medium';
		const disabled = this.hasAttribute('disabled');
		const loading = this.hasAttribute('loading');

		// Get text content excluding icon elements
		const textContent = this.getTextContentExcludingIcons();
		const buttonText = label || textContent;

		// Create icon if specified
		let iconElement = null;
		if (icon && !loading) {
			iconElement = document.createElement('span');
			iconElement.className = `fa fa-${this.convertToFontAwesome(icon)} button-icon`;
		}

		// Create loading spinner if loading
		let loadingElement = null;
		if (loading) {
			loadingElement = document.createElement('span');
			loadingElement.className = 'fa fa-refresh fa-spin button-icon';
		}

		// Create button content with proper icon positioning
		let button;

		if (href && !disabled && !loading) {
			// Create x-link for navigation buttons
			button = document.createElement('x-link');
			button.setAttribute('href', href);
			button.className = `x-button x-button-${variant} x-button-${size}`;
		} else {
			// Create regular button for actions
			button = document.createElement('button');
			button.className = `x-button x-button-${variant} x-button-${size}`;

			if (disabled || loading) {
				button.disabled = true;
			}
		}

		// Add content based on state
		if (loading) {
			button.appendChild(loadingElement);
			button.appendChild(document.createTextNode('Loading...'));
		} else if (icon && iconPosition === 'left') {
			button.appendChild(iconElement);
			button.appendChild(document.createTextNode(buttonText));
		} else if (icon && iconPosition === 'right') {
			button.appendChild(document.createTextNode(buttonText));
			button.appendChild(iconElement);
		} else {
			button.textContent = buttonText;
		}

		this.innerHTML = '';
		this.appendChild(button);

		// Apply sx: styles if any
		this.applySxStyles();
	}

	getTextContentExcludingIcons() {
		// Clone the element to avoid modifying the original
		const clone = this.cloneNode(true);
		// Remove all x-icon elements from the clone
		const icons = clone.querySelectorAll('x-icon');
		icons.forEach((icon) => icon.remove());
		// Return the text content
		return clone.textContent.trim();
	}

	convertToFontAwesome(pascalCaseName) {
		if (!pascalCaseName) return 'help';

		// Convert PascalCase to Material Symbols naming convention
		const iconMap = {
			Home: 'home',
			ListAlt: 'list-alt',
			MenuBook: 'book',
			DriveFolderUpload: 'upload',
			AccountTree: 'cog',
			Save: 'save',
			Add: 'plus',
			ArrowForward: 'arrow-right',
			ArrowBack: 'arrow-left',
			Edit: 'edit',
			Delete: 'trash-o',
			Close: 'times',
			Search: 'search',
			Filter: 'filter',
			MoreVert: 'ellipsis-v',
			MoreHoriz: 'ellipsis-h',
			Info: 'info-circle',
			Warning: 'exclamation-triangle',
			Error: 'exclamation-circle',
			Success: 'check-circle',
			Loading: 'refresh',
			People: 'users',
			Person: 'user',
			LineChart: 'line-chart',
			History: 'history',
			Play: 'play',
		};

		return (
			iconMap[pascalCaseName] ||
			pascalCaseName
				.replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
				.toLowerCase() // Convert to lowercase
				.replace(/^_/, '')
		); // Remove leading underscore
	}
}
