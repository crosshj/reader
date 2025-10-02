// Function to transform x-markdown and x-table elements to use content attribute
function transformXMarkdownElements(htmlContent) {
	// Match x-markdown elements with their content
	const xMarkdownRegex = /<x-markdown([^>]*)>([\s\S]*?)<\/x-markdown>/gi;
	let transformed = htmlContent.replace(
		xMarkdownRegex,
		(match, attributes, content) => {
			// Escape the content for use in HTML attribute
			const escapedContent = content
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
				.replace(/\n/g, '&#10;')
				.replace(/\r/g, '&#13;')
				.replace(/\t/g, '&#9;');

			// Return the transformed element with content attribute
			return `<x-markdown${attributes} content="${escapedContent}"></x-markdown>`;
		}
	);

	// Match x-table elements with their content (only outside of x-markdown)
	// First, temporarily replace x-markdown content to avoid processing x-table inside it
	const markdownPlaceholder = '___MARKDOWN_PLACEHOLDER___';
	const markdownMatches = [];
	let tempContent = transformed;

	// Store x-markdown elements temporarily
	tempContent = tempContent.replace(
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
	tempContent = tempContent.replace(
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
	transformed = tempContent.replace(
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
