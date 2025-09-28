// Framework.js - Module for loading web components and fragments
import { BaseUIComponent, html } from './framework.utils.js';
import {
	register,
	getState,
	setState,
	initializeCore,
	subscribeToState,
} from './framework.core.js';

// Import existing web components
import { registerAllWebComponents } from '../src/web-components.js';

// Base class for all system elements
class SystemElement extends HTMLElement {
	constructor() {
		super();
		this.unregister = register({
			type: this.tagName.toLowerCase(),
			attributes: this.getAllAttributes(),
			body: this.textContent.trim(),
		});
	}

	getAllAttributes() {
		const attributes = {};
		for (let i = 0; i < this.attributes.length; i++) {
			const attr = this.attributes[i];
			attributes[attr.name] = attr.value;
		}
		return attributes;
	}

	disconnectedCallback() {
		if (this.unregister) {
			this.unregister();
		}
	}
}

// Individual classes for each component type
class XData extends SystemElement {}
class XSubscribe extends SystemElement {}
class XFlow extends SystemElement {}

// Define x-page web component
class XPage extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-navbar web component
class XNavbar extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		// Subscribe to activePath changes to update the title
		this.unsubscribe = subscribeToState('activePath', () => {
			this.updateTitle();
		});

		// Set initial title
		this.updateTitle();

		// Apply sx: styles if any
		this.applySxStyles();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	updateTitle() {
		const activePath = getState('activePath') || '';
		let title = 'Navigation';

		// Map activePath to display title
		if (activePath === '/' || activePath === '') {
			title = 'Home';
		} else if (activePath === '/issues') {
			title = 'Issues';
		} else if (activePath === '/wiki') {
			title = 'Wiki';
		} else if (activePath === '/files') {
			title = 'Files';
		} else if (activePath === '/settings') {
			title = 'Settings';
		} else if (activePath.startsWith('/')) {
			// Extract title from path for other pages
			const pathName = activePath.substring(1); // Remove leading slash
			title = pathName.charAt(0).toUpperCase() + pathName.slice(1);
		}

		// Store the original content for the right side actions
		const originalContent = this.innerHTML;

		// Create navbar structure with dark grey header
		this.innerHTML = html`
			<div class="navbar-header">
				<x-typography variant="h1"> ${title} </x-typography>
				<div class="navbar-right">
					<div class="navbar-actions">${originalContent}</div>
				</div>
			</div>
		`;
	}
}

// Define x-content web component
class XContent extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-box web component
class XBox extends BaseUIComponent {
	constructor() {
		super();
	}
}

// Define x-button web component
class XButton extends BaseUIComponent {
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

// Define x-typography web component
class XTypography extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Set display: block for typography elements
		this.style.display = 'block';
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

// Define x-page-fragment web component
class XPageFragment extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		// Apply sx: styles if any
		this.applySxStyles();
	}
}

// Define x-link web component
class XLink extends HTMLElement {
	constructor() {
		super();
	}

	connectedCallback() {
		const href = this.getAttribute('href');
		const underline = this.getAttribute('underline');

		// Create a link element
		const link = document.createElement('a');
		link.href = href ? `#${href}` : '#';
		link.innerHTML = this.innerHTML;

		// Apply underline styling
		if (underline === 'none') {
			link.style.textDecoration = 'none';
		}

		// Listen for hash changes to update centralized state
		link.addEventListener('click', () => {
			// Update centralized state when clicked
			if (href) {
				setState('currentPath', href);
				// Dispatch navigation event
				window.dispatchEvent(
					new CustomEvent('navigate', {
						detail: { path: href },
					})
				);
			}
		});

		this.innerHTML = '';
		this.appendChild(link);
	}
}

// Define x-map web component
class XMap extends HTMLElement {
	constructor() {
		super();
		// Add instance tracking for debugging
		if (!XMap.instanceCount) {
			XMap.instanceCount = 0;
		}
		XMap.instanceCount++;
		this.instanceId = XMap.instanceCount;
		this.unsubscribe = null;
	}

	connectedCallback() {
		const items = this.getAttribute('items');

		// Check if already processed to prevent multiple renders
		if (this.hasAttribute('data-processed')) {
			return;
		}

		// Mark as processed
		this.setAttribute('data-processed', 'true');

		// Hide the initial children (they are the template)
		this.style.display = 'none';

		// Store the template for later use
		this.template = this.innerHTML;

		// Clear the initial content since it's just a template
		this.innerHTML = '';

		// Process the data if available
		this.processData(items);

		// Subscribe to activePath changes to re-render menu items
		this.unsubscribe = subscribeToState('activePath', () => {
			this.processData(items);
		});
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}

	processData(dataPath) {
		if (!dataPath) {
			console.warn(`x-map #${this.instanceId}: no items attribute provided`);
			return;
		}

		// Get the data from global state or window
		// Handle both direct paths and global_ prefixed paths
		let data = null;
		let actualPath = dataPath;

		// Remove global_ prefix if present
		if (dataPath.startsWith('global_')) {
			actualPath = dataPath.substring(7); // Remove 'global_' prefix
		}

		// Try to get data from the centralized state management first
		data = getState(actualPath);

		// Fallback to old method for backward compatibility
		if (!data && window.state && window.state[actualPath]) {
			data = window.state[actualPath];
		} else if (!data && window[actualPath]) {
			data = window[actualPath];
		}

		if (!data) {
			console.warn(
				`x-map #${this.instanceId}: data not found for path: ${dataPath} (tried: ${actualPath})`
			);
			return;
		}

		if (!Array.isArray(data)) {
			console.warn(
				`x-map #${this.instanceId}: data is not an array: ${dataPath}`
			);
			return;
		}

		// Clear any previous content (idempotent behavior)
		this.innerHTML = '';

		// Create actual web component instances instead of HTML strings
		data.forEach((item, index) => {
			const processedTemplate = this.processTemplate(
				this.template,
				item,
				index
			);

			// Create a temporary container to parse the HTML
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = processedTemplate;

			// Move all child nodes to the x-map element
			while (tempDiv.firstChild) {
				this.appendChild(tempDiv.firstChild);
			}
		});

		// Show the component now that it has content
		this.style.removeProperty('display');
	}

	processTemplate(template, item, index) {
		let processedTemplate = template;

		// Replace template variables with item data
		// Handle {{item_property}} and {{ item_property }} syntax (with or without spaces)
		processedTemplate = processedTemplate.replace(
			/\{\{\s*item_([^}]+)\s*\}\}/g,
			(match, property) => {
				// Trim any whitespace from the property name
				const cleanProperty = property.trim();
				const value = item[cleanProperty] || '';
				return value;
			}
		);

		// Handle {{index}} for array index
		processedTemplate = processedTemplate.replace(/\{\{index\}\}/g, index);

		// Process {{#if}} conditionals
		processedTemplate = processedTemplate.replace(
			/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
			(match, condition, content) => {
				// Evaluate the condition
				const conditionValue = this.evaluateCondition(condition.trim(), item);
				return conditionValue ? content : '';
			}
		);

		// Process {{#each}} loops
		processedTemplate = processedTemplate.replace(
			/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
			(match, arrayProperty, content) => {
				const property = arrayProperty.trim();
				let arrayValue;

				// Handle item_property syntax
				if (property.startsWith('item_')) {
					const prop = property.substring(5);
					arrayValue = item[prop];
				} else {
					arrayValue = item[property];
				}

				if (!Array.isArray(arrayValue)) {
					return '';
				}

				// Process each item in the array
				return arrayValue
					.map((arrayItem, index) => {
						// Replace {{ this }} with the current array item
						let processedContent = content.replace(
							/\{\{\s*this\s*\}\}/g,
							arrayItem
						);
						// Process any other template variables in the content
						return this.processTemplate(processedContent, arrayItem, index);
					})
					.join('');
			}
		);

		// Process conditional classes after template variables are replaced
		processedTemplate = processedTemplate.replace(
			/class="WHEN\s+(.+?)\s+IS\s+(.+?)\s+THEN\s+(.+?)\s+ELSE\s+(.+?)"/g,
			(match, leftSide, rightSide, thenValue, elseValue) => {
				// Get current state
				const state = window.state || {};

				// Evaluate the comparison
				const leftValue = leftSide.trim().startsWith('global_')
					? state[leftSide.trim().substring(7)]
					: leftSide.trim();

				let rightValue = rightSide.trim();

				const result = leftValue === rightValue;
				// Strip quotes from the values and use the result
				const cleanThenValue = thenValue.replace(/^['"]|['"]$/g, '');
				const cleanElseValue = elseValue.replace(/^['"]|['"]$/g, '');
				const className = result ? cleanThenValue : cleanElseValue;

				return `class="${className}"`;
			}
		);

		return processedTemplate;
	}

	evaluateCondition(condition, item) {
		// Handle simple property checks like "item_listItems"
		if (condition.startsWith('item_')) {
			const property = condition.substring(5); // Remove "item_" prefix
			const value = item[property];

			// Check if it's truthy (exists and not empty)
			if (Array.isArray(value)) {
				return value.length > 0;
			}
			return !!value;
		}

		// Handle direct property checks
		const value = item[condition];
		if (Array.isArray(value)) {
			return value.length > 0;
		}
		return !!value;
	}
}

// Define x-icon web component
class XIcon extends BaseUIComponent {
	constructor() {
		super();
	}

	connectedCallback() {
		const icon = this.getAttribute('icon');
		const color = this.getAttribute('color');
		const size = this.getAttribute('size') || 'medium';

		// Only replace content if this is a standalone icon (not inside a button)
		const isInsideButton = this.closest('x-button');
		if (!isInsideButton) {
			// Create icon element with Font Awesome class
			const iconElement = document.createElement('span');
			iconElement.className = `fa fa-${this.convertToFontAwesome(icon)} ${size}`;

			// Set consistent dimensions and alignment
			iconElement.style.display = 'inline-flex';
			iconElement.style.alignItems = 'center';
			iconElement.style.justifyContent = 'center';
			iconElement.style.width = '1.2em';
			iconElement.style.height = '1.2em';
			iconElement.style.flexShrink = '0';

			if (color) {
				iconElement.style.color = color;
			}

			this.innerHTML = '';
			this.appendChild(iconElement);
		} else {
			// If inside a button, just hide the x-icon element
			// The button will handle the icon rendering
			this.style.display = 'none';
		}

		// Apply sx: styles if any
		this.applySxStyles();
	}

	convertToFontAwesome(pascalCaseName) {
		if (!pascalCaseName) return 'help';

		// Convert PascalCase to Material Symbols naming convention
		// Home -> home
		// ListAlt -> list
		// MenuBook -> menu_book
		// DriveFolderUpload -> folder_upload
		// AccountTree -> settings
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

// Define x-fragment web component
class XFragment extends BaseUIComponent {
	constructor() {
		super();
		this.unsubscribe = null;
	}

	connectedCallback() {
		const contents = this.getAttribute('contents');
		const showLoading = this.getAttribute('showLoading') !== 'false';

		if (!contents) {
			console.warn('x-fragment: no contents attribute provided');
			return;
		}

		// Remove global_ prefix if present
		const actualPath = contents.startsWith('global_')
			? contents.substring(7)
			: contents;

		// Subscribe to changes in the content
		this.unsubscribe = subscribeToState(actualPath, (eventDetail) => {
			this.updateContent(eventDetail.newValue, showLoading);
		});

		// Set initial content
		const initialContent = getState(actualPath);
		this.updateContent(initialContent, showLoading);

		// Apply sx: styles
		this.applySxStyles();
	}

	updateContent(content, showLoading) {
		if (!content) {
			if (showLoading) {
				this.innerHTML = html`
					<div
						style="display: flex; align-items: center; justify-content: center; height: 100%;"
					>
						<div
							style="width: 40px; height: 40px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"
						></div>
					</div>
				`;
			} else {
				this.innerHTML = '';
			}
			return;
		}

		// If content is a string, treat it as HTML
		if (typeof content === 'string') {
			// Clean the content to extract only the body content
			const cleanedContent = this.cleanHTMLContent(content);
			this.innerHTML = cleanedContent;
		} else {
			// If content is an object or other type, stringify it
			this.innerHTML = html`<pre>${JSON.stringify(content, null, 2)}</pre>`;
		}
	}

	cleanHTMLContent(htmlContent) {
		// Remove DOCTYPE, html, head tags and extract only body content
		let cleaned = htmlContent
			.replace(/<!DOCTYPE[^>]*>/gi, '')
			.replace(/<html[^>]*>/gi, '')
			.replace(/<\/html>/gi, '')
			.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
			.replace(/<body[^>]*>/gi, '')
			.replace(/<\/body>/gi, '');

		// Remove any script tags that might cause issues
		cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

		// Remove any style tags that might affect the page
		cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

		// Clean up any extra whitespace
		cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

		return cleaned.trim();
	}

	disconnectedCallback() {
		if (this.unsubscribe) {
			this.unsubscribe();
		}
	}
}

// Define x-include web component
class XInclude extends BaseUIComponent {
	constructor() {
		super();
		// Add a static counter to track instances
		if (!XInclude.instanceCount) {
			XInclude.instanceCount = 0;
		}
		XInclude.instanceCount++;
		this.instanceId = XInclude.instanceCount;
	}

	// Helper function to resolve relative paths
	resolvePath(href, basePath) {
		if (
			href.startsWith('http://') ||
			href.startsWith('https://') ||
			href.startsWith('/')
		) {
			// Absolute URL or absolute path - use as is
			return href;
		}

		// Relative path - resolve against base path
		const baseDir = basePath.substring(0, basePath.lastIndexOf('/') + 1);
		return baseDir + href;
	}

	// Helper function to get the current page path
	getCurrentPagePath() {
		// Check if we have a centralized state with current page path
		const currentPath = getState('currentPath');
		if (currentPath) {
			return currentPath;
		}

		// Fallback: try to get from the URL or default to fragments root
		const url = new URL(window.location.href);
		const pathname = url.pathname;

		// If we're loading a file directly (like standard.html),
		// we need to determine the correct base path
		if (pathname.endsWith('.html')) {
			// If it's a file in fragments/, use that directory
			if (pathname.includes('fragments/')) {
				return pathname.substring(pathname.indexOf('fragments/'));
			}
			// If it's a test file or other file, assume fragments/ is the base
			return 'fragments/';
		}

		// For directory paths, use as is
		if (pathname.includes('fragments/')) {
			return pathname.substring(pathname.indexOf('fragments/'));
		}

		return 'fragments/';
	}

	async connectedCallback() {
		const href = this.getAttribute('href');
		if (!href) {
			console.warn('x-include: no href attribute provided');
			return;
		}

		// Set background color as a style attribute on the x-include element
		this.setAttribute(
			'style',
			'background-color: var(--palettePrimaryMain, #1976d2);'
		);

		try {
			// Resolve the path relative to the current page
			const currentPagePath = this.getCurrentPagePath();
			const resolvedPath = this.resolvePath(href, currentPagePath);

			const response = await fetch(resolvedPath);
			if (!response.ok) {
				throw new Error(
					`Failed to load include: ${response.status} ${response.statusText}`
				);
			}
			const content = await response.text();
			const cleanedContent = cleanServerHTML(content);

			// Just update innerHTML - the browser handles the rest
			this.innerHTML = cleanedContent;

			// Apply sx: styles if any
			this.applySxStyles();
		} catch (error) {
			console.error('Error loading include:', error);
			this.innerHTML = html`<div style="padding: 20px; color: red;">
				Error loading include: ${error.message}
			</div>`;
		}
	}
}

// Register all web components
function registerFrameworkComponents() {
	// Register existing web components
	registerAllWebComponents();

	// Register x- prefixed components
	if (!customElements.get('x-flow')) {
		customElements.define('x-flow', XFlow);
	}

	if (!customElements.get('x-page')) {
		customElements.define('x-page', XPage);
	}

	if (!customElements.get('x-navbar')) {
		customElements.define('x-navbar', XNavbar);
	}

	if (!customElements.get('x-content')) {
		customElements.define('x-content', XContent);
	}

	if (!customElements.get('x-box')) {
		customElements.define('x-box', XBox);
	}

	if (!customElements.get('x-button')) {
		customElements.define('x-button', XButton);
	}

	if (!customElements.get('x-typography')) {
		customElements.define('x-typography', XTypography);
	}

	if (!customElements.get('x-include')) {
		customElements.define('x-include', XInclude);
	}

	if (!customElements.get('x-page-fragment')) {
		customElements.define('x-page-fragment', XPageFragment);
	}

	if (!customElements.get('x-link')) {
		customElements.define('x-link', XLink);
	}

	if (!customElements.get('x-map')) {
		customElements.define('x-map', XMap);
	}

	if (!customElements.get('x-icon')) {
		customElements.define('x-icon', XIcon);
	}

	if (!customElements.get('x-data')) {
		customElements.define('x-data', XData);
	}

	if (!customElements.get('x-subscribe')) {
		customElements.define('x-subscribe', XSubscribe);
	}

	if (!customElements.get('x-fragment')) {
		customElements.define('x-fragment', XFragment);
	}
}

// Function to clean HTML content from server
function cleanServerHTML(htmlContent) {
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

	return cleaned;
}

// Function to load and replace body content
export async function loadFragment(fragmentPath) {
	try {
		// Initialize core if not already done
		initializeCore();

		// Set the current page path for relative path resolution
		setState('currentPath', fragmentPath);

		const response = await fetch(fragmentPath);
		if (!response.ok) {
			throw new Error(`Failed to load fragment: ${response.status}`);
		}
		const content = await response.text();
		const cleanedContent = cleanServerHTML(content);
		document.body.innerHTML = cleanedContent;

		// Flows will execute themselves based on their own attributes and state
		// No manual execution needed - they handle their own lifecycle
	} catch (error) {
		console.error('Error loading fragment:', error);
		document.body.innerHTML = html`<div style="padding: 20px; color: red;">
			Error loading fragment: ${error.message}
		</div>`;
	}
}

// Initialize framework
export function initializeFramework() {
	// Initialize core first
	initializeCore();

	// Register all components first
	registerFrameworkComponents();

	// Framework initialized with all web components registered
}

// Components will be initialized explicitly when needed
