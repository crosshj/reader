import { BaseUIComponent } from './BaseUIComponent.js';
import { marked } from '../vendor/marked.mjs';
import { getColorHex, html } from '../framework.utils.js';
import './XMarkdown.css';

// Define x-markdown web component
export class XMarkdown extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Call parent connectedCallback first to handle sx: styles
		super.connectedCallback();

		this.renderMarkdown();
	}

	renderMarkdown() {
		// Get content from the content attribute or fallback to innerHTML
		let content = this.getAttribute('content') || this.innerHTML;

		// If content came from attribute, decode the escaped characters
		if (this.getAttribute('content')) {
			content = content
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/&#10;/g, '\n')
				.replace(/&#13;/g, '\r')
				.replace(/&#9;/g, '\t');
		}

		const originalContent = content;
		if (!content.trim()) {
			this.innerHTML = '';
			return;
		}

		try {
			// Remove common indentation from all lines
			const dedentedContent = this.dedentContent(originalContent);

			// Unescape HTML entities that break markdown parsing
			const unescapedContent = this.unescapeHtmlEntities(dedentedContent);

			// Parse markdown with marked.js using custom renderer
			const html = this.parseWithCustomRenderer(unescapedContent);
			this.innerHTML = html;

			// Clear the content attribute after processing
			if (this.getAttribute('content')) {
				this.removeAttribute('content');
			}
		} catch (error) {
			console.error('Failed to parse markdown:', error);
			// Fallback to original content if parsing fails
			this.innerHTML = content;
		}
	}

	dedentContent(content) {
		const lines = content.split('\n');
		if (lines.length === 0) return content;

		// Find the base indentation pattern from the first non-empty line
		let baseIndentPattern = '';
		for (const line of lines) {
			if (line.trim() === '') continue; // Skip empty lines
			const match = line.match(/^(\s*)/);
			baseIndentPattern = match[1];
			break;
		}

		// If no indentation found, return original content
		if (baseIndentPattern === '') return content;

		// Remove the base indentation pattern from all lines
		return lines
			.map((line) => {
				// For empty lines, keep them as-is
				if (line.trim() === '') return line;

				// For non-empty lines, remove the base indentation pattern
				if (line.startsWith(baseIndentPattern)) {
					return line.substring(baseIndentPattern.length);
				}
				return line; // Keep lines that don't start with this pattern as-is
			})
			.join('\n');
	}

	unescapeHtmlEntities(content) {
		// Common HTML entities that break markdown parsing
		const entities = {
			'&gt;': '>',
			'&lt;': '<',
			'&amp;': '&',
			'&quot;': '"',
			'&#39;': "'",
			'&nbsp;': ' ',
		};

		let unescaped = content;
		for (const [entity, char] of Object.entries(entities)) {
			unescaped = unescaped.replace(new RegExp(entity, 'g'), char);
		}

		return unescaped;
	}

	parseWithCustomRenderer(content) {
		const renderer = {
			heading({ tokens, depth }) {
				const text = this.parser.parseInline(tokens);
				return html` <x-typography
					variant="h${depth}"
					sx:mt="5"
					sx:mb="1"
					sx:display="inline-block"
				>
					${text}
				</x-typography>`;
			},

			// paragraph({ tokens }) {
			// 	const text = this.parser.parse(tokens);
			// 	return html`<x-typography variant="body1" sx:my="2" sx:mx="0">${text}</x-typography>`;
			// },

			blockquote({ tokens }) {
				const text = this.parser.parse(tokens);
				// Remove <p> tags from blockquote content
				const cleanText = text.replace(/<p>/g, '').replace(/<\/p>/g, '');
				return html`<x-typography variant="blockquote" sx:my="2" sx:mx="0"
					>${cleanText}</x-typography
				>`;
			},

			strong({ tokens }) {
				const text = this.parser.parseInline(tokens);
				return html`<x-typography variant="strong">${text}</x-typography>`;
			},

			link({ href, title, tokens }) {
				const text = this.parser.parseInline(tokens);
				const t = title ? ` title="${title}"` : '';
				return html`<x-link href="${href}" ${t}>${text}</x-link>`;
			},

			tablecell({ tokens, align }) {
				const text = this.parser.parseInline(tokens);

				// Replace all instances of icon syntax: icon:IconName;color (backticks optional)
				const iconRegex = /`?icon:([^;]+);([^`\s]+)`?/g;
				const replacedText = text.replace(
					iconRegex,
					(match, iconName, color) => {
						const hexColor = getColorHex(color.trim());
						return html`<x-icon
							icon="${iconName}"
							sx:color="${hexColor}"
							size="large"
						></x-icon>`;
					}
				);

				// Return the complete td element with alignment
				const alignAttr = align ? ` style="text-align: ${align}"` : '';
				return html`<td${alignAttr}>${replacedText}</td>`;
			},

			// listitem renderer removed - using list renderer instead

			// Alternative approach: Handle task lists in the list renderer
			list({ items, ordered, start }) {
				const listType = ordered ? 'ol' : 'ul';
				const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';

				// Check if any items are task items
				const hasTaskItems = items.some((item) => item.task === true);

				return html`<${listType}${startAttr} style="padding-left: 0;">
					${items
						.map((item, index) => {
							// Determine icon and styling based on list type
							let iconName, iconSize, textStyle;

							if (ordered) {
								// Ordered list - use numbers
								const itemNumber = start ? start + index : index + 1;
								return html`<li
									style="display: flex; align-items: flex-start; margin: 0.25rem 0; padding-left: 0;"
								>
									<span
										style="color: var(--palettePrimaryMain); font-weight: 600; margin-right: 0.75rem; flex-shrink: 0; min-width: 1.5rem; text-align: right; font-family: 'Courier New', 'Monaco', 'Menlo', monospace; position: relative;"
									>
										${itemNumber}
									</span>
									<span>${this.parser.parseInline(item.tokens)}</span>
								</li>`;
							}

							// Determine icon and styling for unordered/task lists
							if (item.task === true || (hasTaskItems && item.task === false)) {
								// Task list - use checkboxes
								iconName = item.checked ? 'fa-check-square-o' : 'fa-square-o';
								iconSize = '1em';
								textStyle = `opacity: ${item.checked ? '0.7' : '1'}; color: ${item.checked ? 'var(--paletteTextSecondary)' : 'var(--paletteTextPrimary)'};`;
							} else {
								// Unordered list - use circle bullets
								iconName = 'fa-circle';
								iconSize = '8px';
								textStyle = 'color: var(--paletteTextPrimary);';
							}

							// Render icon-based list item (task lists and unordered lists)
							return html`<li
								style="display: flex; align-items: center; margin: 0.25rem 0; padding-left: 0;"
							>
								<div
									style="min-width: 1.5rem; margin-right: 0.75rem; flex-shrink: 0; text-align: right; display: flex; align-items: center; justify-content: flex-end;"
								>
									<i
										class="fa ${iconName}"
										style="color: var(--palettePrimaryMain); font-size: ${iconSize}; ${iconName ===
										'fa-check-square-o'
											? 'margin-right: -0.1em;'
											: ''}"
									></i>
								</div>
								<span style="${textStyle}">
									${this.parser.parseInline(item.tokens)}
								</span>
							</li>`;
						})
						.join('')}
				</${listType}>`;
			},
		};

		// Enable GFM (GitHub Flavored Markdown) for checkbox lists and other features
		marked.setOptions({
			gfm: true,
			breaks: false,
			pedantic: false,
		});

		// Debug logging removed

		marked.use({ renderer });
		return marked.parse(content);
	}

	sanitizeHTML(html) {
		// Create a temporary div to parse HTML
		const temp = document.createElement('div');
		temp.innerHTML = html;

		// Remove script tags and event handlers
		const scripts = temp.querySelectorAll('script');
		scripts.forEach((script) => script.remove());

		// Remove event handlers from all elements
		const allElements = temp.querySelectorAll('*');
		allElements.forEach((el) => {
			// Remove common event handlers
			const events = [
				'onclick',
				'onload',
				'onerror',
				'onmouseover',
				'onmouseout',
			];
			events.forEach((event) => {
				el.removeAttribute(event);
			});
		});

		return temp.innerHTML;
	}
}
