/**
 * Base UI Component class with common utilities
 * All x- components should extend from this base class
 */
export class BaseUIComponent extends HTMLElement {
	/**
	 * Parse sx: attributes and apply them as CSS styles
	 * This method can be called by any component that needs sx: support
	 */
	applySxStyles() {
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
			this.style.setProperty(property, value);
		});
	}

	/**
	 * Expand shorthand properties like sx:p, sx:pt, sx:py, etc.
	 * @param {string} property - The property name (e.g., 'p', 'pt', 'py')
	 * @param {string} value - The CSS value
	 * @returns {Object} - Object with expanded CSS properties
	 */
	expandShorthandProperty(property, value) {
		const expanded = {};

		// Add MUI-style spacing scale if value is unitless (just a number)
		// MUI uses 8px as the base spacing unit, so 1 = 8px, 2 = 16px, etc.
		const addMuiSpacing = (val) => {
			if (/^\d+(\.\d+)?$/.test(val)) {
				const spacingValue = parseFloat(val) * 8;
				return spacingValue + 'px';
			}
			return val;
		};

		// Padding shorthand properties
		if (property === 'p') {
			expanded['padding'] = addMuiSpacing(value);
		} else if (property === 'pt') {
			expanded['padding-top'] = addMuiSpacing(value);
		} else if (property === 'pb') {
			expanded['padding-bottom'] = addMuiSpacing(value);
		} else if (property === 'pl') {
			expanded['padding-left'] = addMuiSpacing(value);
		} else if (property === 'pr') {
			expanded['padding-right'] = addMuiSpacing(value);
		} else if (property === 'py') {
			expanded['padding-block'] = addMuiSpacing(value);
		} else if (property === 'px') {
			expanded['padding-inline'] = addMuiSpacing(value);
		}
		// Margin shorthand properties
		else if (property === 'm') {
			expanded['margin'] = addMuiSpacing(value);
		} else if (property === 'mt') {
			expanded['margin-top'] = addMuiSpacing(value);
		} else if (property === 'mb') {
			expanded['margin-bottom'] = addMuiSpacing(value);
		} else if (property === 'ml') {
			expanded['margin-left'] = addMuiSpacing(value);
		} else if (property === 'mr') {
			expanded['margin-right'] = addMuiSpacing(value);
		} else if (property === 'my') {
			expanded['margin-block'] = addMuiSpacing(value);
		} else if (property === 'mx') {
			expanded['margin-inline'] = addMuiSpacing(value);
		}
		// Handle regular camelCase properties
		else {
			// Convert camelCase to kebab-case for CSS properties
			let kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();

			// Fix specific CSS properties that need proper hyphenation
			kebabProperty = this.fixCssPropertyName(kebabProperty);
			expanded[kebabProperty] = addMuiSpacing(value);
		}

		return expanded;
	}

	/**
	 * Fix CSS property names that need special handling
	 * @param {string} property - The kebab-case property name
	 * @returns {string} - The corrected CSS property name
	 */
	fixCssPropertyName(property) {
		const fixes = {
			// CSS Grid properties
			gridtemplatecolumns: 'grid-template-columns',
			gridtemplaterows: 'grid-template-rows',
			gridcolumn: 'grid-column',
			gridrow: 'grid-row',
			gridarea: 'grid-area',
			gridgap: 'grid-gap',
			gridcolumngap: 'grid-column-gap',
			gridrowgap: 'grid-row-gap',

			// Background properties
			backgroundimage: 'background-image',
			backgroundsize: 'background-size',
			backgroundposition: 'background-position',
			backgroundrepeat: 'background-repeat',
			backgroundattachment: 'background-attachment',
			backgroundcolor: 'background-color',

			// Border properties
			borderradius: 'border-radius',
			borderwidth: 'border-width',
			borderstyle: 'border-style',
			bordercolor: 'border-color',
			borderleft: 'border-left',
			borderright: 'border-right',
			borderbottom: 'border-bottom',
			bordertop: 'border-top',

			// Font properties
			fontsize: 'font-size',
			fontweight: 'font-weight',
			fontfamily: 'font-family',
			fontstyle: 'font-style',
			lineheight: 'line-height',
			letterspacing: 'letter-spacing',
			textalign: 'text-align',
			textdecoration: 'text-decoration',
			texttransform: 'text-transform',

			// Flexbox properties
			flexdirection: 'flex-direction',
			flexwrap: 'flex-wrap',
			justifycontent: 'justify-content',
			alignitems: 'align-items',
			aligncontent: 'align-content',
			flexgrow: 'flex-grow',
			flexshrink: 'flex-shrink',
			flexbasis: 'flex-basis',

			// Spacing properties
			marginleft: 'margin-left',
			marginright: 'margin-right',
			margintop: 'margin-top',
			marginbottom: 'margin-bottom',
			paddingleft: 'padding-left',
			paddingright: 'padding-right',
			paddingtop: 'padding-top',
			paddingbottom: 'padding-bottom',

			// Position properties
			zindex: 'z-index',
			transformorigin: 'transform-origin',
			transitionduration: 'transition-duration',
			transitiontimingfunction: 'transition-timing-function',
			transitiondelay: 'transition-delay',
			transitionproperty: 'transition-property',

			// Box model properties
			boxsizing: 'box-sizing',
			minwidth: 'min-width',
			maxwidth: 'max-width',
			minheight: 'min-height',
			maxheight: 'max-height',
			boxshadow: 'box-shadow',
			outlinewidth: 'outline-width',
			outlinestyle: 'outline-style',
			outlinecolor: 'outline-color',
		};

		return fixes[property] || property;
	}
}
