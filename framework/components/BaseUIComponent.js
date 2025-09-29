import {
	parseConditionalValue,
	extractStateReferences,
} from '../framework.utils.js';

export class BaseUIComponent extends HTMLElement {
	constructor() {
		super();
		this.stateSubscriptions = new Map(); // Map of stateKey -> unsubscribe function
		this.initialState = null;
		this.originalAttributes = new Map(); // Store ALL original attributes for re-evaluation

		// Set up state subscriptions immediately in constructor
		// This ensures we don't miss state changes that happen before connectedCallback
		this.setupStateSubscriptions();
	}

	connectedCallback() {
		// Store initial state for conditional rendering
		this.initialState = this.getCurrentState();

		// Store ALL original attributes for re-evaluation
		this.storeOriginalAttributes();

		// Apply initial styles and conditional attributes
		this.applySxStyles();
		this.applyConditionalAttributes();
	}

	disconnectedCallback() {
		// Clean up all state subscriptions
		this.stateSubscriptions.forEach((unsubscribe) => unsubscribe());
		this.stateSubscriptions.clear();
	}

	getCurrentState() {
		// Get current state from window.state or return empty object
		return typeof window !== 'undefined' && window.state
			? { ...window.state }
			: {};
	}

	storeOriginalAttributes() {
		// Store ALL original attributes for re-evaluation
		const attributes = Array.from(this.attributes);
		attributes.forEach((attr) => {
			this.originalAttributes.set(attr.name, attr.value);
		});
	}

	setupStateSubscriptions() {
		const stateRefs = extractStateReferences(this.attributes);

		stateRefs.forEach((stateKey) => {
			if (typeof window !== 'undefined' && window.subscribeToState) {
				const unsubscribe = window.subscribeToState(stateKey, (eventDetail) => {
					this.handleStateChange(eventDetail.state);
				});
				this.stateSubscriptions.set(stateKey, unsubscribe);
			}
		});
	}

	handleStateChange(newState) {
		// Update state and re-apply conditional rendering
		this.initialState = newState || this.getCurrentState();
		this.applySxStyles();
		this.applyConditionalAttributes();
	}

	applyConditionalAttributes() {
		// Handle ALL attributes with conditional syntax using original attributes
		this.originalAttributes.forEach((value, name) => {
			// Skip sx: attributes as they're handled by applySxStyles
			if (name.startsWith('sx:')) {
				return;
			}

			// Check if this attribute contains global_ references (conditional logic)
			if (
				value.includes('global_') ||
				value.includes('WHEN ') ||
				value.includes('DEBUG ')
			) {
				const isDebug = value.startsWith('DEBUG ');
				if (isDebug) {
					console.log('🐛 DEBUG applyConditionalAttributes:', {
						element: this.tagName,
						attribute: name,
						originalValue: value,
						currentState: this.initialState,
					});
				}

				const resolvedValue = parseConditionalValue(value, this.initialState);

				// Apply the resolved value to the element
				if (name === 'className' || name === 'class') {
					this.className = resolvedValue;
				}
				this.setAttribute(name, resolvedValue);

				if (isDebug) {
					console.log('🐛 DEBUG attribute resolved:', {
						element: this.tagName,
						attribute: name,
						original: value,
						resolved: resolvedValue,
						appliedToElement: this.getAttribute(name),
					});
				}
			}
		});
	}

	/**
	 * Parse sx: attributes and apply them as CSS styles
	 * This method can be called by any component that needs sx: support
	 */
	applySxStyles() {
		// Use stored original attributes for evaluation
		const sxStyles = {};
		this.originalAttributes.forEach((value, name) => {
			if (name.startsWith('sx:')) {
				// Remove 'sx:' prefix and convert to CSS property
				const cssProperty = name.substring(3);
				const cssValue = parseConditionalValue(value, this.initialState);

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

		// Remove sx: attributes from DOM after first processing (keep DOM clean)
		const attributes = Array.from(this.attributes);
		attributes.forEach((attr) => {
			if (attr.name.startsWith('sx:')) {
				this.removeAttribute(attr.name);
			}
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
			alignself: 'align-self',
			flexgrow: 'flex-grow',
			flexshrink: 'flex-shrink',
			flexbasis: 'flex-basis',

			// Box model properties
			boxsizing: 'box-sizing',
			boxshadow: 'box-shadow',
			overflowx: 'overflow-x',
			overflowy: 'overflow-y',

			// Position properties
			zindex: 'z-index',
			top: 'top',
			right: 'right',
			bottom: 'bottom',
			left: 'left',

			// Transform properties
			transformorigin: 'transform-origin',
			transformstyle: 'transform-style',
			perspective: 'perspective',
			perspectiveorigin: 'perspective-origin',
			backfacevisibility: 'backface-visibility',

			// Transition properties
			transitionproperty: 'transition-property',
			transitionduration: 'transition-duration',
			transitiontimingfunction: 'transition-timing-function',
			transitiondelay: 'transition-delay',

			// Animation properties
			animationname: 'animation-name',
			animationduration: 'animation-duration',
			animationtimingfunction: 'animation-timing-function',
			animationdelay: 'animation-delay',
			animationiterationcount: 'animation-iteration-count',
			animationdirection: 'animation-direction',
			animationfillmode: 'animation-fill-mode',
			animationplaystate: 'animation-play-state',

			// Filter properties
			filter: 'filter',
			backdropfilter: 'backdrop-filter',

			// Outline properties
			outlinewidth: 'outline-width',
			outlinestyle: 'outline-style',
			outlinecolor: 'outline-color',
		};

		return fixes[property] || property;
	}
}
