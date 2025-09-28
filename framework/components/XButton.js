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

		// Get text content excluding icon elements
		const textContent = this.getTextContentExcludingIcons();
		const buttonText = label || textContent;

		// Create icon if specified
		let iconElement = null;
		if (icon) {
			iconElement = document.createElement('span');
			iconElement.className = `fa fa-${this.convertToFontAwesome(icon)} small button-icon`;
		}

		// Create button content with proper icon positioning
		const button = document.createElement('button');
		if (href) {
			button.onclick = () => (window.location.href = href);
		}

		if (icon && iconPosition === 'left') {
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
