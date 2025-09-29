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
		this.renderMarkdown();
		// Apply sx: styles
		this.applySxStyles();
	}

	renderMarkdown() {
		const originalContent = this.innerHTML;
		const content = originalContent.trim();
		if (!content) {
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
				return html` <x-typography variant="h${depth}" sx:mt="5" sx:mb="1">
					${text}
				</x-typography>`;
			},

			// paragraph({ tokens }) {
			// 	const text = this.parser.parse(tokens);
			// 	return html`<x-typography variant="body1" sx:my="2" sx:mx="0">${text}</x-typography>`;
			// },

			blockquote({ tokens }) {
				const text = this.parser.parse(tokens);
				return html`<x-typography variant="blockquote" sx:my="2" sx:mx="0"
					>${text}</x-typography
				>`;
			},

			strong({ tokens }) {
				const text = this.parser.parseInline(tokens);
				return html`<x-typography variant="strong" sx:my="2" sx:mx="0"
					>${text}</x-typography
				>`;
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
		};

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
