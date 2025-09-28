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
