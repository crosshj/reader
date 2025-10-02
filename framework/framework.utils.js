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

/**
 * Color lookup utility for converting color names to hex values
 * @param {string} colorName - The color name (e.g., 'green500', 'amber800')
 * @returns {string} - The hex color value
 */
export const getColorHex = (colorName) => {
	// prettier-ignore
	const colorMap = {
		// Red colors
		red50: '#ffebee', red100: '#ffcdd2', red200: '#ef9a9a', red300: '#e57373',
		red400: '#ef5350', red500: '#f44336', red600: '#e53935', red700: '#d32f2f',
		red800: '#c62828', red900: '#b71c1c',
		redA100: '#ff8a80', redA200: '#ff5252', redA400: '#ff1744', redA700: '#d50000',

		// Pink colors
		pink50: '#fce4ec', pink100: '#f8bbd0', pink200: '#f48fb1', pink300: '#f06292',
		pink400: '#ec407a', pink500: '#e91e63', pink600: '#d81b60', pink700: '#c2185b',
		pink800: '#ad1457', pink900: '#880e4f',
		pinkA100: '#ff80ab', pinkA200: '#ff4081', pinkA400: '#f50057', pinkA700: '#c51162',

		// Purple colors
		purple50: '#f3e5f5', purple100: '#e1bee7', purple200: '#ce93d8', purple300: '#ba68c8',
		purple400: '#ab47bc', purple500: '#9c27b0', purple600: '#8e24aa', purple700: '#7b1fa2',
		purple800: '#6a1b9a', purple900: '#4a148c',
		purpleA100: '#ea80fc', purpleA200: '#e040fb', purpleA400: '#d500f9', purpleA700: '#aa00ff',

		// Deep Purple colors
		deepPurple50: '#ede7f6', deepPurple100: '#d1c4e9', deepPurple200: '#b39ddb',
		deepPurple300: '#9575cd', deepPurple400: '#7e57c2', deepPurple500: '#673ab7',
		deepPurple600: '#5e35b1', deepPurple700: '#512da8', deepPurple800: '#4527a0',
		deepPurple900: '#311b92',
		deepPurpleA100: '#b388ff', deepPurpleA200: '#7c4dff', deepPurpleA400: '#651fff',
		deepPurpleA700: '#6200ea',

		// Indigo colors
		indigo50: '#e8eaf6', indigo100: '#c5cae9', indigo200: '#9fa8da', indigo300: '#7986cb',
		indigo400: '#5c6bc0', indigo500: '#3f51b5', indigo600: '#3949ab', indigo700: '#303f9f',
		indigo800: '#283593', indigo900: '#1a237e',
		indigoA100: '#8c9eff', indigoA200: '#536dfe', indigoA400: '#3d5afe', indigoA700: '#304ffe',

		// Blue colors
		blue50: '#e3f2fd', blue100: '#bbdefb', blue200: '#90caf9', blue300: '#64b5f6',
		blue400: '#42a5f5', blue500: '#2196f3', blue600: '#1e88e5', blue700: '#1976d2',
		blue800: '#1565c0', blue900: '#0d47a1',
		blueA100: '#82b1ff', blueA200: '#448aff', blueA400: '#2979ff', blueA700: '#2962ff',

		// Light Blue colors
		lightBlue50: '#e1f5fe', lightBlue100: '#b3e5fc', lightBlue200: '#81d4fa',
		lightBlue300: '#4fc3f7', lightBlue400: '#29b6f6', lightBlue500: '#03a9f4',
		lightBlue600: '#039be5', lightBlue700: '#0288d1', lightBlue800: '#0277bd',
		lightBlue900: '#01579b',
		lightBlueA100: '#80d8ff', lightBlueA200: '#40c4ff', lightBlueA400: '#00b0ff',
		lightBlueA700: '#0091ea',

		// Cyan colors
		cyan50: '#e0f7fa', cyan100: '#b2ebf2', cyan200: '#80deea', cyan300: '#4dd0e1',
		cyan400: '#26c6da', cyan500: '#00bcd4', cyan600: '#00acc1', cyan700: '#0097a7',
		cyan800: '#00838f', cyan900: '#006064',
		cyanA100: '#84ffff', cyanA200: '#18ffff', cyanA400: '#00e5ff', cyanA700: '#00b8d4',

		// Teal colors
		teal50: '#e0f2f1', teal100: '#b2dfdb', teal200: '#80cbc4', teal300: '#4db6ac',
		teal400: '#26a69a', teal500: '#009688', teal600: '#00897b', teal700: '#00796b',
		teal800: '#00695c', teal900: '#004d40',
		tealA100: '#a7ffeb', tealA200: '#64ffda', tealA400: '#1de9b6', tealA700: '#00bfa5',

		// Green colors
		green50: '#e8f5e9', green100: '#c8e6c9', green200: '#a5d6a7', green300: '#81c784',
		green400: '#66bb6a', green500: '#4caf50', green600: '#43a047', green700: '#388e3c',
		green800: '#2e7d32', green900: '#1b5e20',
		greenA100: '#b9f6ca', greenA200: '#69f0ae', greenA400: '#00e676', greenA700: '#00c853',

		// Light Green colors
		lightGreen50: '#f1f8e9', lightGreen100: '#dcedc8', lightGreen200: '#c5e1a5',
		lightGreen300: '#aed581', lightGreen400: '#9ccc65', lightGreen500: '#8bc34a',
		lightGreen600: '#7cb342', lightGreen700: '#689f38', lightGreen800: '#558b2f',
		lightGreen900: '#33691e',
		lightGreenA100: '#ccff90', lightGreenA200: '#b2ff59', lightGreenA400: '#76ff03',
		lightGreenA700: '#64dd17',

		// Lime colors
		lime50: '#f9fbe7', lime100: '#f0f4c3', lime200: '#e6ee9c', lime300: '#dce775',
		lime400: '#d4e157', lime500: '#cddc39', lime600: '#c0ca33', lime700: '#afb42b',
		lime800: '#9e9d24', lime900: '#827717',
		limeA100: '#f4ff81', limeA200: '#eeff41', limeA400: '#c6ff00', limeA700: '#aeea00',

		// Yellow colors
		yellow50: '#fffde7', yellow100: '#fff9c4', yellow200: '#fff59d', yellow300: '#fff176',
		yellow400: '#ffee58', yellow500: '#ffeb3b', yellow600: '#fdd835', yellow700: '#fbc02d',
		yellow800: '#f9a825', yellow900: '#f57f17',
		yellowA100: '#ffff8d', yellowA200: '#ffff00', yellowA400: '#ffea00', yellowA700: '#ffd600',

		// Amber colors
		amber50: '#fff8e1', amber100: '#ffecb3', amber200: '#ffe082', amber300: '#ffd54f',
		amber400: '#ffca28', amber500: '#ffc107', amber600: '#ffb300', amber700: '#ffa000',
		amber800: '#ff8f00', amber900: '#ff6f00',
		amberA100: '#ffe57f', amberA200: '#ffd740', amberA400: '#ffc400', amberA700: '#ffab00',

		// Orange colors
		orange50: '#fff3e0', orange100: '#ffe0b2', orange200: '#ffcc80', orange300: '#ffb74d',
		orange400: '#ffa726', orange500: '#ff9800', orange600: '#fb8c00', orange700: '#f57c00',
		orange800: '#ef6c00', orange900: '#e65100',
		orangeA100: '#ffd180', orangeA200: '#ffab40', orangeA400: '#ff9100', orangeA700: '#ff6d00',

		// Deep Orange colors
		deepOrange50: '#fbe9e7', deepOrange100: '#ffccbc', deepOrange200: '#ffab91',
		deepOrange300: '#ff8a65', deepOrange400: '#ff7043', deepOrange500: '#ff5722',
		deepOrange600: '#f4511e', deepOrange700: '#e64a19', deepOrange800: '#d84315',
		deepOrange900: '#bf360c',
		deepOrangeA100: '#ff9e80', deepOrangeA200: '#ff6e40', deepOrangeA400: '#ff3d00',
		deepOrangeA700: '#dd2c00',

		// Brown colors
		brown50: '#efebe9', brown100: '#d7ccc8', brown200: '#bcaaa4', brown300: '#a1887f',
		brown400: '#8d6e63', brown500: '#795548', brown600: '#6d4c41', brown700: '#5d4037',
		brown800: '#4e342e', brown900: '#3e2723',

		// Grey colors
		grey50: '#fafafa', grey100: '#f5f5f5', grey200: '#eeeeee', grey300: '#e0e0e0',
		grey400: '#bdbdbd', grey500: '#9e9e9e', grey600: '#757575', grey700: '#616161',
		grey800: '#424242', grey900: '#212121',

		// Blue Grey colors
		blueGrey50: '#eceff1', blueGrey100: '#cfd8dc', blueGrey200: '#b0bec5',
		blueGrey300: '#90a4ae', blueGrey400: '#78909c', blueGrey500: '#607d8b',
		blueGrey600: '#546e7a', blueGrey700: '#455a64', blueGrey800: '#37474f',
		blueGrey900: '#263238',
	};

	return colorMap[colorName] || '#9e9e9e'; // Default to grey500 if not found
};

// Helper functions for conditional rendering
export function parseConditionalValue(value, state) {
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

	// Check if it's a color token that needs resolution
	const colorHex = getColorHex(cleanValue);
	if (colorHex !== '#9e9e9e' || cleanValue === 'grey500') {
		if (isDebug) {
			console.log('🐛 DEBUG color token resolved:', {
				originalValue: value,
				cleanValue: cleanValue,
				resolvedColor: colorHex,
			});
		}
		return colorHex;
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

export function extractStateReferences(attributes) {
	const stateRefs = new Set();

	Array.from(attributes).forEach((attr) => {
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
			// debugger;
			globalMatches.forEach((match) => {
				const stateKey = match.substring(7); // Remove 'global_' prefix
				stateRefs.add(stateKey);

				if (isDebug) {
					console.log('🐛 DEBUG will subscribe to state key:', stateKey);
				}
			});
		}
	});

	return Array.from(stateRefs);
}

// Function to transform x-markdown and x-table elements to use content attribute
function transformXMarkdownElements(htmlContent) {
	// First, temporarily replace markdown code blocks to avoid processing HTML tags inside them
	const codeBlockPlaceholder = '___CODE_BLOCK_PLACEHOLDER___';
	const codeBlockMatches = [];
	let tempContent = htmlContent;

	// Find and replace all markdown code blocks (```...```)
	const codeBlockRegex = /```[\s\S]*?```/g;
	tempContent = tempContent.replace(codeBlockRegex, (match) => {
		const index = codeBlockMatches.length;
		codeBlockMatches.push(match);
		return `${codeBlockPlaceholder}${index}`;
	});

	// Now process x-markdown elements in the content without code blocks
	let transformed = tempContent;
	const openTagRegex = /<x-markdown([^>]*)>/gi;

	let match;
	while ((match = openTagRegex.exec(tempContent)) !== null) {
		const openTag = match[0];
		const attributes = match[1];
		const startIndex = match.index;

		// Find the matching closing tag
		const nextClose = tempContent.indexOf(
			'</x-markdown>',
			startIndex + openTag.length
		);

		if (nextClose === -1) {
			// No closing tag found, skip this one
			continue;
		}

		const content = tempContent.substring(
			startIndex + openTag.length,
			nextClose
		);

		// Escape the content for use in HTML attribute
		const escapedContent = content
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;')
			.replace(/\n/g, '&#10;')
			.replace(/\r/g, '&#13;')
			.replace(/\t/g, '&#9;');

		// Replace this specific match
		const fullMatch = openTag + content + '</x-markdown>';
		const replacement = `<x-markdown${attributes} content="${escapedContent}"></x-markdown>`;
		transformed = transformed.replace(fullMatch, replacement);
	}

	// Restore code blocks
	transformed = transformed.replace(
		new RegExp(`${codeBlockPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return codeBlockMatches[parseInt(index)];
		}
	);

	// Match x-table elements with their content (only outside of x-markdown)
	// First, temporarily replace x-markdown content to avoid processing x-table inside it
	const markdownPlaceholder = '___MARKDOWN_PLACEHOLDER___';
	const markdownMatches = [];
	let tableContent = transformed;

	// Store x-markdown elements temporarily
	tableContent = tableContent.replace(
		/<x-markdown[^>]*content="[^"]*"[^>]*><\/x-markdown>/gi,
		(match) => {
			const index = markdownMatches.length;
			markdownMatches.push(match);
			return `${markdownPlaceholder}${index}`;
		}
	);

	// Process x-table elements in the content without x-markdown
	// Transform ALL x-table elements to use content attribute
	const xTableRegex = /<x-table([^>]*)>([\s\S]*?)<\/x-table>/gi;
	tableContent = tableContent.replace(
		xTableRegex,
		(match, attributes, content) => {
			// Escape the content for use in HTML attribute
			const escapedContent = content
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');

			// Return the transformed element with content attribute
			return `<x-table${attributes} content="${escapedContent}"></x-table>`;
		}
	);

	// Restore x-markdown elements
	transformed = tableContent.replace(
		new RegExp(`${markdownPlaceholder}(\\d+)`, 'g'),
		(match, index) => {
			return markdownMatches[parseInt(index)];
		}
	);

	return transformed;
}

// Function to clean HTML content from server
export function cleanServerHTML(htmlContent) {
	// Remove Vite's injected script tags
	let cleaned = htmlContent.replace(
		/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any other Vite-related script injections
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*vite[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any script tags that might be injected by build tools
	cleaned = cleaned.replace(
		/<script[^>]*src="[^"]*\/src\/[^"]*"[^>]*>[\s\S]*?<\/script>/gi,
		''
	);

	// Remove any link tags that might be injected by build tools
	cleaned = cleaned.replace(/<link[^>]*rel="modulepreload"[^>]*>/gi, '');

	// Clean up any extra whitespace that might be left
	cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

	// Transform x-markdown elements to use content attribute
	cleaned = transformXMarkdownElements(cleaned);

	return cleaned;
}
