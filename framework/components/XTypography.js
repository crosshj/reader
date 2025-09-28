import { BaseUIComponent } from './BaseUIComponent.js';

// Define x-typography web component
export class XTypography extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Set display based on variant - strong should be inline
		const variant = this.getAttribute('variant');
		if (variant === 'strong') {
			this.style.display = 'inline';
		} else {
			this.style.display = 'block';
		}
		// Apply sx: styles to the x-typography element itself
		this.applySxStylesToElement(this);
	}

	applySxStylesToElement(element) {
		// Get all attributes that start with 'sx:'
		const attributes = Array.from(this.attributes);
		const sxStyles = {};

		attributes.forEach((attr) => {
			if (attr.name.startsWith('sx:')) {
				// Remove 'sx:' prefix and convert to CSS property
				const cssProperty = attr.name.substring(3);
				const cssValue = attr.value;

				// Handle shorthand properties for padding and margin
				const shorthandProperties = this.expandShorthandProperty(
					cssProperty,
					cssValue
				);
				Object.assign(sxStyles, shorthandProperties);
			}
		});

		// Apply the styles directly to the element
		Object.entries(sxStyles).forEach(([property, value]) => {
			element.style.setProperty(property, value);
		});
	}

	expandShorthandProperty(property, value) {
		const expanded = {};

		// Convert numeric values to spacing scale (1 = 8px = 0.5rem)
		const convertSpacingValue = (val) => {
			// If it's a number (or string that can be parsed as number), convert to spacing scale
			if (!isNaN(val) && !isNaN(parseFloat(val))) {
				const num = parseFloat(val);
				return `${num * 0.5}rem`; // 1 = 0.5rem (8px), 2 = 1rem (16px), etc.
			}
			return val;
		};

		// Padding shorthand properties
		if (property === 'p') {
			expanded['padding'] = convertSpacingValue(value);
		} else if (property === 'pt') {
			expanded['padding-top'] = convertSpacingValue(value);
		} else if (property === 'pb') {
			expanded['padding-bottom'] = convertSpacingValue(value);
		} else if (property === 'pl') {
			expanded['padding-left'] = convertSpacingValue(value);
		} else if (property === 'pr') {
			expanded['padding-right'] = convertSpacingValue(value);
		} else if (property === 'py') {
			expanded['padding-block'] = convertSpacingValue(value);
		} else if (property === 'px') {
			expanded['padding-inline'] = convertSpacingValue(value);
		}
		// Margin shorthand properties
		else if (property === 'm') {
			expanded['margin'] = convertSpacingValue(value);
		} else if (property === 'mt') {
			expanded['margin-top'] = convertSpacingValue(value);
		} else if (property === 'mb') {
			expanded['margin-bottom'] = convertSpacingValue(value);
		} else if (property === 'ml') {
			expanded['margin-left'] = convertSpacingValue(value);
		} else if (property === 'mr') {
			expanded['margin-right'] = convertSpacingValue(value);
		} else if (property === 'my') {
			expanded['margin-block'] = convertSpacingValue(value);
		} else if (property === 'mx') {
			expanded['margin-inline'] = convertSpacingValue(value);
		}
		// Handle regular camelCase properties
		else {
			// Convert camelCase to kebab-case for CSS properties
			let kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

			// Fix specific CSS properties that need proper hyphenation
			kebabProperty = this.fixCssPropertyName(kebabProperty);
			expanded[kebabProperty] = value;
		}

		return expanded;
	}
}
