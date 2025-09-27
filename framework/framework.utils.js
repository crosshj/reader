/**
 * Tagged template literal for HTML generation.
 * @param {TemplateStringsArray} strings
 * @param {...any} values
 * @returns {string}
 */
export const html = (strings, ...values) => {
	let result = '';
	for (let i = 0; i < strings.length; i++) {
		result += strings[i];
		if (i < values.length) {
			result += values[i];
		}
	}
	return result;
};

// Helper functions for conditional rendering
function parseConditionalValue(value, state) {
	if (typeof value !== 'string') return value;

	// Handle null/undefined state
	if (!state) return value;

	// Check for DEBUG prefix
	const isDebug = value.startsWith('DEBUG ');
	const cleanValue = isDebug ? value.substring(6) : value;

	if (isDebug) {
		console.log('🐛 DEBUG parseConditionalValue:', {
			originalValue: value,
			cleanValue: cleanValue,
			currentState: state,
		});
	}

	// Check if it's a simple comparison (WHEN ... IS ... THEN ... ELSE ...)
	const comparisonMatch = cleanValue.match(
		/^WHEN\s+(.+?)\s+IS\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+)$/
	);
	if (comparisonMatch) {
		const [, leftSide, rightSide, thenValue, elseValue] = comparisonMatch;
		const comparisonResult = evaluateComparison(
			leftSide,
			rightSide,
			state,
			isDebug
		);
		const rawResult = comparisonResult ? thenValue : elseValue;
		// Strip quotes from the result
		const result = rawResult.replace(/^['"]|['"]$/g, '');

		if (isDebug) {
			console.log('🐛 DEBUG comparison evaluation:', {
				leftSide,
				rightSide,
				thenValue,
				elseValue,
				comparisonResult,
				rawResult,
				result,
				resolvedValue: result,
			});
		}

		return result;
	}

	// Check if it's a conditional expression (WHEN ... THEN ... ELSE ...)
	const conditionalMatch = cleanValue.match(
		/^WHEN\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+)$/
	);
	if (conditionalMatch) {
		const [, condition, thenValue, elseValue] = conditionalMatch;
		const rawResult = evaluateCondition(condition, state)
			? thenValue
			: elseValue;
		// Strip quotes from the result
		const result = rawResult.replace(/^['"]|['"]$/g, '');

		if (isDebug) {
			console.log('🐛 DEBUG conditional evaluation:', {
				condition,
				thenValue,
				elseValue,
				rawResult,
				result,
				conditionResult: evaluateCondition(condition, state),
				resolvedValue: result,
			});
		}

		return result;
	}

	if (isDebug) {
		console.log(
			'🐛 DEBUG no conditional pattern matched, returning original value'
		);
	}

	return value;
}

function evaluateCondition(condition, state) {
	// Handle null/undefined state
	if (!state) return false;

	// Handle global_ prefixed state references
	const stateRef = condition.trim();
	if (stateRef.startsWith('global_')) {
		const stateKey = stateRef.substring(7);
		return !!state[stateKey];
	}
	return !!state[stateRef];
}

function evaluateComparison(leftSide, rightSide, state, isDebug = false) {
	// Handle null/undefined state
	if (!state) return false;

	// Handle global_ prefixed state references
	const leftValue = leftSide.trim().startsWith('global_')
		? state[leftSide.trim().substring(7)]
		: leftSide.trim();

	// For right side, check if it's a template variable (contains {{}})
	// If so, we can't evaluate it here - return false for now
	// The x-map component should handle this after template processing
	if (rightSide.includes('{{') && rightSide.includes('}}')) {
		if (isDebug) {
			console.log(`⚠️ Template variable detected in comparison: ${rightSide}`);
		}
		return false;
	}

	const rightValue = rightSide.trim().startsWith('global_')
		? state[rightSide.trim().substring(7)]
		: rightSide.trim();

	const result = leftValue === rightValue;

	// Only log comparison details when debug is active
	if (isDebug) {
		console.log(
			`🔍 Comparison: ${leftSide} (${JSON.stringify(leftValue)}) IS ${rightSide} (${JSON.stringify(rightValue)}) = ${result}`
		);
	}

	return result;
}

function extractStateReferences(attributes) {
	const stateRefs = new Set();

	Array.from(attributes).forEach((attr) => {
		if (
			attr.name.startsWith('sx:') ||
			attr.name === 'className' ||
			attr.name === 'class'
		) {
			const value = attr.value;
			const isDebug = value.startsWith('DEBUG ');

			if (isDebug) {
				console.log('🐛 DEBUG extractStateReferences found DEBUG attribute:', {
					attributeName: attr.name,
					attributeValue: value,
					element: attr.ownerElement?.tagName,
				});
			}

			// Find global_ references in the value
			const globalMatches = value.match(/global_(\w+)/g);
			if (globalMatches) {
				globalMatches.forEach((match) => {
					const stateKey = match.substring(7); // Remove 'global_' prefix
					stateRefs.add(stateKey);

					if (isDebug) {
						console.log('🐛 DEBUG will subscribe to state key:', stateKey);
					}
				});
			}
		}
	});

	return Array.from(stateRefs);
}

/**
 * Base UI Component class with common utilities
 * All x- components should extend from this base class
 */
export class BaseUIComponent extends HTMLElement {
	constructor() {
		super();
		this.stateSubscriptions = new Map(); // Map of stateKey -> unsubscribe function
		this.initialState = null;
	}

	connectedCallback() {
		// Store initial state for conditional rendering
		this.initialState = this.getCurrentState();

		// Set up state subscriptions for conditional attributes
		this.setupStateSubscriptions();

		// Apply initial styles and classes
		this.applySxStyles();
		this.applyConditionalClasses();
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

	setupStateSubscriptions() {
		const stateRefs = extractStateReferences(this.attributes);

		stateRefs.forEach((stateKey) => {
			if (typeof window !== 'undefined' && window.subscribeToState) {
				const unsubscribe = window.subscribeToState(stateKey, () => {
					this.handleStateChange();
				});
				this.stateSubscriptions.set(stateKey, unsubscribe);
			}
		});
	}

	handleStateChange() {
		// Update state and re-apply conditional rendering
		this.initialState = this.getCurrentState();
		this.applySxStyles();
		this.applyConditionalClasses();
	}

	applyConditionalClasses() {
		// Handle className and class attributes with conditional syntax
		const classNameAttr = this.getAttribute('className');
		const classAttr = this.getAttribute('class');

		if (classNameAttr) {
			const isDebug = classNameAttr.startsWith('DEBUG ');
			if (isDebug) {
				console.log('🐛 DEBUG applyConditionalClasses className:', {
					element: this.tagName,
					originalValue: classNameAttr,
					currentState: this.initialState,
				});
			}

			const resolvedClassName = parseConditionalValue(
				classNameAttr,
				this.initialState
			);
			this.className = resolvedClassName;
			// Update the attribute value to show the resolved value
			this.setAttribute('className', resolvedClassName);

			if (isDebug) {
				console.log('🐛 DEBUG className resolved:', {
					original: classNameAttr,
					resolved: resolvedClassName,
					appliedToElement: this.className,
				});
			}
		}

		if (classAttr) {
			const isDebug = classAttr.startsWith('DEBUG ');
			if (isDebug) {
				console.log('🐛 DEBUG applyConditionalClasses class:', {
					element: this.tagName,
					originalValue: classAttr,
					currentState: this.initialState,
				});
			}

			const resolvedClass = parseConditionalValue(classAttr, this.initialState);
			this.className = resolvedClass;
			// Update the attribute value to show the resolved value
			this.setAttribute('class', resolvedClass);

			if (isDebug) {
				console.log('🐛 DEBUG class resolved:', {
					original: classAttr,
					resolved: resolvedClass,
					appliedToElement: this.className,
				});
			}
		}
	}

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
				const cssValue = parseConditionalValue(attr.value, this.initialState);

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
